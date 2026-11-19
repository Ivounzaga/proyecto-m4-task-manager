
import { useState } from 'react';

import {
    reload,
    sendEmailVerification,
} from 'firebase/auth';

import { auth } from '../services/firebase';
import { sendTasksSummary } from '../services/emailService';

function EmailSummary() {
    const [emailVerified, setEmailVerified] = useState(
        () => auth.currentUser?.emailVerified ?? false
    );

    const [checkingVerification, setCheckingVerification] =
        useState(false);

    const [resendingVerification, setResendingVerification] =
        useState(false);

    const [verificationMessage, setVerificationMessage] =
        useState('');

    const [verificationError, setVerificationError] =
        useState(false);

    const [sendingSummary, setSendingSummary] =
        useState(false);

    const [summaryMessage, setSummaryMessage] =
        useState('');

    const [summaryError, setSummaryError] =
        useState(false);

    // Reenviar el correo de verificación.
    async function handleResendVerification() {
        const user = auth.currentUser;

        setVerificationMessage('');
        setVerificationError(false);

        if (!user) {
            setVerificationError(true);
            setVerificationMessage(
                'Tenés que iniciar sesión.'
            );
            return;
        }

        setResendingVerification(true);

        try {
            await reload(user);

            if (user.emailVerified) {
                await user.getIdToken(true);
                setEmailVerified(true);
                setVerificationMessage(
                    'Tu correo ya está verificado.'
                );
                return;
            }

            await sendEmailVerification(user);

            setVerificationMessage(
                'Te enviamos un nuevo correo de verificación. ' +
                'Revisá también la carpeta de spam.'
            );

        } catch (error) {
            console.error(
                'Error al reenviar verificación:',
                error
            );

            setVerificationError(true);
            setVerificationMessage(
                'No pudimos reenviar el correo. ' +
                'Intentá nuevamente más tarde.'
            );

        } finally {
            setResendingVerification(false);
        }
    }

    // Consultar el estado de verificación en Firebase.
    async function handleCheckVerification() {
        const user = auth.currentUser;

        setVerificationMessage('');
        setVerificationError(false);

        if (!user) {
            setVerificationError(true);
            setVerificationMessage(
                'Tenés que iniciar sesión.'
            );
            return;
        }

        setCheckingVerification(true);

        try {
            await reload(user);

            if (user.emailVerified) {
                await user.getIdToken(true);

                setEmailVerified(true);
                setVerificationMessage(
                    'Correo verificado correctamente. ' +
                    'Ya podés recibir tus resúmenes.'
                );

            } else {
                setEmailVerified(false);
                setVerificationMessage(
                    'Tu correo todavía no está verificado. ' +
                    'Abrí el enlace que recibiste por email.'
                );
            }

        } catch (error) {
            console.error(
                'Error al comprobar verificación:',
                error
            );

            setVerificationError(true);
            setVerificationMessage(
                'No pudimos comprobar el estado del correo.'
            );

        } finally {
            setCheckingVerification(false);
        }
    }

    // Enviar el resumen mediante el servicio existente.
    async function handleSendSummary() {
        const user = auth.currentUser;

        if (!user || !emailVerified) {
            setVerificationError(true);
            setVerificationMessage(
                'Primero tenés que verificar tu correo.'
            );
            return;
        }

        setSendingSummary(true);
        setSummaryMessage('');
        setSummaryError(false);

        try {
            const message = await sendTasksSummary();
            setSummaryMessage(message);

        } catch (error) {
            setSummaryError(true);
            setSummaryMessage(
                error instanceof Error
                    ? error.message
                    : 'Ocurrió un error al enviar el resumen.'
            );

        } finally {
            setSendingSummary(false);
        }
    }

    const verifying =
        checkingVerification || resendingVerification;

    return (
        <>
            <section className="tm-email-panel">
                <div className="tm-email-content">
                    <span
                        className="tm-email-icon"
                        aria-hidden="true"
                    >
                        ✉
                    </span>

                    <div>
                        <h3>Resumen general</h3>

                        {emailVerified ? (
                            <p>
                                Recibí por email un resumen de
                                todas tus tareas, pendientes y
                                completadas.
                            </p>
                        ) : (
                            <p>
                                Para recibir tus resúmenes,
                                primero verificá tu correo
                                electrónico.
                            </p>
                        )}
                    </div>
                </div>

                {emailVerified ? (
                    <button
                        className="tm-email-button"
                        type="button"
                        onClick={() => {
                            void handleSendSummary();
                        }}
                        disabled={sendingSummary}
                    >
                        <span aria-hidden="true">✉</span>

                        {sendingSummary
                            ? 'Enviando resumen...'
                            : 'Enviar resumen por email'}
                    </button>
                ) : (
                    <>
                        <button
                            className="tm-email-button"
                            type="button"
                            onClick={() => {
                                void handleResendVerification();
                            }}
                            disabled={verifying}
                        >
                            {resendingVerification
                                ? 'Reenviando...'
                                : 'Reenviar correo'}
                        </button>

                        <button
                            className="tm-email-button"
                            type="button"
                            onClick={() => {
                                void handleCheckVerification();
                            }}
                            disabled={verifying}
                        >
                            {checkingVerification
                                ? 'Comprobando...'
                                : 'Ya verifiqué mi email'}
                        </button>
                    </>
                )}
            </section>

            {verificationMessage && (
                <p
                    role={
                        verificationError
                            ? 'alert'
                            : 'status'
                    }
                    className={
                        verificationError
                            ? 'tm-error'
                            : 'tm-success'
                    }
                >
                    {verificationMessage}
                </p>
            )}

            {summaryMessage && (
                <p
                    role={summaryError ? 'alert' : 'status'}
                    className={
                        summaryError
                            ? 'tm-error'
                            : 'tm-success'
                    }
                >
                    {summaryMessage}
                </p>
            )}
        </>
    );
}

export default EmailSummary;
