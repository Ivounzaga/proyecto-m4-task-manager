import {
    useEffect,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';

import type { TaskPriority } from '../types/tasks';

export interface CreateTaskInput {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
}

interface CreateTaskModalProps {
    loading: boolean;
    error: string;
    onClose: () => void;
    onCreate: (values: CreateTaskInput) => Promise<void>;
}

export default function CreateTaskModal({
    loading,
    error,
    onClose,
    onCreate,
}: CreateTaskModalProps) {
    // Los campos pertenecen al modal: se reinician al desmontarlo.
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        // Evitar que se desplace el fondo mientras el modal esta abierto.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    function close() {
        if (!loading) onClose();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        if (event.key !== 'Tab') return;

        // Mantenemos la navegacion por teclado dentro del formulario.
        const elements = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)'
            )
        );

        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first || !last) return;

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;

        await onCreate({ title, description, priority, dueDate });
    }

    return (
        <div
            className="tm-modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
            }}
        >
            <div
                className="tm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tm-create-title"
                onKeyDown={handleKeyDown}
            >
                <div className="tm-modal-header">
                    <div>
                        <h3 id="tm-create-title">Nueva tarea</h3>
                        <p>Completá los datos para agregar una actividad.</p>
                    </div>

                    <button
                        type="button"
                        className="tm-modal-close"
                        aria-label="Cerrar formulario"
                        onClick={close}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                <form className="tm-form tm-modal-form" onSubmit={handleSubmit}>
                    <div className="tm-field">
                        <label htmlFor="title">Título</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="Ej. Terminar proyecto M4"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="tm-field">
                        <label htmlFor="description">Descripción</label>
                        <textarea
                            id="description"
                            placeholder="Agregá una descripción..."
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </div>

                    <div className="tm-extra-fields">
                        <div className="tm-field">
                            <label htmlFor="priority">Prioridad</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(event) =>
                                    setPriority(event.target.value as TaskPriority)
                                }
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>

                        <div className="tm-field">
                            <label htmlFor="due-date">Fecha de vencimiento (opcional)</label>
                            <input
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={(event) => setDueDate(event.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="tm-error">
                            {error}
                        </p>
                    )}

                    <div className="tm-modal-actions">
                        <button
                            type="button"
                            className="tm-secondary-button"
                            onClick={close}
                            disabled={loading}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="tm-primary-button"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
