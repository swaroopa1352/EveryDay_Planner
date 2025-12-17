export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface ReminderItem {
  id: number;
  text: string;
  reminderDate?: string;
  reminderTime?: string;
  notified?: boolean;
}

export interface User {
  id: string;
  name: string;
  gender: string;
  dayStartTime: string;
  timeFormat: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  todos: TodoItem[];
  mustDos: TodoItem[];
  reminders: ReminderItem[];
}

export interface Session {
  userId: string;
  name: string;
}
