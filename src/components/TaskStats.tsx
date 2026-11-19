
import type { Task } from '../types/tasks';

interface TaskStatsProps {
    tasks: readonly Task[];
}

export default function TaskStats({ tasks }: TaskStatsProps) {
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        (task) => task.completed
    ).length;

    const pendingTasks = totalTasks - completedTasks;

    const progressPercentage = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return (
        <>
            <div className="tm-stats">
                <article className="tm-stat tm-stat-total">
                    <span className="tm-stat-label">
                        Total de tareas
                    </span>
                    <strong className="tm-stat-number">
                        {totalTasks}
                    </strong>
                    <span className="tm-stat-caption">
                        Actividades registradas
                    </span>
                </article>

                <article className="tm-stat tm-stat-pending">
                    <span className="tm-stat-label">
                        Pendientes
                    </span>
                    <strong className="tm-stat-number">
                        {pendingTasks}
                    </strong>
                    <span className="tm-stat-caption">
                        Por completar
                    </span>
                </article>

                <article className="tm-stat tm-stat-completed">
                    <span className="tm-stat-label">
                        Completadas
                    </span>
                    <strong className="tm-stat-number">
                        {completedTasks}
                    </strong>
                    <span className="tm-stat-caption">
                        Objetivos alcanzados
                    </span>
                </article>
            </div>

            <div className="tm-progress-card">
                <div className="tm-progress-heading">
                    <div>
                        <h3>Tu progreso</h3>
                        <p>Seguí avanzando con tus objetivos.</p>
                    </div>
                    <strong>{progressPercentage}%</strong>
                </div>

                <div
                    className="tm-progress-track"
                    role="progressbar"
                    aria-label="Progreso de tareas completadas"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPercentage}
                >
                    <div
                        className="tm-progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
        </>
    );
}
