
import { useState, type FormEvent } from 'react';

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from 'firebase/auth';

import { auth } from '../services/firebase';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password
                );

            try {
                await sendEmailVerification(
                    userCredential.user
                );

                alert(
                    'Cuenta creada correctamente. ' +
                    'Te enviamos un correo para verificar ' +
                    'tu dirección de email.'
                );

            } catch (verificationError) {
                console.error(
                    'Error al enviar la verificación:',
                    verificationError
                );

                alert(
                    'Tu cuenta fue creada, pero no pudimos ' +
                    'enviar el correo de verificación.'
                );
            }

            setEmail('');
            setPassword('');

        } catch (error) {
            console.error(
                'Error al registrar usuario:',
                error
            );

            setError(
                'No se pudo registrar el usuario. ' +
                'Verificá los datos o intentá con otro correo.'
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="tm-panel tm-auth-card">
            <h2>Creá tu cuenta</h2>

            <p className="tm-auth-subtitle">
                Empezá a gestionar tus actividades
                y organizá tus tareas en un solo lugar.
            </p>

            <form
                className="tm-form"
                onSubmit={handleRegister}
            >
                <div className="tm-field">
                    <label htmlFor="register-email">
                        Correo electrónico
                    </label>

                    <input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="tm-field">
                    <label htmlFor="register-password">
                        Contraseña
                    </label>

                    <input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        minLength={6}
                        required
                    />
                </div>

                {error && (
                    <p role="alert" className="tm-error">
                        {error}
                    </p>
                )}

                <button
                    className="tm-primary-button"
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Registrando...'
                        : 'Crear cuenta'}
                </button>
            </form>
        </section>
    );
}

export default RegisterPage;
