
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

    type Unsubscribe,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import type { Task } from '../types/tasks';

// CREATE: crear una tarea
export async function createTask(
    title: string,
    description: string
): Promise<string> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
        throw new Error('El título es obligatorio.');
    }

    const docRef = await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: cleanTitle,
        description: cleanDescription,
        completed: false,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}

// READ: escuchar las tareas del usuario
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
            const tasks: Task[] = snapshot.docs.map((document) => ({
                ...(document.data({
                    serverTimestamps: 'estimate',
                }) as Omit<Task, 'id'>),
                id: document.id,
            }));

            onTasks(tasks);
        },
        onError
    );
}


export async function updateTaskCompleted(
    taskId: string,
    completed: boolean
): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }

    const taskRef = doc(db, 'tasks', taskId);

    await updateDoc(taskRef, {
        completed: completed,
    });
}


export async function updateTaskDetails(
    taskId: string,
    title: string,
    description: string
): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
        throw new Error('El título es obligatorio.');
    }

    const taskRef = doc(db, 'tasks', taskId);

    await updateDoc(taskRef, {
        title: cleanTitle,
        description: cleanDescription,
    });
}


export async function deleteTask(taskId: string): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Tenés que iniciar sesión.');
    }

    const taskRef = doc(db, 'tasks', taskId);

    await deleteDoc(taskRef);
}

