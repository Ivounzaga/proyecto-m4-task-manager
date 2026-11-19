
import { useState, type FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password
                );

            setSuccess(
                `Bienvenido, ${userCredential.user.email}`
            );

            setEmail('');
            setPassword('');

        } catch (error) {
            console.error(
                'Error al iniciar sesión:',
                error
            );

            setError(
                'No se pudo iniciar sesión. ' +
                'Verificá tu correo y contraseña.'
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="tm-panel tm-auth-card">
            <h2>Bienvenido de nuevo</h2>

            <p className="tm-auth-subtitle">
                Ingresá para organizar tus tareas,
                administrar tus pendientes y seguir tu progreso.
            </p>

            <form
                className="tm-form"
                onSubmit={handleLogin}
            >
                <div className="tm-field">
                    <label htmlFor="login-email">
                        Correo electrónico
                    </label>

                    <input
                        id="login-email"
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
                    <label htmlFor="login-password">
                        Contraseña
                    </label>

                    <input
                        id="login-password"
                        type="password"
                        placeholder="Ingresá tu contraseña"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        autoComplete="current-password"
                        required
                    />
                </div>

                {error && (
                    <p role="alert" className="tm-error">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="tm-success">
                        {success}
                    </p>
                )}

                <button
                    className="tm-primary-button"
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Ingresando...'
                        : 'Iniciar sesión'}
                </button>
            </form>
        </section>
    );
}

export default LoginPage;
