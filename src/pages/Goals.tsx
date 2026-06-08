import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, ListTree, AlignHorizontalJustifyEnd, X, Target, Calendar, Scale, User, CheckCircle, Plus, Edit2, Save, XCircle, FileText, Clock, Paperclip, ArrowLeft, Activity, AlertTriangle, CheckSquare } from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { Modal, Button, Input, Textarea, Select } from '../components/Modal';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../utils/helpers';
import type { Goal, KeyResult, GoalType, Task, TaskStatus, TaskPriority } from '../types';

const Goals = () => {
  const {
    goals,
    keyResults,
    users,
    tasks,
    progresses,
    risks,
    meetings,
    selectedGoalId,
    setSelectedGoalId,
    selectedKRId,
    setSelectedKRId,
    selectedMeetingId,
    setSelectedMeetingId,
    viewMode,
    setViewMode,
    addGoal,
    addKeyResult,
    addTask,
    updateKeyResult,
    updateTaskStatus,
    updateGoal,
    calculateGoalProgress,
    getKeyResultsByGoalId,
    getTasksByKeyResultId,
    getProgressesByKeyResultId,
    getChildGoals,
    getUserById,
    getGoalById,
  } = useStore();

  const navigate = useNavigate();

  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set(['goal-1', 'goal-2']));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isKRModalOpen, setIsKRModalOpen] = useState(false);
  const [isKREditing, setIsKREditing] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFormErrors, setTaskFormErrors] = useState<{ title?: string }>({});
  const [krEditForm, setKrEditForm] = useState({
    targetValue: '',
    currentValue: '',
    weight: '',
    ownerId: '',
  });
  const [krEditErrors, setKrEditErrors] = useState<{ targetValue?: string }>({});
  const [goalFormErrors, setGoalFormErrors] = useState<{ title?: string }>({});
  const [krFormErrors, setKrFormErrors] = useState<{ title?: string; targetValue?: string }>({});

  const [goalForm, setGoalForm] = useState({
    type: 'department' as GoalType,
    title: '',
    description: '',
    ownerId: '',
    period: 'Q2',
    year: '2026',
    startDate: '',
    endDate: '',
    weight: '100',
    parentId: '',
  });

  const [krForm, setKrForm] = useState({
    title: '',
    targetValue: '',
    currentValue: '0',
    unit: '%',
    weight: '30',
    ownerId: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    assigneeId: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
  });

  const rootGoals = useMemo(() => {
    return goals.filter((g) => g.parentId === null && !g.archived);
  }, [goals]);

  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find((g) => g.id === selectedGoalId) || null;
  }, [selectedGoalId, goals]);

  const selectedGoalKeyResults = useMemo(() => {
    if (!selectedGoalId) return [];
    return getKeyResultsByGoalId(selectedGoalId);
  }, [selectedGoalId, getKeyResultsByGoalId]);

  const selectedGoalOwner = useMemo(() => {
    if (!selectedGoal) return null;
    return getUserById(selectedGoal.ownerId) || null;
  }, [selectedGoal, getUserById]);

  const selectedKeyResult = useMemo(() => {
    if (!selectedKRId) return null;
    return selectedGoalKeyResults.find((kr) => kr.id === selectedKRId) || null;
  }, [selectedKRId, selectedGoalKeyResults]);

  const selectedKROwner = useMemo(() => {
    if (!selectedKeyResult) return null;
    return getUserById(selectedKeyResult.ownerId) || null;
  }, [selectedKeyResult, getUserById]);

  const krTasks = useMemo(() => {
    if (!selectedKRId) return [];
    return getTasksByKeyResultId(selectedKRId);
  }, [selectedKRId, getTasksByKeyResultId]);

  const krProgresses = useMemo(() => {
    if (!selectedKRId) return [];
    return getProgressesByKeyResultId(selectedKRId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [selectedKRId, getProgressesByKeyResultId]);

  const krProgress = useMemo(() => {
    if (!selectedKeyResult || !selectedKeyResult.targetValue || selectedKeyResult.targetValue <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((selectedKeyResult.currentValue / selectedKeyResult.targetValue) * 100));
  }, [selectedKeyResult]);

  const krTaskCompletion = useMemo(() => {
    if (krTasks.length === 0) return 0;
    const doneCount = krTasks.filter((t) => t.status === 'done').length;
    return Math.round((doneCount / krTasks.length) * 100);
  }, [krTasks]);

  const getAllDescendantIds = (goalId: string): Set<string> => {
    const result = new Set<string>();
    const stack = [goalId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = getChildGoals(current);
      children.forEach((child) => {
        if (!result.has(child.id)) {
          result.add(child.id);
          stack.push(child.id);
        }
      });
    }
    return result;
  };

  const canDrop = (draggedGoalId: string, targetGoalId: string | null): boolean => {
    if (!targetGoalId) return true;
    const draggedGoal = getGoalById(draggedGoalId);
    const targetGoal = getGoalById(targetGoalId);
    if (!draggedGoal || !targetGoal) return false;
    if (draggedGoal.type !== 'personal') return false;
    if (targetGoal.type !== 'department') return false;
    if (draggedGoalId === targetGoalId) return false;
    if (draggedGoal.parentId === targetGoalId) return false;
    const descendants = getAllDescendantIds(draggedGoalId);
    if (descendants.has(targetGoalId)) return false;
    return true;
  };

  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(selectedGoalId === goalId ? null : goalId);
  };

  useEffect(() => {
    if (!selectedGoalId || !selectedKRId) return;
    const krBelongsToGoal = selectedGoalKeyResults.some((kr) => kr.id === selectedKRId);
    if (!krBelongsToGoal) {
      setSelectedKRId(null);
    }
  }, [selectedGoalId, selectedKRId, selectedGoalKeyResults, setSelectedKRId]);

  const goalActivities = useMemo(() => {
    if (!selectedGoalId) return [];

    const krIds = selectedGoalKeyResults.map((kr) => kr.id);

    type ActivityItem = {
      id: string;
      type: 'progress' | 'task' | 'risk' | 'meeting';
      icon: React.ReactNode;
      title: string;
      description: string;
      time: string;
      targetId: string;
      targetType: string;
      color: string;
    };

    const activities: ActivityItem[] = [];

    progresses
      .filter((p) => krIds.includes(p.keyResultId))
      .forEach((progress) => {
        const author = getUserById(progress.authorId);
        const kr = keyResults.find((k) => k.id === progress.keyResultId);
        activities.push({
          id: `progress-${progress.id}`,
          type: 'progress',
          icon: <Activity size={14} />,
          title: `${author?.name || '未知用户'} 更新了进展`,
          description: `${kr?.title || '关键结果'} · ${progress.progressPercent}%`,
          time: progress.createdAt,
          targetId: progress.keyResultId,
          targetType: 'keyResult',
          color: 'text-indigo-600 bg-indigo-50',
        });
      });

    tasks
      .filter((t) => krIds.includes(t.keyResultId) && t.status === 'done')
      .forEach((task) => {
        const assignee = getUserById(task.assigneeId);
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          icon: <CheckSquare size={14} />,
          title: `${assignee?.name || '未知用户'} 完成了任务`,
          description: task.title,
          time: task.createdAt,
          targetId: task.id,
          targetType: 'task',
          color: 'text-green-600 bg-green-50',
        });
      });

    risks
      .filter((r) => r.goalId === selectedGoalId)
      .forEach((risk) => {
        const levelLabels: Record<string, string> = {
          low: '低',
          medium: '中',
          high: '高',
          critical: '紧急',
        };
        const statusLabels: Record<string, string> = {
          open: '已打开',
          mitigating: '缓解中',
          resolved: '已解决',
        };
        activities.push({
          id: `risk-${risk.id}`,
          type: 'risk',
          icon: <AlertTriangle size={14} />,
          title: `风险${statusLabels[risk.status] || risk.status}`,
          description: `${risk.title} · ${levelLabels[risk.level] || risk.level}风险`,
          time: risk.updatedAt,
          targetId: risk.id,
          targetType: 'risk',
          color: 'text-amber-600 bg-amber-50',
        });
      });

    meetings.forEach((meeting) => {
      meeting.actionItems
        .filter((item) => item.completed && item.taskId)
        .forEach((actionItem) => {
          const task = tasks.find((t) => t.id === actionItem.taskId);
          if (!task) return;
          const kr = keyResults.find((k) => k.id === task.keyResultId);
          if (!kr || kr.goalId !== selectedGoalId) return;
          activities.push({
            id: `meeting-${meeting.id}-${actionItem.id}`,
            type: 'meeting',
            icon: <CheckSquare size={14} />,
            title: '行动项已完成',
            description: `${actionItem.content}（来自会议：${meeting.title}）`,
            time: meeting.date || meeting.createdAt,
            targetId: meeting.id,
            targetType: 'meeting',
            color: 'bg-emerald-100 text-emerald-600',
          });
        });
    });

    return activities.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [selectedGoalId, selectedGoalKeyResults, progresses, tasks, risks, meetings, keyResults, getUserById]);

  const handleActivityClick = (activity: { type: string; targetId: string }) => {
    if (activity.type === 'progress') {
      setSelectedKRId(activity.targetId);
    } else if (activity.type === 'task') {
      navigate('/tasks');
    } else if (activity.type === 'risk') {
      navigate('/risks');
    } else if (activity.type === 'meeting') {
      setSelectedMeetingId(activity.targetId);
      navigate('/meetings');
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
    });
    setTaskFormErrors({});
  };

  const handleOpenTaskModal = () => {
    resetTaskForm();
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    resetTaskForm();
  };

  const handleAddTask = () => {
    const errors: { title?: string } = {};

    if (!taskForm.title.trim()) {
      errors.title = '请输入任务标题';
    }

    if (Object.keys(errors).length > 0) {
      setTaskFormErrors(errors);
      return;
    }

    const newTask = {
      title: taskForm.title.trim(),
      description: '',
      keyResultId: selectedKRId || '',
      assigneeId: taskForm.assigneeId || selectedKROwner?.id || users[0]?.id || '',
      priority: taskForm.priority,
      status: 'todo' as const,
      dueDate: taskForm.dueDate || new Date().toISOString().split('T')[0],
    };

    addTask(newTask);
    handleCloseTaskModal();
  };

  const handleDragStart = (e: React.DragEvent, goalId: string) => {
    const goal = getGoalById(goalId);
    if (!goal || goal.type !== 'personal') {
      e.preventDefault();
      return;
    }
    setDraggedId(goalId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', goalId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    if (!draggedId) return;
    if (canDrop(draggedId, targetId)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverId(targetId);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    if (!draggedId || !canDrop(draggedId, targetId)) return;
    updateGoal(draggedId, { parentId: targetId });
    if (targetId) {
      setExpandedGoals((prev) => new Set([...prev, targetId]));
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const resetGoalForm = () => {
    setGoalForm({
      type: 'department',
      title: '',
      description: '',
      ownerId: '',
      period: 'Q2',
      year: '2026',
      startDate: '',
      endDate: '',
      weight: '100',
      parentId: '',
    });
    setGoalFormErrors({});
  };

  const handleOpenGoalModal = () => {
    resetGoalForm();
    setIsGoalModalOpen(true);
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    resetGoalForm();
  };

  const handleAddGoal = () => {
    if (!goalForm.title.trim()) {
      setGoalFormErrors({ title: '请输入目标标题' });
      return;
    }

    const newGoal = {
      type: goalForm.type,
      title: goalForm.title.trim(),
      description: goalForm.description.trim(),
      ownerId: goalForm.ownerId || users[0]?.id || '',
      period: goalForm.period,
      year: parseInt(goalForm.year),
      weight: parseInt(goalForm.weight) || 100,
      status: 'active' as const,
      parentId: goalForm.parentId || null,
      startDate: goalForm.startDate || new Date().toISOString().split('T')[0],
      endDate: goalForm.endDate || new Date().toISOString().split('T')[0],
      archived: false,
    };

    addGoal(newGoal);
    
    const state = useStore.getState();
    const createdGoal = state.goals[state.goals.length - 1];
    if (createdGoal) {
      setSelectedGoalId(createdGoal.id);
      if (goalForm.parentId) {
        setExpandedGoals((prev) => new Set([...prev, goalForm.parentId]));
      }
    }

    handleCloseGoalModal();
  };

  const resetKrForm = () => {
    setKrForm({
      title: '',
      targetValue: '',
      currentValue: '0',
      unit: '%',
      weight: '30',
      ownerId: '',
    });
    setKrFormErrors({});
  };

  const handleOpenKRModal = () => {
    resetKrForm();
    setIsKRModalOpen(true);
  };

  const handleCloseKRModal = () => {
    setIsKRModalOpen(false);
    resetKrForm();
  };

  const handleAddKeyResult = () => {
    const errors: { title?: string; targetValue?: string } = {};

    if (!krForm.title.trim()) {
      errors.title = '请输入关键结果标题';
    }

    const targetValueNum = parseFloat(krForm.targetValue);
    if (!krForm.targetValue || isNaN(targetValueNum) || targetValueNum <= 0) {
      errors.targetValue = '目标值必须大于 0';
    }

    if (Object.keys(errors).length > 0) {
      setKrFormErrors(errors);
      return;
    }

    const newKR = {
      goalId: selectedGoalId || '',
      title: krForm.title.trim(),
      targetValue: targetValueNum,
      currentValue: parseFloat(krForm.currentValue) || 0,
      unit: krForm.unit,
      weight: parseInt(krForm.weight) || 30,
      ownerId: krForm.ownerId || selectedGoalOwner?.id || users[0]?.id || '',
      status: 'on_track' as const,
    };

    addKeyResult(newKR);
    handleCloseKRModal();
  };

  const handleKRClick = (krId: string) => {
    setSelectedKRId(selectedKRId === krId ? null : krId);
    setIsKREditing(false);
  };

  const handleStartKREdit = () => {
    if (!selectedKeyResult) return;
    setKrEditForm({
      targetValue: selectedKeyResult.targetValue.toString(),
      currentValue: selectedKeyResult.currentValue.toString(),
      weight: selectedKeyResult.weight.toString(),
      ownerId: selectedKeyResult.ownerId,
    });
    setKrEditErrors({});
    setIsKREditing(true);
  };

  const handleCancelKREdit = () => {
    setIsKREditing(false);
    setKrEditErrors({});
  };

  const handleSaveKREdit = () => {
    if (!selectedKeyResult) return;

    const errors: { targetValue?: string } = {};
    const targetValueNum = parseFloat(krEditForm.targetValue);
    if (!krEditForm.targetValue || isNaN(targetValueNum) || targetValueNum <= 0) {
      errors.targetValue = '目标值必须大于 0';
    }

    if (Object.keys(errors).length > 0) {
      setKrEditErrors(errors);
      return;
    }

    updateKeyResult(selectedKeyResult.id, {
      targetValue: targetValueNum,
      currentValue: parseFloat(krEditForm.currentValue) || 0,
      weight: parseInt(krEditForm.weight) || 0,
      ownerId: krEditForm.ownerId,
    });

    setIsKREditing(false);
  };

  const handleTaskStatusToggle = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateTaskStatus(taskId, nextStatus);
  };

  const GoalNode = ({ goal, level = 0 }: { goal: Goal; level?: number }) => {
    const childGoals = getChildGoals(goal.id);
    const hasChildren = childGoals.length > 0;
    const isExpanded = expandedGoals.has(goal.id);
    const progress = calculateGoalProgress(goal.id);
    const owner = getUserById(goal.ownerId);
    const isSelected = selectedGoalId === goal.id;

    return (
      <div className="select-none">
        <div
          className={cn(
            'group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border',
            isSelected
              ? 'bg-indigo-50 border-indigo-200 shadow-sm'
              : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30'
          )}
          style={{ marginLeft: level * 32 }}
          onClick={() => handleGoalClick(goal.id)}
        >
          <button
            className={cn(
              'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors',
              hasChildren
                ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                : 'opacity-0 cursor-default'
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(goal.id);
            }}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </button>

          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              goal.type === 'department' ? 'bg-indigo-500' : 'bg-emerald-500'
            )}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">{goal.title}</h4>
              <StatusBadge status={goal.status} size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <ProgressBar percent={progress} size="sm" />
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {progress}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-xs text-gray-500 hidden sm:block">
              <span className="text-gray-400">权重</span>
              <span className="ml-1 font-medium text-gray-700">{goal.weight}%</span>
            </div>
            {owner && (
              <div className="flex items-center gap-2">
                <Avatar name={owner.name} size="sm" />
                <span className="text-sm text-gray-600 hidden md:block">
                  {owner.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {childGoals.map((child) => (
              <GoalNode key={child.id} goal={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const AlignmentView = () => {
    const departmentGoals = rootGoals.filter((g) => g.type === 'department');
    const unalignedPersonalGoals = goals.filter(
      (g) => g.type === 'personal' && g.parentId === null && !g.archived
    );

    const PersonalGoalCard = ({ goal, index, total }: { goal: Goal; index: number; total: number }) => {
      const progress = calculateGoalProgress(goal.id);
      const owner = getUserById(goal.ownerId);
      const isSelected = selectedGoalId === goal.id;
      const isDragging = draggedId === goal.id;

      return (
        <div
          key={goal.id}
          className="relative"
        >
          {index < total - 1 && (
            <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-200 -translate-x-full" />
          )}
          {index === 0 && (
            <div className="absolute left-0 bottom-1/2 w-3 h-1/2 border-l border-t border-gray-200 rounded-tl -translate-x-full" />
          )}
          {index === total - 1 && total > 1 && (
            <div className="absolute left-0 top-1/2 w-3 h-1/2 border-l border-b border-gray-200 rounded-bl -translate-x-full" />
          )}
          {index > 0 && index < total - 1 && (
            <div className="absolute left-0 top-0 w-3 h-full border-l border-gray-200 -translate-x-full" />
          )}

          <div
            draggable
            onDragStart={(e) => handleDragStart(e, goal.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              'p-4 rounded-xl bg-white border transition-all duration-200 cursor-pointer w-64',
              'select-none active:cursor-grabbing cursor-grab',
              isDragging ? 'opacity-50 shadow-lg scale-105' : '',
              isSelected
                ? 'border-emerald-300 shadow-md ring-2 ring-emerald-100'
                : 'border-gray-100 hover:border-emerald-200 hover:shadow-sm'
            )}
            onClick={() => handleGoalClick(goal.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                个人目标
              </span>
              <StatusBadge status={goal.status} size="sm" />
            </div>
            <h5 className="font-medium text-gray-900 mb-2 text-sm leading-snug">
              {goal.title}
            </h5>
            <div className="mb-2">
              <ProgressBar percent={progress} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              {owner && (
                <div className="flex items-center gap-2">
                  <Avatar name={owner.name} size="sm" />
                  <span className="text-xs text-gray-600">
                    {owner.name}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-500">
                {progress}%
              </span>
            </div>
          </div>
        </div>
      );
    };

    const DepartmentGoalColumn = ({ deptGoal }: { deptGoal: Goal }) => {
      const childGoals = getChildGoals(deptGoal.id);
      const deptProgress = calculateGoalProgress(deptGoal.id);
      const deptOwner = getUserById(deptGoal.ownerId);
      const isDeptSelected = selectedGoalId === deptGoal.id;
      const isDragOver = dragOverId === deptGoal.id && draggedId && canDrop(draggedId, deptGoal.id);

      return (
        <div key={deptGoal.id} className="flex gap-6">
          <div className="w-72 flex-shrink-0">
            <div
              onDragOver={(e) => handleDragOver(e, deptGoal.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, deptGoal.id)}
              className={cn(
                'p-5 rounded-xl bg-white border-2 transition-all duration-200 cursor-pointer',
                isDeptSelected
                  ? 'border-indigo-300 shadow-md ring-2 ring-indigo-100'
                  : isDragOver
                  ? 'border-indigo-400 bg-indigo-50/50 shadow-lg ring-2 ring-indigo-200'
                  : 'border-gray-100 hover:border-indigo-200 hover:shadow-sm'
              )}
              onClick={() => handleGoalClick(deptGoal.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Target size={16} className="text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  部门目标
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 leading-snug">
                {deptGoal.title}
              </h4>
              <div className="mb-3">
                <ProgressBar percent={deptProgress} size="sm" showLabel />
              </div>
              <div className="flex items-center justify-between">
                {deptOwner && (
                  <div className="flex items-center gap-2">
                    <Avatar name={deptOwner.name} size="sm" />
                    <span className="text-sm text-gray-600">
                      {deptOwner.name}
                    </span>
                  </div>
                )}
                <StatusBadge status={deptGoal.status} size="sm" />
              </div>
            </div>

            <div className="flex justify-center my-3">
              <div className="w-px h-6 bg-gray-200" />
            </div>
          </div>

          <div className="space-y-3 pt-12">
            {childGoals.map((personalGoal, index) => (
              <PersonalGoalCard
                key={personalGoal.id}
                goal={personalGoal}
                index={index}
                total={childGoals.length}
              />
            ))}
            {childGoals.length === 0 && draggedId && canDrop(draggedId, deptGoal.id) && (
              <div className="w-64 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                拖拽到此处对齐
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-4">
          {departmentGoals.map((deptGoal) => (
            <DepartmentGoalColumn key={deptGoal.id} deptGoal={deptGoal} />
          ))}

          <div className="flex gap-6">
            <div className="w-72 flex-shrink-0">
              <div
                onDragOver={(e) => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                className={cn(
                  'p-5 rounded-xl border-2 border-dashed transition-all duration-200',
                  dragOverId === null && draggedId && canDrop(draggedId, null)
                    ? 'border-amber-400 bg-amber-50/50 shadow-lg ring-2 ring-amber-200'
                    : 'border-gray-200 bg-gray-50/50 hover:border-amber-300 hover:bg-amber-50/30'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-amber-600"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    未对齐
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 leading-snug">
                  未对齐目标
                </h4>
                <p className="text-xs text-gray-500">
                  这些个人目标尚未与部门目标对齐，拖拽到部门目标下进行对齐
                </p>
              </div>

              <div className="flex justify-center my-3">
                <div className="w-px h-6 bg-gray-200" />
              </div>
            </div>

            <div className="space-y-3 pt-12">
              {unalignedPersonalGoals.map((personalGoal, index) => (
                <PersonalGoalCard
                  key={personalGoal.id}
                  goal={personalGoal}
                  index={index}
                  total={unalignedPersonalGoals.length}
                />
              ))}
              {unalignedPersonalGoals.length === 0 && (
                <div className="w-64 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm bg-gray-50/50">
                  暂无未对齐目标
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DetailSidebar = () => {
    if (!selectedGoal) return null;

    const progress = calculateGoalProgress(selectedGoal.id);
    const parentGoal = selectedGoal.parentId ? getGoalById(selectedGoal.parentId) : null;

    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">目标详情</h3>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setSelectedGoalId(null)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded',
                  selectedGoal.type === 'department'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-emerald-600 bg-emerald-50'
                )}
              >
                {selectedGoal.type === 'department' ? '部门目标' : '个人目标'}
              </span>
              <StatusBadge status={selectedGoal.status} size="sm" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedGoal.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {selectedGoal.description}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">整体进度</span>
              <span className="text-sm font-bold text-gray-900">{progress}%</span>
            </div>
            <ProgressBar percent={progress} size="lg" />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target size={16} className="text-gray-400" />
              基本信息
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar size={12} />
                  <span>周期</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedGoal.period} {selectedGoal.year}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Scale size={12} />
                  <span>权重</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedGoal.weight}%
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <User size={12} />
                <span>负责人</span>
              </div>
              {selectedGoalOwner && (
                <div className="flex items-center gap-3">
                  <Avatar name={selectedGoalOwner.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedGoalOwner.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedGoalOwner.department}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {parentGoal && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-indigo-500 mb-2">
                  <Target size={12} />
                  <span>父级目标</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-indigo-100/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                  onClick={() => handleGoalClick(parentGoal.id)}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      parentGoal.type === 'department' ? 'bg-indigo-500' : 'bg-emerald-500'
                    )}
                  />
                  <p className="text-sm font-medium text-gray-900 truncate flex-1">
                    {parentGoal.title}
                  </p>
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                </div>
              </div>
            )}
            {!parentGoal && selectedGoal.type === 'personal' && (
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-amber-600 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>未对齐</span>
                </div>
                <p className="text-xs text-amber-700">
                  该目标尚未与部门目标对齐
                </p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar size={12} />
                <span>起止时间</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(selectedGoal.startDate)} - {formatDate(selectedGoal.endDate)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle size={16} className="text-gray-400" />
                关键结果 ({selectedGoalKeyResults.length})
              </h4>
              <Button size="sm" variant="ghost" onClick={handleOpenKRModal}>
                <Plus size={14} className="mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {selectedGoalKeyResults.map((kr: KeyResult) => {
                const krProgress =
                  kr.targetValue > 0 && !isNaN(kr.targetValue)
                    ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
                    : 0;
                const krOwner = getUserById(kr.ownerId);
                const isSelected = selectedKRId === kr.id;

                return (
                  <div
                    key={kr.id}
                    className={cn(
                      'bg-white border rounded-lg p-3 hover:border-indigo-200 transition-colors cursor-pointer',
                      isSelected
                        ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-gray-100'
                    )}
                    onClick={() => handleKRClick(kr.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-sm font-medium text-gray-900 leading-snug">
                        {kr.title}
                      </h5>
                      <StatusBadge status={kr.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <ProgressBar percent={krProgress} size="sm" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 flex-shrink-0">
                        {kr.currentValue}/{kr.targetValue}
                        {kr.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {krOwner && (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={krOwner.name} size="sm" />
                          <span className="text-xs text-gray-500">
                            {krOwner.name}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        权重 {kr.weight}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {selectedGoalKeyResults.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  暂无关键结果
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              协作动态 ({goalActivities.length})
            </h4>
            <div className="space-y-1">
              {goalActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    activity.color
                  )}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.time)}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                </div>
              ))}
              {goalActivities.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  暂无协作动态
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KRDetailSidebar = () => {
    if (!selectedKeyResult || !selectedGoal) return null;

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return 'text-red-600 bg-red-50';
        case 'high':
          return 'text-orange-600 bg-orange-50';
        case 'medium':
          return 'text-amber-600 bg-amber-50';
        case 'low':
          return 'text-green-600 bg-green-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    };

    const getPriorityLabel = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return '紧急';
        case 'high':
          return '高';
        case 'medium':
          return '中';
        case 'low':
          return '低';
        default:
          return priority;
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'todo':
          return '待办';
        case 'in_progress':
          return '进行中';
        case 'done':
          return '已完成';
        default:
          return status;
      }
    };

    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedKRId(null)}
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-semibold text-gray-900">关键结果详情</h3>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setSelectedKRId(null);
              setSelectedGoalId(null);
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                关键结果
              </span>
              <StatusBadge status={selectedKeyResult.status} size="sm" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedKeyResult.title}
            </h2>
            <p className="text-sm text-gray-500">
              所属目标：{selectedGoal.title}
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">当前进度</span>
              <span className="text-lg font-bold text-indigo-600">{krProgress}%</span>
            </div>
            <ProgressBar percent={krProgress} size="lg" />
            <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
              <span>当前：{selectedKeyResult.currentValue}{selectedKeyResult.unit}</span>
              <span>目标：{selectedKeyResult.targetValue}{selectedKeyResult.unit}</span>
            </div>
          </div>

          {!isKREditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Target size={16} className="text-gray-400" />
                  基本信息
                </h4>
                <Button size="sm" variant="ghost" onClick={handleStartKREdit}>
                  <Edit2 size={14} className="mr-1" />
                  编辑
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Target size={12} />
                    <span>目标值</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedKeyResult.targetValue}{selectedKeyResult.unit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <CheckCircle size={12} />
                    <span>当前值</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedKeyResult.currentValue}{selectedKeyResult.unit}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Scale size={12} />
                    <span>权重</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedKeyResult.weight}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <User size={12} />
                    <span>负责人</span>
                  </div>
                  {selectedKROwner && (
                    <div className="flex items-center gap-2">
                      <Avatar name={selectedKROwner.name} size="sm" />
                      <p className="text-sm font-medium text-gray-900">
                        {selectedKROwner.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Edit2 size={16} className="text-indigo-500" />
                  编辑关键结果
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="目标值"
                  type="number"
                  value={krEditForm.targetValue}
                  onChange={(value) => {
                    setKrEditForm({ ...krEditForm, targetValue: value });
                    if (krEditErrors.targetValue) {
                      setKrEditErrors({ ...krEditErrors, targetValue: undefined });
                    }
                  }}
                  error={krEditErrors.targetValue}
                />
                <Input
                  label="当前值"
                  type="number"
                  value={krEditForm.currentValue}
                  onChange={(value) => setKrEditForm({ ...krEditForm, currentValue: value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="权重 (%)"
                  type="number"
                  value={krEditForm.weight}
                  onChange={(value) => setKrEditForm({ ...krEditForm, weight: value })}
                />
                <Select
                  label="负责人"
                  value={krEditForm.ownerId}
                  onChange={(value) => setKrEditForm({ ...krEditForm, ownerId: value })}
                  options={users.map((u) => ({ value: u.id, label: u.name }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={handleCancelKREdit}>
                  <XCircle size={14} className="mr-1.5" />
                  取消
                </Button>
                <Button className="flex-1" onClick={handleSaveKREdit}>
                  <Save size={14} className="mr-1.5" />
                  保存
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                关联任务 ({krTasks.length})
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  完成率：{krTaskCompletion}%
                </span>
                <Button size="sm" variant="ghost" onClick={handleOpenTaskModal}>
                  <Plus size={14} className="mr-1" />
                  新建
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {krTasks.map((task: Task) => {
                const taskAssignee = getUserById(task.assigneeId);
                return (
                  <div
                    key={task.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                          task.status === 'done'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-indigo-400'
                        )}
                        onClick={() => handleTaskStatusToggle(task.id, task.status)}
                      >
                        {task.status === 'done' && <CheckCircle size={12} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h5 className={cn(
                          'text-sm font-medium leading-snug mb-1',
                          task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'
                        )}>
                          {task.title}
                        </h5>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded font-medium',
                            getPriorityColor(task.priority)
                          )}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getStatusLabel(task.status)}
                          </span>
                          {taskAssignee && (
                            <div className="flex items-center gap-1">
                              <Avatar name={taskAssignee.name} size="sm" />
                              <span className="text-xs text-gray-500">
                                {taskAssignee.name}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {krTasks.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  暂无关联任务
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              进展记录 ({krProgresses.length})
            </h4>
            <div className="space-y-3">
              {krProgresses.map((progress) => {
                const author = getUserById(progress.authorId);
                return (
                  <div key={progress.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-indigo-600">
                          {progress.progressPercent}%
                        </span>
                        {author && (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={author.name} size="sm" />
                            <span className="text-xs text-gray-600">
                              {author.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(progress.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                      {progress.content}
                    </p>
                    {progress.attachments.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Paperclip size={12} />
                        <span>{progress.attachments.length} 个附件</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {krProgresses.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  暂无进展记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="目标树" subtitle="Q2 2026 · 目标层级与对齐">
      <div className={cn('transition-all duration-300', selectedGoalId ? 'mr-96' : '')}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'tree'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              onClick={() => setViewMode('tree')}
            >
              <ListTree size={16} />
              树形视图
            </button>
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'alignment'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              onClick={() => setViewMode('alignment')}
            >
              <AlignHorizontalJustifyEnd size={16} />
              对齐视图
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>部门目标</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>个人目标</span>
              </div>
            </div>
            <Button onClick={handleOpenGoalModal}>
              <Plus size={16} className="mr-1.5" />
              新建目标
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {viewMode === 'tree' ? (
            <div className="space-y-2">
              {rootGoals.map((goal) => (
                <GoalNode key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <AlignmentView />
          )}
        </div>
      </div>

      {selectedKRId ? <KRDetailSidebar /> : <DetailSidebar />}

      <Modal
        isOpen={isGoalModalOpen}
        onClose={handleCloseGoalModal}
        title="新建目标"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseGoalModal}>
              取消
            </Button>
            <Button onClick={handleAddGoal}>
              创建目标
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="目标类型"
              value={goalForm.type}
              onChange={(value) => setGoalForm({ ...goalForm, type: value as GoalType })}
              options={[
                { value: 'department', label: '部门目标' },
                { value: 'personal', label: '个人目标' },
              ]}
            />
            <Select
              label="周期"
              value={goalForm.period}
              onChange={(value) => setGoalForm({ ...goalForm, period: value })}
              options={[
                { value: 'Q1', label: 'Q1' },
                { value: 'Q2', label: 'Q2' },
                { value: 'Q3', label: 'Q3' },
                { value: 'Q4', label: 'Q4' },
              ]}
            />
          </div>

          <Input
            label="目标标题"
            value={goalForm.title}
            onChange={(value) => {
              setGoalForm({ ...goalForm, title: value });
              if (goalFormErrors.title) {
                setGoalFormErrors({ ...goalFormErrors, title: undefined });
              }
            }}
            placeholder="请输入目标标题"
            error={goalFormErrors.title}
          />

          <Textarea
            label="目标描述"
            value={goalForm.description}
            onChange={(value) => setGoalForm({ ...goalForm, description: value })}
            placeholder="请输入目标描述"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="负责人"
              value={goalForm.ownerId}
              onChange={(value) => setGoalForm({ ...goalForm, ownerId: value })}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="请选择负责人"
            />
            <Select
              label="年份"
              value={goalForm.year}
              onChange={(value) => setGoalForm({ ...goalForm, year: value })}
              options={[
                { value: '2025', label: '2025' },
                { value: '2026', label: '2026' },
                { value: '2027', label: '2027' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="开始日期"
              type="date"
              value={goalForm.startDate}
              onChange={(value) => setGoalForm({ ...goalForm, startDate: value })}
            />
            <Input
              label="结束日期"
              type="date"
              value={goalForm.endDate}
              onChange={(value) => setGoalForm({ ...goalForm, endDate: value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="权重 (%)"
              type="number"
              value={goalForm.weight}
              onChange={(value) => setGoalForm({ ...goalForm, weight: value })}
              placeholder="100"
            />
            <Select
              label="父级目标"
              value={goalForm.parentId}
              onChange={(value) => setGoalForm({ ...goalForm, parentId: value })}
              options={goals.filter((g) => !g.archived).map((g) => ({ value: g.id, label: g.title }))}
              placeholder="无（顶级目标）"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isKRModalOpen}
        onClose={handleCloseKRModal}
        title="添加关键结果"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseKRModal}>
              取消
            </Button>
            <Button onClick={handleAddKeyResult}>
              添加
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="关键结果标题"
            value={krForm.title}
            onChange={(value) => {
              setKrForm({ ...krForm, title: value });
              if (krFormErrors.title) {
                setKrFormErrors({ ...krFormErrors, title: undefined });
              }
            }}
            placeholder="请输入关键结果标题"
            error={krFormErrors.title}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="目标值"
              type="number"
              value={krForm.targetValue}
              onChange={(value) => {
                setKrForm({ ...krForm, targetValue: value });
                if (krFormErrors.targetValue) {
                  setKrFormErrors({ ...krFormErrors, targetValue: undefined });
                }
              }}
              placeholder="请输入目标值"
              error={krFormErrors.targetValue}
            />
            <Input
              label="当前值"
              type="number"
              value={krForm.currentValue}
              onChange={(value) => setKrForm({ ...krForm, currentValue: value })}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="单位"
              value={krForm.unit}
              onChange={(value) => setKrForm({ ...krForm, unit: value })}
              placeholder="%"
            />
            <Input
              label="权重 (%)"
              type="number"
              value={krForm.weight}
              onChange={(value) => setKrForm({ ...krForm, weight: value })}
              placeholder="30"
            />
          </div>

          <Select
            label="负责人"
            value={krForm.ownerId}
            onChange={(value) => setKrForm({ ...krForm, ownerId: value })}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            placeholder="请选择负责人"
          />
        </div>
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title="新建任务"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseTaskModal}>
              取消
            </Button>
            <Button onClick={handleAddTask}>
              创建任务
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="任务标题"
            value={taskForm.title}
            onChange={(value) => {
              setTaskForm({ ...taskForm, title: value });
              if (taskFormErrors.title) {
                setTaskFormErrors({ ...taskFormErrors, title: undefined });
              }
            }}
            placeholder="请输入任务标题"
            error={taskFormErrors.title}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="负责人"
              value={taskForm.assigneeId}
              onChange={(value) => setTaskForm({ ...taskForm, assigneeId: value })}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="请选择负责人"
            />
            <Select
              label="优先级"
              value={taskForm.priority}
              onChange={(value) => setTaskForm({ ...taskForm, priority: value as TaskPriority })}
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' },
              ]}
            />
          </div>

          <Input
            label="截止日期"
            type="date"
            value={taskForm.dueDate}
            onChange={(value) => setTaskForm({ ...taskForm, dueDate: value })}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export { Goals };
export default Goals;
