import type { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Timestamp;

  priority?: TaskPriority;
  dueDate?: string;
  order?: number;
}
