
/**
 * @vitest-environment node
 */

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

// Función simulada para verificar tokens.
const { verifyIdTokenMock } = vi.hoisted(() => ({
    verifyIdTokenMock: vi.fn(),
}));

// Simulamos Firebase Admin.
vi.mock('firebase-admin/app', () => ({
    getApps: () => [{}],
    initializeApp: vi.fn(),
    cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        verifyIdToken: verifyIdTokenMock,
    }),
}));

import sendSummary from '../../api/send-summary';

beforeEach(() => {
    verifyIdTokenMock.mockReset();
});

describe('API send-summary', () => {

    it('rechaza solicitudes GET con error 405', async () => {
        const request = new Request(
            'http://localhost/api/send-summary',
            { method: 'GET' }
        );

        const response = await sendSummary.fetch(request);

        expect(response.status).toBe(405);
    });

    it('rechaza solicitudes POST sin autenticación', async () => {
        const request = new Request(
            'http://localhost/api/send-summary',
            { method: 'POST' }
        );

        const response = await sendSummary.fetch(request);

        expect(response.status).toBe(401);
    });

    it('rechaza un token inválido con error 401', async () => {
        const simulatedError = Object.assign(
            new Error('Token inválido'),
            { code: 'auth/invalid-id-token' }
        );

        verifyIdTokenMock.mockRejectedValue(simulatedError);

        const request = new Request(
            'http://localhost/api/send-summary',
            {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer token-falso',
                },
            }
        );

        const response = await sendSummary.fetch(request);

        expect(response.status).toBe(401);

        const data = await response.json();

        expect(data.error).toBe('Token inválido o vencido.');
    });

});

