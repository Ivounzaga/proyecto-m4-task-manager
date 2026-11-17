
import { useEffect, useState, type FormEvent } from 'react';

import {
    createTask,
    subscribeToMyTasks,
    updateTaskCompleted,
    updateTaskDetails,
    deleteTask,
} from '../services/taskService';

import type { Task } from '../types/tasks';

function TasksPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [tasks, setTasks] = useState<Task[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [success, setSuccess] = useState('');

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // READ: escuchar las tareas de Firestore
    useEffect(() => {
        const unsubscribe = subscribeToMyTasks(
            (newTasks) => {
                setTasks(newTasks);
                setLoadError('');
                setLoadingTasks(false);
            },
            (error) => {
                console.error('Error al cargar tareas:', error);
                setLoadError('No se pudieron cargar las tareas.');
                setLoadingTasks(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // CREATE: crear una tarea
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await createTask(title, description);

            setSuccess('Tarea creada correctamente');
            setTitle('');
            setDescription('');
        } catch (error) {
            console.error('Error al crear tarea:', error);
            setError('No se pudo crear la tarea.');
        } finally {
            setLoading(false);
        }
    }

    // UPDATE: completar o reabrir una tarea
    async function handleToggleCompleted(task: Task) {
        setError('');
        setSuccess('');
        setUpdatingTaskId(task.id);

        try {
            await updateTaskCompleted(task.id, !task.completed);

            setSuccess(
                task.completed
                    ? 'Tarea marcada como pendiente.'
                    : 'Tarea completada correctamente.'
            );
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            setError('No se pudo actualizar la tarea.');
        } finally {
            setUpdatingTaskId(null);
        }
    }

    function handleStartEditing(task: Task) {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description);
    }


    async function handleSaveEditing(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingTaskId) return;

        setError('');
        setSuccess('');
        setUpdatingTaskId(editingTaskId);

        try {
            await updateTaskDetails(
                editingTaskId,
                editTitle,
                editDescription
            );

            setSuccess('Tarea actualizada correctamente');
            setEditingTaskId(null);
            setEditTitle('');
            setEditDescription('');
        } catch (error) {
            console.error('Error al editar tarea:', error);
            setError('No se pudo editar la tarea.');
        } finally {
            setUpdatingTaskId(null);
        }
    }


    async function handleDeleteTask(task: Task) {
        const confirmed = window.confirm(
            `¿Estás seguro de eliminar la tarea "${task.title}"?`
        );

        if (!confirmed) return;

        setError('');
        setSuccess('');
        setUpdatingTaskId(task.id);

        try {
            await deleteTask(task.id);

            setSuccess('Tarea eliminada correctamente.');
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            setError('No se pudo eliminar la tarea.');
        } finally {
            setUpdatingTaskId(null);
        }
    }

    return (
        <section>
            <h2>Mis tareas</h2>
            <p>Gestioná tus tareas pendientes.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">Título</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description">Descripción</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Agregar tarea'}
                </button>
            </form>

            {error && <p role="alert">{error}</p>}
            {success && <p role="status">{success}</p>}

            <h3>Listado de tareas</h3>

            {loadingTasks ? (
                <p>Cargando tareas...</p>
            ) : loadError ? (
                <p role="alert">{loadError}</p>
            ) : tasks.length === 0 ? (
                <p>Todavía no tenés tareas registradas.</p>
            ) : (


                <ul>
                    {tasks.map((task) => (
                        <li key={task.id}>

                            {editingTaskId === task.id ? (

                                <form onSubmit={handleSaveEditing}>
                                    <div>
                                        <label htmlFor={`edit-title-${task.id}`}>
                                            Editar título
                                        </label>

                                        <input
                                            id={`edit-title-${task.id}`}
                                            type="text"
                                            value={editTitle}
                                            onChange={(event) =>
                                                setEditTitle(event.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor={`edit-description-${task.id}`}>
                                            Editar descripción
                                        </label>

                                        <textarea
                                            id={`edit-description-${task.id}`}
                                            value={editDescription}
                                            onChange={(event) =>
                                                setEditDescription(event.target.value)
                                            }
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={updatingTaskId === task.id}
                                    >
                                        {updatingTaskId === task.id
                                            ? 'Guardando...'
                                            : 'Guardar cambios'}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={updatingTaskId === task.id}
                                        onClick={() => setEditingTaskId(null)}
                                    >
                                        Cancelar
                                    </button>
                                </form>

                            ) : (

                                <>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            disabled={updatingTaskId === task.id}
                                            onChange={() => {
                                                void handleToggleCompleted(task);
                                            }}
                                        />
                                        {task.title}
                                    </label>

                                    <p>{task.description}</p>

                                    <p>
                                        Estado: {task.completed
                                            ? 'Completada'
                                            : 'Pendiente'}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => handleStartEditing(task)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updatingTaskId === task.id}
                                        onClick={() => {
                                            void handleDeleteTask(task);
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </>
                            )}

                        </li>
                    ))}
                </ul>

            )}
        </section>
    );
}

export default TasksPage;
