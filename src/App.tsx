
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Routes, Route, Navigate, Link } from 'react-router';

import { auth } from './services/firebase';

import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TasksPage from './pages/TasksPage';
import ProtectedRoute from './routes/ProtectRoutes';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingSession(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    setLogoutError('');

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setLogoutError('No se pudo cerrar sesión.');
    }
  }

  return (
    <>
      <Header />

      <main>
        {loadingSession ? (
          <p>Verificando sesión...</p>
        ) : (
          <>
            {!user && (
              <nav aria-label="Acceso">
                <Link to="/login">Iniciar sesión</Link>
                {' | '}
                <Link to="/register">Crear cuenta</Link>
              </nav>
            )}

            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    to={user ? '/tasks' : '/login'}
                    replace
                  />
                }
              />

              <Route
                path="/login"
                element={
                  user ? <Navigate to="/tasks" replace /> : <LoginPage />
                }
              />

              <Route
                path="/register"
                element={
                  user ? <Navigate to="/tasks" replace /> : <RegisterPage />
                }
              />

              <Route
                path="/tasks"
                element={
                  <ProtectedRoute user={user}>
                    <p>Bienvenido, {user?.email}</p>

                    <button type="button" onClick={handleLogout}>
                      Cerrar sesión
                    </button>

                    {logoutError && <p role="alert">{logoutError}</p>}

                    <TasksPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to={user ? '/tasks' : '/login'}
                    replace
                  />
                }
              />
            </Routes>
          </>
        )}
      </main>
    </>
  );
}

export default App;
