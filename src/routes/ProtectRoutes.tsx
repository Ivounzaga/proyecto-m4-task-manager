
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { Navigate } from 'react-router';

interface ProtectedRouteProps {
    user: User | null;
    children: ReactNode;
}

function ProtectedRoute({ user, children }: ProtectedRouteProps) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
