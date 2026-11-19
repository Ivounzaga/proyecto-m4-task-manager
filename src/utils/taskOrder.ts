
import type { Task } from '../types/tasks';

// Conserva tareas existentes que todavía no tienen el campo order.
function orderValue(task: Task): number {
    if (
        typeof task.order === 'number' &&
        Number.isFinite(task.order)
    ) {
        return task.order;
    }

    return task.createdAt?.toMillis?.() ?? 0;
}


export function sortTasksByOrder(
    tasks: readonly Task[]
): Task[] {
    return [...tasks].sort((a, b) => {
        const difference = orderValue(a) - orderValue(b);

        return difference || a.id.localeCompare(b.id);
    });
}


export function moveTask(
    tasks: readonly Task[],
    activeId: string,
    overId: string
): Task[] | null {
    const sorted = sortTasksByOrder(tasks);

    const oldIndex = sorted.findIndex(
        (task) => task.id === activeId
    );

    const newIndex = sorted.findIndex(
        (task) => task.id === overId
    );

    if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex === newIndex
    ) {
        return null;
    }

    const [moved] = sorted.splice(oldIndex, 1);

    sorted.splice(newIndex, 0, moved);

    return sorted.map((task, index) => ({
        ...task,
        order: index,
    }));
}
