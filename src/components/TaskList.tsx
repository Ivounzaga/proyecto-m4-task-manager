
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';

import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type { Task, TaskPriority } from '../types/tasks';
import TaskCard from './TaskCard';

interface TaskListProps {
    tasks: Task[];
    totalTasks: number;
    loading: boolean;
    loadError: string;
    dragEnabled: boolean;
    editingTaskId: string | null;
    updatingTaskId: string | null;
    onDragEnd: (event: DragEndEvent) => Promise<void>;
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

export default function TaskList({
    tasks,
    totalTasks,
    loading,
    loadError,
    dragEnabled,
    editingTaskId,
    updatingTaskId,
    onDragEnd,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onToggleCompleted,
    onDelete,
}: TaskListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (loading) {
        return (
            <p className="tm-empty">
                Cargando tareas...
            </p>
        );
    }

    if (loadError) {
        return (
            <p role="alert" className="tm-error">
                {loadError}
            </p>
        );
    }

    if (totalTasks === 0) {
        return (
            <div className="tm-empty">
                <span aria-hidden="true">☑</span>
                <h4>Tu lista está vacía</h4>
                <p>Creá tu primera tarea para comenzar.</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="tm-empty">
                <h4>No encontramos tareas</h4>
                <p>
                    No hay tareas que coincidan con este filtro.
                </p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
                void onDragEnd(event);
            }}
        >
            <SortableContext
                items={tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
            >
                <ul className="tm-task-list">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            dragDisabled={!dragEnabled}
                            editing={editingTaskId === task.id}
                            updating={updatingTaskId === task.id}
                            onStartEditing={onStartEditing}
                            onCancelEditing={onCancelEditing}
                            onSaveEditing={onSaveEditing}
                            onToggleCompleted={onToggleCompleted}
                            onDelete={onDelete}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}
