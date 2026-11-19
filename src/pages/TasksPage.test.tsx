
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TasksPage from './TasksPage';

import {
    createTask,
    subscribeToMyTasks,
    updateTaskCompleted,
    updateTaskDetails,
    deleteTask,
} from '../services/taskService';

import { Timestamp } from 'firebase/firestore';
import type { Task } from '../types/tasks';
import { sendTasksSummary } from '../services/emailService';

// ======================================
// MOCKS DE FIRESTORE
// ======================================


vi.mock('../services/taskService', () => ({
    createTask: vi.fn(),
    subscribeToMyTasks: vi.fn(),
    updateTaskCompleted: vi.fn(),
    updateTaskDetails: vi.fn(),
    deleteTask: vi.fn(),

    // drag & drop.
    saveTaskOrder: vi.fn(),
}));


vi.mock('../services/emailService', () => ({
    sendTasksSummary: vi.fn(),
}));


vi.mock('../services/firebase', () => ({
    auth: {
        currentUser: {
            uid: 'usuario-456',
            email: 'test@example.com',
            emailVerified: true,
            getIdToken: vi.fn().mockResolvedValue('token-de-prueba'),
        },
    },
}));


// ======================================
// CONFIGURACIÓN INICIAL
// ======================================

beforeEach(() => {
    vi.clearAllMocks();


    vi.mocked(subscribeToMyTasks).mockImplementation(
        (onTasks) => {
            onTasks([]);
            return () => { };
        }
    );

    vi.mocked(sendTasksSummary).mockResolvedValue(
        'Resumen enviado correctamente.'
    );
});


// TESTS DE TASKSPAGE


describe('TasksPage', () => {


    // TEST RENDERIZADO


    it('muestra el título y el botón de enviar resumen', () => {
        render(<TasksPage />);

        expect(
            screen.getByRole('heading', {
                name: 'Mis tareas',
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Enviar resumen por email',
            })
        ).toBeInTheDocument();


        expect(
            screen.getByRole('button', {
                name: 'Agregar tarea',
            })
        ).toBeInTheDocument();
    });


    // TEST: ENVÍO DE RESUMEN

    it('envía el resumen cuando el usuario hace clic', async () => {
        const user = userEvent.setup();

        render(<TasksPage />);

        const button = screen.getByRole('button', {
            name: 'Enviar resumen por email',
        });

        await user.click(button);

        expect(sendTasksSummary).toHaveBeenCalledTimes(1);

        expect(
            await screen.findByText(
                'Resumen enviado correctamente.'
            )
        ).toBeInTheDocument();
    });


    // TEST: CREAR TAREA DESDE EL MODAL


    it('crea una tarea desde el formulario emergente', async () => {
        const user = userEvent.setup();

        vi.mocked(createTask).mockResolvedValue(
            'nueva-tarea-123'
        );

        render(<TasksPage />);


        await user.click(
            screen.getByRole('button', {
                name: 'Agregar tarea',
            })
        );


        expect(
            screen.getByRole('dialog', {
                name: 'Nueva tarea',
            })
        ).toBeInTheDocument();


        await user.type(
            screen.getByRole('textbox', {
                name: 'Título',
            }),
            'Estudiar React'
        );


        await user.type(
            screen.getByRole('textbox', {
                name: 'Descripción',
            }),
            'Repasar los componentes'
        );


        await user.click(
            screen.getByRole('button', {
                name: 'Guardar tarea',
            })
        );


        expect(createTask).toHaveBeenCalledWith(
            'Estudiar React',
            'Repasar los componentes',
            'medium',
            ''
        );

        // Comprobamos que la creación fue exitosa.
        expect(
            await screen.findByText(
                'Tarea creada correctamente'
            )
        ).toBeInTheDocument();

        // Cierre de moodal
        expect(
            screen.queryByRole('dialog', {
                name: 'Nueva tarea',
            })
        ).not.toBeInTheDocument();
    });


    // TEST: COMPLETAR TAREA


    it('marca una tarea pendiente como completada', async () => {
        const user = userEvent.setup();


        const task: Task = {
            id: 'tarea-123',
            userId: 'usuario-456',
            title: 'Terminar proyecto',
            description: 'Completar el M4',
            completed: false,
            createdAt: Timestamp.fromMillis(0),
            priority: 'medium',
            dueDate: '',
            order: 0,
        };


        vi.mocked(subscribeToMyTasks).mockImplementation(
            (onTasks) => {
                onTasks([task]);
                return () => { };
            }
        );

        vi.mocked(updateTaskCompleted).mockResolvedValue(
            undefined
        );

        render(<TasksPage />);


        await user.click(
            screen.getByRole('checkbox')
        );


        expect(updateTaskCompleted).toHaveBeenCalledWith(
            'tarea-123',
            true
        );

        expect(
            await screen.findByText(
                'Tarea completada correctamente.'
            )
        ).toBeInTheDocument();
    });


    // TEST: EDITAR TAREA


    it('permite editar el título y descripción de una tarea', async () => {
        const user = userEvent.setup();

        const task: Task = {
            id: 'tarea-123',
            userId: 'usuario-456',
            title: 'Título original',
            description: 'Descripción original',
            completed: false,
            createdAt: Timestamp.fromMillis(0),
            priority: 'medium',
            dueDate: '',
            order: 0,
        };


        vi.mocked(subscribeToMyTasks).mockImplementation(
            (onTasks) => {
                onTasks([task]);
                return () => { };
            }
        );


        vi.mocked(updateTaskDetails).mockResolvedValue(
            undefined
        );

        render(<TasksPage />);


        await user.click(
            screen.getByRole('button', {
                name: 'Editar',
            })
        );


        const titleInput = screen.getByRole('textbox', {
            name: 'Editar título',
        });

        const descriptionInput = screen.getByRole('textbox', {
            name: 'Editar descripción',
        });


        await user.clear(titleInput);
        await user.type(
            titleInput,
            'Título actualizado'
        );

        await user.clear(descriptionInput);
        await user.type(
            descriptionInput,
            'Nueva descripción'
        );


        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            })
        );



        expect(updateTaskDetails).toHaveBeenCalledWith(
            'tarea-123',
            'Título actualizado',
            'Nueva descripción',
            'medium',
            ''
        );

        expect(
            await screen.findByText(
                'Tarea actualizada correctamente'
            )
        ).toBeInTheDocument();
    });


    // TEST: Eliminar tarea


    it('elimina una tarea cuando el usuario confirma', async () => {
        const user = userEvent.setup();

        const task: Task = {
            id: 'tarea-789',
            userId: 'usuario-456',
            title: 'Tarea para eliminar',
            description: 'Descripción de prueba',
            completed: false,
            createdAt: Timestamp.fromMillis(0),
            priority: 'medium',
            dueDate: '',
            order: 0,
        };


        vi.mocked(subscribeToMyTasks).mockImplementation(
            (onTasks) => {
                onTasks([task]);
                return () => { };
            }
        );


        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(true);


        vi.mocked(deleteTask).mockResolvedValue(undefined);

        try {
            render(<TasksPage />);


            await user.click(
                screen.getByRole('button', {
                    name: 'Eliminar',
                })
            );


            expect(confirmSpy).toHaveBeenCalledWith(
                '¿Estás seguro de eliminar la tarea "Tarea para eliminar"?'
            );


            expect(deleteTask).toHaveBeenCalledWith(
                'tarea-789'
            );

            expect(
                await screen.findByText(
                    'Tarea eliminada correctamente.'
                )
            ).toBeInTheDocument();

        } finally {
            confirmSpy.mockRestore();
        }
    });

});
