import { create } from 'zustand';
import {
  User,
  Goal,
  KeyResult,
  Task,
  Progress,
  Comment,
  Risk,
  Meeting,
  Activity,
  ActionItem,
} from '../types';
import {
  users,
  currentUser as mockCurrentUser,
  goals as mockGoals,
  keyResults as mockKeyResults,
  tasks as mockTasks,
  progresses as mockProgresses,
  comments as mockComments,
  risks as mockRisks,
  meetings as mockMeetings,
  activities as mockActivities,
} from '../data/mockData';

interface AppState {
  currentUser: User;
  users: User[];
  goals: Goal[];
  keyResults: KeyResult[];
  tasks: Task[];
  progresses: Progress[];
  comments: Comment[];
  risks: Risk[];
  meetings: Meeting[];
  activities: Activity[];
  selectedGoalId: string | null;
  viewMode: 'tree' | 'alignment';
  taskViewMode: 'kanban' | 'list';
  
  setSelectedGoalId: (id: string | null) => void;
  setViewMode: (mode: 'tree' | 'alignment') => void;
  setTaskViewMode: (mode: 'kanban' | 'list') => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  
  addKeyResult: (kr: Omit<KeyResult, 'id' | 'createdAt'>) => void;
  updateKeyResult: (id: string, updates: Partial<KeyResult>) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  
  addProgress: (progress: Omit<Progress, 'id' | 'createdAt'>) => void;
  
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  
  addRisk: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  updateActionItem: (meetingId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  
  getUserById: (id: string) => User | undefined;
  getGoalById: (id: string) => Goal | undefined;
  getKeyResultsByGoalId: (goalId: string) => KeyResult[];
  getTasksByKeyResultId: (krId: string) => Task[];
  getProgressesByKeyResultId: (krId: string) => Progress[];
  getCommentsByProgressId: (progressId: string) => Comment[];
  calculateGoalProgress: (goalId: string) => number;
  getChildGoals: (parentId: string | null) => Goal[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  users,
  goals: mockGoals,
  keyResults: mockKeyResults,
  tasks: mockTasks,
  progresses: mockProgresses,
  comments: mockComments,
  risks: mockRisks,
  meetings: mockMeetings,
  activities: mockActivities,
  selectedGoalId: null,
  viewMode: 'tree',
  taskViewMode: 'kanban',

  setSelectedGoalId: (id) => set({ selectedGoalId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTaskViewMode: (mode) => set({ taskViewMode: mode }),

  addGoal: (goal) =>
    set((state) => ({
      goals: [...state.goals, { ...goal, id: generateId(), createdAt: new Date().toISOString() }],
    })),

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  deleteGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    })),

  archiveGoal: (id) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, archived: true, status: 'archived' } : g
      ),
    })),

  addKeyResult: (kr) =>
    set((state) => ({
      keyResults: [...state.keyResults, { ...kr, id: generateId(), createdAt: new Date().toISOString() }],
    })),

  updateKeyResult: (id, updates) =>
    set((state) => ({
      keyResults: state.keyResults.map((kr) =>
        kr.id === id ? { ...kr, ...updates } : kr
      ),
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: generateId(), createdAt: new Date().toISOString() }],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  addProgress: (progress) =>
    set((state) => ({
      progresses: [...state.progresses, { ...progress, id: generateId(), createdAt: new Date().toISOString() }],
    })),

  addComment: (comment) =>
    set((state) => ({
      comments: [...state.comments, { ...comment, id: generateId(), createdAt: new Date().toISOString() }],
    })),

  addRisk: (risk) =>
    set((state) => ({
      risks: [...state.risks, { ...risk, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    })),

  updateRisk: (id, updates) =>
    set((state) => ({
      risks: state.risks.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    })),

  addMeeting: (meeting) => {
    const newMeeting = { ...meeting, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({
      meetings: [newMeeting, ...state.meetings],
    }));
    return newMeeting;
  },

  updateMeeting: (id, updates) =>
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  updateActionItem: (meetingId, actionItemId, updates) =>
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              actionItems: m.actionItems.map((item) =>
                item.id === actionItemId ? { ...item, ...updates } : item
              ),
            }
          : m
      ),
    })),

  getUserById: (id) => get().users.find((u) => u.id === id),
  getGoalById: (id) => get().goals.find((g) => g.id === id),
  getKeyResultsByGoalId: (goalId) => get().keyResults.filter((kr) => kr.goalId === goalId),
  getTasksByKeyResultId: (krId) => get().tasks.filter((t) => t.keyResultId === krId),
  getProgressesByKeyResultId: (krId) => get().progresses.filter((p) => p.keyResultId === krId),
  getCommentsByProgressId: (progressId) => get().comments.filter((c) => c.progressId === progressId),

  calculateGoalProgress: (goalId) => {
    const state = get();
    const krs = state.keyResults.filter((kr) => kr.goalId === goalId);
    if (krs.length === 0) return 0;

    const totalWeight = krs.reduce((sum, kr) => sum + kr.weight, 0);
    const weightedProgress = krs.reduce((sum, kr) => {
      const progress = (kr.currentValue / kr.targetValue) * 100;
      return sum + progress * kr.weight;
    }, 0);

    return Math.min(100, Math.round(weightedProgress / totalWeight));
  },

  getChildGoals: (parentId) => get().goals.filter((g) => g.parentId === parentId),
}));
