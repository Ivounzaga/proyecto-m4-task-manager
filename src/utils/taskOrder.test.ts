
import { describe, expect, it } from 'vitest';

import type { Task } from '../types/tasks';

import {
    moveTask,
    sortTasksByOrder,
} from './taskOrder';


function task(
    id: string,
    order?: number,
    createdAtMs = 1000
): Task {
    return {
        id,
        userId: 'usuario-de-prueba',
        title: id,
        description: '',
        completed: false,
        createdAt: {
            toMillis: () => createdAtMs,
        } as Task['createdAt'],

        ...(order === undefined ? {} : { order }),
    };
}

describe('orden manual de tareas', () => {

    it('ordena por el campo order si esta presente', () => {
        const result = sortTasksByOrder([
            task('B', 2),
            task('A', 0),
            task('C', 1),
        ]);

        expect(
            result.map((item) => item.id)
        ).toEqual(['A', 'C', 'B']);
    });

    it('conserva tareas viejas que no tienen order', () => {
        const result = sortTasksByOrder([
            task('nueva', 3000),
            task('vieja-2', undefined, 2000),
            task('vieja-1', undefined, 1000),
        ]);

        expect(
            result.map((item) => item.id)
        ).toEqual(['vieja-1', 'vieja-2', 'nueva']);
    });

    it('reordena por id sin mutar el array de entrada', () => {
        const original = [
            task('A', 0),
            task('B', 1),
            task('C', 2),
        ];

        const result = moveTask(original, 'A', 'C');

        expect(
            result?.map((item) => item.id)
        ).toEqual(['B', 'C', 'A']);

        expect(
            result?.map((item) => item.order)
        ).toEqual([0, 1, 2]);

        expect(
            original.map((item) => item.id)
        ).toEqual(['A', 'B', 'C']);
    });

    it('no intenta guardar un movimiento invalido', () => {
        expect(
            moveTask(
                [task('A', 0)],
                'A',
                'desconocida'
            )
        ).toBeNull();
    });

});
