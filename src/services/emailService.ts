
import { auth } from './firebase';

interface SummaryResponse {
    message?: string;
    error?: string;
    total?: number;
}

export async function sendTasksSummary(): Promise<string> {
    // 1. Recuperamos el usuario autenticado.
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }

    // 2. Obtenemos su token de Firebase.
    const token = await user.getIdToken();

    // 3. Enviamos una solicitud al backend.
    const response = await fetch('/api/send-summary', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    // 4. Leemos la respuesta del servidor.
    const data = (await response.json()) as SummaryResponse;

    if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar el resumen.');
    }

    return data.message || 'Resumen enviado correctamente.';
}
