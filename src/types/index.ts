export interface User {
  id: string;
  name: string;
  role: 'manager' | 'member';
  avatar: string;
  department: string;
}

export type GoalType = 'department' | 'personal';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type Period = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1' | 'H2' | 'annual';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  period: string;
  year: number;
  weight: number;
  status: GoalStatus;
  parentId: string | null;
  ownerId: string;
  startDate: string;
  endDate: string;
  archived: boolean;
  createdAt: string;
}

export type KRStatus = 'on_track' | 'at_risk' | 'behind' | 'completed';

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  ownerId: string;
  status: KRStatus;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  keyResultId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  meetingId?: string;
  actionItemId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Progress {
  id: string;
  keyResultId: string;
  authorId: string;
  progressPercent: number;
  content: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  progressId: string;
  authorId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'open' | 'mitigating' | 'resolved';

export interface Risk {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  status: RiskStatus;
  goalId: string | null;
  ownerId: string;
  mitigation: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
  taskId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  notes: string;
  actionItems: ActionItem[];
  createdAt: string;
}

export type ActivityType = 'progress' | 'comment' | 'task' | 'risk' | 'goal';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  title: string;
  description: string;
  targetId: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  content: string;
}
