
import {
    addDoc,
    collection,
    onSnapshot,
    query,
    serverTimestamp,
    where,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    type Unsubscribe,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import type { Task, TaskPriority } from '../types/tasks';

// CREATE
export async function createTask(
    title: string,
    description: string,
    priority: TaskPriority = 'medium',
    dueDate: string = ''
): Promise<string> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
        throw new Error('El título es obligatorio.');
    }

    const taskRef = await addDoc(
        collection(db, 'tasks'),
        {
            userId: user.uid,
            title: cleanTitle,
            description: description.trim(),
            completed: false,
            createdAt: serverTimestamp(),
            priority,
            dueDate,
            order: Date.now(),
        }
    );

    return taskRef.id;
}

// READ: 
export function subscribeToMyTasks(
    onTasks: (tasks: Task[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const user = auth.currentUser;

    if (!user) {
        onError(new Error('No hay un usuario autenticado.'));
        return () => { };
    }

    const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
    );

    return onSnapshot(
        tasksQuery,
        (snapshot) => {
            const tasks: Task[] = snapshot.docs.map(
                (document) => ({
                    ...(document.data({
                        serverTimestamps: 'estimate',
                    }) as Omit<Task, 'id'>),
                    id: document.id,
                })
            );

            onTasks(tasks);
        },
        onError
    );
}

// UPDATE: 
export async function updateTaskCompleted(
    taskId: string,
    completed: boolean
): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('Tenés que iniciar sesión.');
    }

    await updateDoc(
        doc(db, 'tasks', taskId),
        { completed }
    );
}

// UPDATE: 
export async function updateTaskDetails(
    taskId: string,
    title: string,
    description: string,
    priority: TaskPriority = 'medium',
    dueDate: string = ''
): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('Tenés que iniciar sesión.');
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
        throw new Error('El título es obligatorio.');
    }

    await updateDoc(
        doc(db, 'tasks', taskId),
        {
            title: cleanTitle,
            description: description.trim(),
            priority,
            dueDate,
        }
    );
}

// UPDATE
export async function saveTaskOrder(
    taskIds: string[]
): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }


    if (
        taskIds.some((id) => !id) ||
        new Set(taskIds).size !== taskIds.length
    ) {
        throw new Error(
            'La lista contiene identificadores inválidos o repetidos.'
        );
    }


    if (taskIds.length > 400) {
        throw new Error(
            'Demasiadas tareas para guardar el orden.'
        );
    }

    if (taskIds.length === 0) return;

    const batch = writeBatch(db);

    taskIds.forEach((taskId, index) => {
        batch.update(
            doc(db, 'tasks', taskId),
            { order: index }
        );
    });

    await batch.commit();
}

// DELETE
export async function deleteTask(
    taskId: string
): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('Tenés que iniciar sesión.');
    }

    await deleteDoc(
        doc(db, 'tasks', taskId)
    );
}
