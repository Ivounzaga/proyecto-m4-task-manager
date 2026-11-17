
import { useState, type FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            setSuccess(`Bienvenido, ${userCredential.user.email}`);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setError('No se pudo iniciar sesión. Revisá tus datos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section>
            <h2>Iniciar sesión</h2>

            <form onSubmit={handleLogin}>
                <label htmlFor="email">Correo electrónico</label>

                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                />

                <label htmlFor="password">Contraseña</label>

                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <p role="alert">{error}</p>}
                {success && <p role="status">{success}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
            </form>
        </section>
    );
}

export default LoginPage;
