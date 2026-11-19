
import {
    useState,
    type CSSProperties,
    type FormEvent,
} from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type {
    Task,
    TaskPriority,
} from '../types/tasks';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
};

interface TaskCardProps {
    task: Task;
    dragDisabled: boolean;
    editing: boolean;
    updating: boolean;
    onStartEditing: (task: Task) => void;
    onCancelEditing: () => void;
    onSaveEditing: (
        taskId: string,
        title: string,
        description: string,
        priority: TaskPriority,
        dueDate: string
    ) => Promise<void>;
    onToggleCompleted: (task: Task) => Promise<void>;
    onDelete: (task: Task) => Promise<void>;
}

interface TaskEditFormProps {
    task: Task;
    updating: boolean;
    onCancel: () => void;
    onSave: TaskCardProps['onSaveEditing'];
}

function formatDueDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

function localToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(
        today.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
        today.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function TaskEditForm({
    task,
    updating,
    onCancel,
    onSave,
}: TaskEditFormProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(
        task.description
    );
    const [priority, setPriority] = useState<TaskPriority>(
        task.priority ?? 'medium'
    );
    const [dueDate, setDueDate] = useState(
        task.dueDate ?? ''
    );

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (updating) return;

        void onSave(
            task.id,
            title,
            description,
            priority,
            dueDate
        );
    }

    return (
        <form
            className="tm-edit-form"
            onSubmit={handleSubmit}
        >
            <div className="tm-field">
                <label htmlFor={`edit-title-${task.id}`}>
                    Editar título
                </label>
                <input
                    id={`edit-title-${task.id}`}
                    type="text"
                    value={title}
                    onChange={(event) =>
                        setTitle(event.target.value)
                    }
                    required
                />
            </div>

            <div className="tm-field">
                <label
                    htmlFor={`edit-description-${task.id}`}
                >
                    Editar descripción
                </label>
                <textarea
                    id={`edit-description-${task.id}`}
                    value={description}
                    onChange={(event) =>
                        setDescription(event.target.value)
                    }
                />
            </div>

            <div className="tm-extra-fields">
                <div className="tm-field">
                    <label
                        htmlFor={`edit-priority-${task.id}`}
                    >
                        Prioridad
                    </label>

                    <select
                        id={`edit-priority-${task.id}`}
                        value={priority}
                        onChange={(event) =>
                            setPriority(
                                event.target.value as TaskPriority
                            )
                        }
                    >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                    </select>
                </div>

                <div className="tm-field">
                    <label
                        htmlFor={`edit-due-date-${task.id}`}
                    >
                        Fecha de vencimiento
                    </label>

                    <input
                        id={`edit-due-date-${task.id}`}
                        type="date"
                        value={dueDate}
                        onChange={(event) =>
                            setDueDate(event.target.value)
                        }
                    />
                </div>
            </div>

            <div className="tm-task-actions">
                <button
                    className="tm-save-button"
                    type="submit"
                    disabled={updating}
                >
                    {updating
                        ? 'Guardando...'
                        : 'Guardar cambios'}
                </button>

                <button
                    className="tm-secondary-button"
                    type="button"
                    disabled={updating}
                    onClick={onCancel}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}

export default function TaskCard({
    task,
    dragDisabled,
    editing,
    updating,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onToggleCompleted,
    onDelete,
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled: dragDisabled,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1,
    };

    const classes = [
        'tm-task-card',
        task.completed ? 'tm-task-done' : '',
        isDragging ? 'tm-task-dragging' : '',
    ].filter(Boolean).join(' ');

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={classes}
        >
            <div className="tm-drag-row">
                <button
                    ref={setActivatorNodeRef}
                    type="button"
                    className="tm-drag-handle"
                    {...attributes}
                    {...listeners}
                    aria-label={`Mover tarea: ${task.title}`}
                    title={
                        dragDisabled
                            ? 'Habilitá Todas y el orden manual para mover'
                            : 'Arrastrar para reordenar'
                    }
                    disabled={dragDisabled}
                >
                    <span aria-hidden="true">⠿</span>
                </button>

                <div className="tm-drag-content">
                    {editing ? (
                        <TaskEditForm
                            task={task}
                            updating={updating}
                            onCancel={onCancelEditing}
                            onSave={onSaveEditing}
                        />
                    ) : (
                        <>
                            <div className="tm-task-top">
                                <label className="tm-task-label">
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        disabled={updating}
                                        onChange={() => {
                                            void onToggleCompleted(task);
                                        }}
                                    />

                                    <span className="tm-task-title">
                                        {task.title}
                                    </span>
                                </label>

                                <span
                                    className={
                                        task.completed
                                            ? 'tm-status tm-status-done'
                                            : 'tm-status tm-status-pending'
                                    }
                                >
                                    {task.completed
                                        ? 'Completada'
                                        : 'Pendiente'}
                                </span>
                            </div>

                            {task.description && (
                                <p className="tm-task-description">
                                    {task.description}
                                </p>
                            )}

                            <div className="tm-task-meta">
                                <span
                                    className={
                                        `tm-priority tm-priority-${task.priority ?? 'medium'}`
                                    }
                                >
                                    Prioridad {
                                        PRIORITY_LABEL[
                                        task.priority ?? 'medium'
                                        ]
                                    }
                                </span>

                                {task.dueDate && (
                                    <span
                                        className={
                                            !task.completed &&
                                                task.dueDate < localToday()
                                                ? 'tm-due-date tm-due-date-overdue'
                                                : 'tm-due-date'
                                        }
                                    >
                                        Vence: {
                                            formatDueDate(task.dueDate)
                                        }
                                    </span>
                                )}
                            </div>

                            <div className="tm-task-actions">
                                <button
                                    className="tm-edit-button"
                                    type="button"
                                    disabled={updating}
                                    onClick={() =>
                                        onStartEditing(task)
                                    }
                                >
                                    <span aria-hidden="true">✎</span>
                                    {' '}Editar
                                </button>

                                <button
                                    className="tm-delete-button"
                                    type="button"
                                    disabled={updating}
                                    onClick={() => {
                                        void onDelete(task);
                                    }}
                                >
                                    <span aria-hidden="true">×</span>
                                    {' '}Eliminar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}
