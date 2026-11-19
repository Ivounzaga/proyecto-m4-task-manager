
import type { ReactNode } from 'react';

interface HeaderProps {
    children?: ReactNode;
}

function Header({ children }: HeaderProps) {
    return (
        <header className="tm-site-header">
            <div className="tm-header-inner">

                <div className="tm-brand">
                    <span className="tm-brand-icon">
                        ✓
                    </span>

                    <h1>Task Manager</h1>
                </div>

                <div className="tm-header-actions">
                    {children}
                </div>

            </div>
        </header>
    );
}

export default Header;
