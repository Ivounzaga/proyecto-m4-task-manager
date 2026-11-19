
import {
    cert,
    getApps,
    initializeApp,
} from 'firebase-admin/app';

import {
    getAuth,
    type DecodedIdToken,
} from 'firebase-admin/auth';

import { getFirestore } from 'firebase-admin/firestore';

import {
    SESClient,
    SendEmailCommand,
} from '@aws-sdk/client-ses';

const COOLDOWN_MS = 5 * 60 * 1000;
const MAX_TASK_DETAILS = 100;

// Inicializar Firebase Admin solo en el servidor.
function getAdminApp() {
    const existingApp = getApps()[0];

    if (existingApp) {
        return existingApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Falta configurar Firebase Admin.');
    }

    return initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
}

function getErrorCode(error: unknown): string | undefined {
    if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
    ) {
        return error.code;
    }

    return undefined;
}

export default {
    async fetch(request: Request): Promise<Response> {

        // 1. Solo aceptamos POST.
        if (request.method !== 'POST') {
            return Response.json(
                { error: 'Metodo no permitido.' },
                {
                    status: 405,
                    headers: { Allow: 'POST' },
                }
            );
        }

        // 2. Comprobar que se envio un token.
        const authorization =
            request.headers.get('authorization');

        if (!authorization?.startsWith('Bearer ')) {
            return Response.json(
                { error: 'No autorizado.' },
                { status: 401 }
            );
        }

        const token = authorization.slice(7).trim();

        if (!token || token.length > 10000) {
            return Response.json(
                { error: 'Token invalido.' },
                { status: 401 }
            );
        }

        try {
            const app = getAdminApp();

            // 3. Verificar identidad y revocacion.
            let decodedToken: DecodedIdToken;

            try {
                decodedToken = await getAuth(app)
                    .verifyIdToken(token, true);

            } catch (error) {
                const code = getErrorCode(error);

                const invalidTokenCodes = [
                    'auth/invalid-id-token',
                    'auth/id-token-expired',
                    'auth/id-token-revoked',
                    'auth/user-disabled',
                    'auth/argument-error',
                    'auth/invalid-argument',
                ];

                if (
                    code &&
                    invalidTokenCodes.includes(code)
                ) {
                    return Response.json(
                        {
                            error: 'Token inválido o vencido.',
                        },
                        { status: 401 }
                    );
                }

                throw error;
            }

            // 4. Comprobar email asociado.
            if (!decodedToken.email) {
                return Response.json(
                    {
                        error: 'El usuario no tiene un email asociado.',
                    },
                    { status: 400 }
                );
            }

            // 5. Comprobar email verificado.
            if (decodedToken.email_verified !== true) {
                return Response.json(
                    {
                        error: 'Primero tenes que verificar tu correo electronico.',
                    },
                    { status: 403 }
                );
            }

            const fromEmail =
                process.env.AWS_SES_FROM_EMAIL;

            if (!fromEmail) {
                throw new Error(
                    'Falta configurar el remitente de SES.'
                );
            }

            const firestore = getFirestore(app);

            // 6. Limite de una solicitud cada 5 minutos.
            // Se guarda en Firestore, no en memoria local.
            const limitRef = firestore
                .collection('emailSummaryLimits')
                .doc(decodedToken.uid);

            const now = Date.now();

            const limitResult =
                await firestore.runTransaction(
                    async (transaction) => {
                        const snapshot =
                            await transaction.get(limitRef);

                        const lastRequestAt = snapshot.exists
                            ? snapshot.get('lastRequestAt')
                            : undefined;

                        if (
                            typeof lastRequestAt === 'number' &&
                            now - lastRequestAt < COOLDOWN_MS
                        ) {
                            const remaining = COOLDOWN_MS -
                                (now - lastRequestAt);

                            return {
                                allowed: false,
                                retryAfterSeconds:
                                    Math.max(
                                        1,
                                        Math.ceil(remaining / 1000)
                                    ),
                            };
                        }

                        transaction.set(limitRef, {
                            lastRequestAt: now,
                        });

                        return {
                            allowed: true,
                            retryAfterSeconds: 0,
                        };
                    }
                );

            if (!limitResult.allowed) {
                return Response.json(
                    {
                        error:
                            'Ya solicitaste un resumen recientemente. ' +
                            'Intenta nuevamente en unos minutos.',
                    },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(
                                limitResult.retryAfterSeconds
                            ),
                        },
                    }
                );
            }

            // 7. Obtener solamente las tareas propias.
            const snapshot = await firestore
                .collection('tasks')
                .where('userId', '==', decodedToken.uid)
                .get();

            const tasks = snapshot.docs.map((document) => ({
                title: String(
                    document.get('title') ?? ''
                ),
                description: String(
                    document.get('description') ?? ''
                ),
                completed:
                    document.get('completed') === true,
            }));

            const completed = tasks.filter(
                (task) => task.completed
            ).length;

            const pending = tasks.length - completed;

            // 8. Preparar un resumen con un limite de detalle.
            const visibleTasks = tasks.slice(
                0,
                MAX_TASK_DETAILS
            );

            const taskDetails = visibleTasks.map(
                (task, index) => {
                    const status = task.completed
                        ? 'Completada'
                        : 'Pendiente';

                    const title = task.title.slice(0, 200);
                    const description =
                        task.description.slice(0, 500);

                    return `${index + 1}. ${title}
Estado: ${status}
Descripcion: ${description}`;
                }
            ).join('\n\n');

            const remainingTasks =
                tasks.length - visibleTasks.length;

            const extraMessage = remainingTasks > 0
                ? `\n\nHay ${remainingTasks} tareas adicionales que no se detallan en este correo.`
                : '';

            const body = `Resumen de tareas - Task Manager M4

Total de tareas: ${tasks.length}
Completadas: ${completed}
Pendientes: ${pending}

${taskDetails || 'No tenes tareas registradas.'}${extraMessage}`;

            // 9. Enviar mediante Amazon SES.
            const ses = new SESClient({
                region: process.env.AWS_REGION || 'us-east-2',
            });

            await ses.send(
                new SendEmailCommand({
                    Source: fromEmail,
                    Destination: {
                        ToAddresses: [decodedToken.email],
                    },
                    Message: {
                        Subject: {
                            Data: 'Resumen de tareas - Task Manager M4',
                            Charset: 'UTF-8',
                        },
                        Body: {
                            Text: {
                                Data: body,
                                Charset: 'UTF-8',
                            },
                        },
                    },
                })
            );

            return Response.json({
                message: 'Resumen enviado correctamente.',
                total: tasks.length,
            });

        } catch (error) {
            console.error(
                'Error en send-summary:',
                error
            );

            return Response.json(
                {
                    error: 'No se pudo procesar la solicitud.',
                },
                { status: 500 }
            );
        }
    },
};
