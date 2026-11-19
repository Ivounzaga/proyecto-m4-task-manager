import { useEffect, useRef, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';

import {
    createTask,
    subscribeToMyTasks,
    updateTaskCompleted,
    updateTaskDetails,
    deleteTask,
    saveTaskOrder,
} from '../services/taskService';
import type { Task, TaskPriority } from '../types/tasks';
import { moveTask, sortTasksByOrder } from '../utils/taskOrder';

import CreateTaskModal, {
    type CreateTaskInput,
} from '../components/createTaskModal';
import EmailSummary from '../components/EmailSummary';
import TaskStats from '../components/TaskStats';
import TaskFilters, { type TaskFilter } from '../components/TaskFilters';
import TaskList from '../components/TaskList';

const PRIORITY_RANK: Record<TaskPriority, number> = {
    low: 1,
    medium: 2,
    high: 3,
};

function TasksPage() {
    // Estados que afectan a toda la pagina.
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [filter, setFilter] = useState<TaskFilter>('all');
    const [sortByPriority, setSortByPriority] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const addTaskButtonRef = useRef<HTMLButtonElement>(null);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Una sola suscripcion en tiempo real para toda la pagina.
    useEffect(() => {
        const unsubscribe = subscribeToMyTasks(
            (newTasks) => {
                setTasks(newTasks);
                setLoadError('');
                setLoadingTasks(false);
            },
            (subscriptionError) => {
                console.error('Error al cargar tareas:', subscriptionError);
                setLoadError('No se pudieron cargar las tareas.');
                setLoadingTasks(false);
            }
        );

        return () => unsubscribe();
    }, []);


    const manuallySortedTasks = sortTasksByOrder(tasks);
    const filteredTasks = manuallySortedTasks
        .filter((task) => {
            if (filter === 'completed') return task.completed;
            if (filter === 'pending') return !task.completed;
            return true;
        })
        .sort((a, b) => {
            if (!sortByPriority) return 0;
            return (
                PRIORITY_RANK[b.priority ?? 'medium'] -
                PRIORITY_RANK[a.priority ?? 'medium']
            );
        });

    const dragEnabled =
        filter === 'all' &&
        !sortByPriority &&
        !savingOrder &&
        editingTaskId === null &&
        updatingTaskId === null;

    function openCreateModal() {
        setError('');
        setShowCreateModal(true);
    }

    function closeCreateModal() {
        if (creatingTask) return;
        setShowCreateModal(false);
        setError('');
        addTaskButtonRef.current?.focus();
    }

    async function handleCreateTask(values: CreateTaskInput): Promise<void> {
        setError('');
        setSuccess('');
        setCreatingTask(true);

        try {
            await createTask(
                values.title,
                values.description,
                values.priority,
                values.dueDate
            );
            setSuccess('Tarea creada correctamente');
            setShowCreateModal(false);
            addTaskButtonRef.current?.focus();
        } catch (creationError) {
            console.error('Error al crear tarea:', creationError);
            setError('No se pudo crear la tarea.');
        } finally {
            setCreatingTask(false);
        }
    }

    async function handleToggleCompleted(task: Task): Promise<void> {
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
        } catch (updateError) {
            console.error('Error al actualizar tarea:', updateError);
            setError('No se pudo actualizar la tarea.');
        } finally {
            setUpdatingTaskId(null);
        }
    }

    async function handleSaveEditing(
        taskId: string,
        title: string,
        description: string,
        priority: TaskPriority,
        dueDate: string
    ): Promise<void> {
        setError('');
        setSuccess('');
        setUpdatingTaskId(taskId);

        try {
            await updateTaskDetails(taskId, title, description, priority, dueDate);
            setSuccess('Tarea actualizada correctamente');
            setEditingTaskId(null);
        } catch (updateError) {
            console.error('Error al editar tarea:', updateError);
            setError('No se pudo editar la tarea.');
        } finally {
            setUpdatingTaskId(null);
        }
    }

    async function handleDeleteTask(task: Task): Promise<void> {
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
        } catch (deleteError) {
            console.error('Error al eliminar tarea:', deleteError);
            setError('No se pudo eliminar la tarea.');
        } finally {
            setUpdatingTaskId(null);
        }
    }

    async function handleDragEnd(event: DragEndEvent): Promise<void> {
        if (!dragEnabled || !event.over || event.active.id === event.over.id) {
            return;
        }

        const reordered = moveTask(
            tasks,
            String(event.active.id),
            String(event.over.id)
        );
        if (!reordered) return;

        const previousTasks = tasks;
        setTasks(reordered);
        setSavingOrder(true);
        setError('');
        setSuccess('');

        try {
            await saveTaskOrder(reordered.map((task) => task.id));
            setSuccess('Orden de tareas guardado correctamente.');
        } catch (orderError) {
            console.error('Error al guardar el orden:', orderError);
            setTasks(previousTasks);
            setError('No se pudo guardar el nuevo orden de las tareas.');
        } finally {
            setSavingOrder(false);
        }
    }

    return (
        <section className="tm-dashboard">
            <div className="tm-intro">
                <div>
                    <span className="tm-eyebrow">
                        TU ESPACIO DE PRODUCTIVIDAD
                    </span>
                    <h2>Mis tareas</h2>
                    <p>
                        Organizá tus actividades, administrá tus
                        pendientes y seguí tu progreso.
                    </p>
                </div>
                <span className="tm-intro-chip">
                    <span aria-hidden="true">✦</span>
                    Mi espacio
                </span>
            </div>

            <EmailSummary />
            <TaskStats tasks={tasks} />

            <div className="tm-tasks-full-width">
                <section className="tm-panel tm-list-panel">
                    <div className="tm-list-heading">
                        <div>
                            <h3>Listado de tareas</h3>
                            <p>Gestioná tus actividades.</p>
                        </div>
                        <div className="tm-list-actions">
                            <span className="tm-task-counter">
                                {tasks.length} tareas
                            </span>
                            <button
                                ref={addTaskButtonRef}
                                type="button"
                                className="tm-add-button"
                                onClick={openCreateModal}
                            >
                                <span aria-hidden="true">＋</span>
                                Agregar tarea
                            </button>
                        </div>
                    </div>

                    <TaskFilters
                        filter={filter}
                        sortByPriority={sortByPriority}
                        onChangeFilter={setFilter}
                        onTogglePriority={() => setSortByPriority((previous) => !previous)}
                    />

                    <p className="tm-drag-hint" role="status">
                        {savingOrder
                            ? 'Guardando el nuevo orden...'
                            : dragEnabled
                                ? 'Arrastrá las tareas desde el ícono de puntos para ordenarlas.'
                                : 'Para reordenar manualmente, seleccioná Todas, desactivá Ordenar por prioridad y terminá cualquier edición.'}
                    </p>

                    <TaskList
                        tasks={filteredTasks}
                        totalTasks={tasks.length}
                        loading={loadingTasks}
                        loadError={loadError}
                        dragEnabled={dragEnabled}
                        editingTaskId={editingTaskId}
                        updatingTaskId={updatingTaskId}
                        onDragEnd={handleDragEnd}
                        onStartEditing={(task) => setEditingTaskId(task.id)}
                        onCancelEditing={() => setEditingTaskId(null)}
                        onSaveEditing={handleSaveEditing}
                        onToggleCompleted={handleToggleCompleted}
                        onDelete={handleDeleteTask}
                    />
                </section>
            </div>

            {error && !showCreateModal && (
                <p role="alert" className="tm-error">{error}</p>
            )}
            {success && (
                <p role="status" className="tm-success">{success}</p>
            )}

            {showCreateModal && (
                <CreateTaskModal
                    loading={creatingTask}
                    error={error}
                    onCreate={handleCreateTask}
                    onClose={closeCreateModal}
                />
            )}
        </section>
    );
}

export default TasksPage;
