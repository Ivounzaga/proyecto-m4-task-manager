
import { useState, type FormEvent } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await createUserWithEmailAndPassword(auth, email, password);

            alert('Usuario registrado correctamente');

            setEmail('');
            setPassword('');
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            setError('No se pudo registrar el usuario. Verificá los datos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section>
            <h2>Crear cuenta</h2>

            <form onSubmit={handleRegister}>
                <label htmlFor="email">Correo electrónico</label>

                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label htmlFor="password">Contraseña</label>

                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                />

                {error && <p role="alert">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrarme'}
                </button>
            </form>
        </section>
    );
}

export default RegisterPage;
