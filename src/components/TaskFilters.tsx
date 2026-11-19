
export type TaskFilter = 'all' | 'pending' | 'completed';

interface TaskFiltersProps {
    filter: TaskFilter;
    sortByPriority: boolean;
    onChangeFilter: (value: TaskFilter) => void;
    onTogglePriority: () => void;
}

export default function TaskFilters({
    filter,
    sortByPriority,
    onChangeFilter,
    onTogglePriority,
}: TaskFiltersProps) {
    return (
        <div
            className="tm-filters"
            aria-label="Filtrar tareas"
        >
            <button
                type="button"
                className={
                    filter === 'all'
                        ? 'tm-filter is-active'
                        : 'tm-filter'
                }
                aria-pressed={filter === 'all'}
                onClick={() => onChangeFilter('all')}
            >
                Todas
            </button>

            <button
                type="button"
                className={
                    filter === 'pending'
                        ? 'tm-filter is-active'
                        : 'tm-filter'
                }
                aria-pressed={filter === 'pending'}
                onClick={() => onChangeFilter('pending')}
            >
                Pendientes
            </button>

            <button
                type="button"
                className={
                    filter === 'completed'
                        ? 'tm-filter is-active'
                        : 'tm-filter'
                }
                aria-pressed={filter === 'completed'}
                onClick={() => onChangeFilter('completed')}
            >
                Completadas
            </button>

            <button
                type="button"
                className={
                    sortByPriority
                        ? 'tm-filter is-active'
                        : 'tm-filter'
                }
                aria-pressed={sortByPriority}
                onClick={onTogglePriority}
            >
                Ordenar por prioridad
            </button>
        </div>
    );
}

