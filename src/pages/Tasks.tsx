import React, { useState, useMemo, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Calendar,
  Flag,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Target,
  Plus,
  ChevronRight,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { Modal, Button, Input, Textarea, Select } from '../components/Modal';
import { useStore } from '../store/useStore';
import { cn, formatShortDate, formatDateTime, getPriorityColor, getPriorityText } from '../utils/helpers';
import { TaskStatus, TaskPriority } from '../types';

const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'todo', title: '待办', color: 'bg-gray-100 text-gray-700' },
  { status: 'in_progress', title: '进行中', color: 'bg-blue-100 text-blue-700' },
  { status: 'done', title: '已完成', color: 'bg-emerald-100 text-emerald-700' },
];

type SortField = 'title' | 'priority' | 'dueDate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const Tasks = () => {
  const navigate = useNavigate();
  const {
    tasks,
    keyResults,
    users,
    meetings,
    taskViewMode,
    setTaskViewMode,
    addTask,
    updateTaskStatus,
    getUserById,
    getGoalById,
    setSelectedMeetingId,
  } = useStore();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keyResultId: '',
    assigneeId: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
  });
  const [formErrors, setFormErrors] = useState<{ title?: string }>({});

  const getKeyResultById = (krId: string) => {
    return keyResults.find((kr) => kr.id === krId);
  };

  const keyResultOptions = useMemo(() => {
    return keyResults.map((kr) => {
      const goal = getGoalById(kr.goalId);
      return {
        value: kr.id,
        label: goal ? `${goal.title} - ${kr.title}` : kr.title,
      };
    });
  }, [keyResults, getGoalById]);

  const userOptions = useMemo(() => {
    return users.map((user) => ({
      value: user.id,
      label: user.name,
    }));
  }, [users]);

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ];

  const handleOpenModal = () => {
    setFormData({
      title: '',
      description: '',
      keyResultId: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      keyResultId: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      setFormErrors({ title: '任务标题不能为空' });
      return;
    }

    addTask({
      title: formData.title.trim(),
      description: formData.description,
      keyResultId: formData.keyResultId || keyResults[0]?.id || '',
      assigneeId: formData.assigneeId || users[0]?.id || '',
      priority: formData.priority,
      status: 'todo',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
    });

    handleCloseModal();
  };

  const handleStatusClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateTaskStatus(taskId, nextStatus);
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filterPriority !== 'all') {
      result = result.filter((t) => t.priority === filterPriority);
    }

    if (filterAssignee !== 'all') {
      result = result.filter((t) => t.assigneeId === filterAssignee);
    }

    const priorityOrder: Record<TaskPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, filterPriority, filterAssignee, sortField, sortOrder]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof tasks> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      updateTaskStatus(draggedTaskId, status);
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const assignees = useMemo(() => {
    const uniqueAssignees = new Set(tasks.map((t) => t.assigneeId));
    return Array.from(uniqueAssignees).map((id) => ({
      id,
      name: getUserById(id)?.name || '未知',
    }));
  }, [tasks, getUserById]);

  const TaskCard = ({ task }: { task: typeof tasks[0] }) => {
    const assignee = getUserById(task.assigneeId);
    const keyResult = getKeyResultById(task.keyResultId);
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          'bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing',
          'hover:shadow-md hover:border-indigo-200 transition-all duration-200',
          draggedTaskId === task.id && 'opacity-50 rotate-2 scale-105'
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
            {task.title}
          </h4>
          <span
            className={cn(
              'shrink-0 px-2 py-0.5 text-xs font-medium rounded-md',
              getPriorityColor(task.priority)
            )}
          >
            {getPriorityText(task.priority)}
          </span>
        </div>

        {keyResult && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">{keyResult.title}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <Avatar name={assignee?.name || '未知'} size="sm" />
            <span className="text-xs text-gray-600">{assignee?.name || '未知'}</span>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-rose-500' : 'text-gray-400'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatShortDate(task.dueDate)}</span>
          </div>
        </div>
      </div>
    );
  };

  const KanbanView = () => (
    <div className="grid grid-cols-3 gap-6">
      {statusColumns.map((column) => (
        <div
          key={column.status}
          onDragOver={(e) => handleDragOver(e, column.status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.status)}
          className={cn(
            'rounded-xl flex flex-col min-h-96 transition-colors duration-200',
            dragOverStatus === column.status ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'bg-gray-50'
          )}
        >
          <div className="p-4 border-b border-gray-100 bg-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', column.color.split(' ')[0])} />
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="text-sm text-gray-400 font-medium">
                  {tasksByStatus[column.status].length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            {tasksByStatus[column.status].map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasksByStatus[column.status].length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <List className="w-6 h-6" />
                </div>
                <p className="text-sm">暂无任务</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">筛选：</span>
          </div>

          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">全部优先级</option>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">全部负责人</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-900">{filteredTasks.length}</span> 个任务
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  任务标题
                  <ArrowUpDown className={cn(
                    'w-3.5 h-3.5',
                    sortField === 'title' ? 'text-indigo-500' : 'text-gray-300'
                  )} />
                </button>
              </th>
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  关联关键结果
                </span>
              </th>
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  优先级
                  <ArrowUpDown className={cn(
                    'w-3.5 h-3.5',
                    sortField === 'priority' ? 'text-indigo-500' : 'text-gray-300'
                  )} />
                </button>
              </th>
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  状态
                </span>
              </th>
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  负责人
                </span>
              </th>
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => handleSort('dueDate')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  截止日期
                  <ArrowUpDown className={cn(
                    'w-3.5 h-3.5',
                    sortField === 'dueDate' ? 'text-indigo-500' : 'text-gray-300'
                  )} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTasks.map((task) => {
              const assignee = getUserById(task.assigneeId);
              const keyResult = getKeyResultById(task.keyResultId);
              const goal = keyResult ? getGoalById(keyResult.goalId) : null;
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
              const isExpanded = expandedTaskId === task.id;

              return (
                <React.Fragment key={task.id}>
                  <tr
                    className={cn(
                      'hover:bg-gray-50 transition-colors cursor-pointer',
                      isExpanded && 'bg-gray-50'
                    )}
                    onClick={() => toggleTaskExpand(task.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 text-gray-400 transition-transform shrink-0',
                            isExpanded && 'rotate-90'
                          )}
                        />
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-sm text-gray-600 truncate max-w-48">
                          {keyResult?.title || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md',
                          getPriorityColor(task.priority)
                        )}
                      >
                        <Flag className="w-3 h-3 mr-1" />
                        {getPriorityText(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        onClick={(e) => handleStatusClick(task.id, e)}
                        className="inline-block cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-300 rounded-md transition-all"
                        title="点击切换状态"
                      >
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={assignee?.name || '未知'} size="sm" />
                        <span className="text-sm text-gray-700">
                          {assignee?.name || '未知'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={cn(
                          'flex items-center gap-1.5 text-sm',
                          isOverdue ? 'text-rose-500 font-medium' : 'text-gray-600'
                        )}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{formatShortDate(task.dueDate)}</span>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="pl-6 space-y-3">
                          {task.description && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                任务描述
                              </h5>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {task.description}
                              </p>
                            </div>
                          )}
                          {goal && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                所属目标
                              </h5>
                              <p className="text-sm text-gray-700">{goal.title}</p>
                            </div>
                          )}
                          {task.meetingId && task.actionItemId && (() => {
                            const meeting = meetings.find((m) => m.id === task.meetingId);
                            const actionItem = meeting?.actionItems.find((item) => item.id === task.actionItemId);
                            const isSourceValid = meeting && actionItem;

                            return (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                  来源会议
                                </h5>
                                {isSourceValid ? (
                                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {meeting.title}
                                          </p>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                          行动项：{actionItem.content}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          创建时间：{formatDateTime(meeting.createdAt)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMeetingId(meeting.id);
                                          navigate('/meetings');
                                        }}
                                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        查看会议
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 rounded-lg border border-gray-200 p-3">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                                      <p className="text-sm text-gray-500">
                                        来源已移除
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                负责人：{assignee?.name || '未知'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Flag className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                优先级：{getPriorityText(task.priority)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                创建时间：{formatShortDate(task.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <List className="w-8 h-8" />
          </div>
          <p className="text-base font-medium text-gray-600">暂无任务</p>
          <p className="text-sm text-gray-400 mt-1">调整筛选条件或创建新任务</p>
        </div>
      )}
    </div>
  );

  const NewTaskModal = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      title="新建任务"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleCloseModal}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            创建任务
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="任务标题"
          value={formData.title}
          onChange={(v) => {
            setFormData({ ...formData, title: v });
            if (formErrors.title) setFormErrors({});
          }}
          placeholder="请输入任务标题"
          error={formErrors.title}
        />

        <Textarea
          label="任务描述"
          value={formData.description}
          onChange={(v) => setFormData({ ...formData, description: v })}
          placeholder="请输入任务描述（可选）"
          rows={3}
        />

        <Select
          label="关联关键结果"
          value={formData.keyResultId}
          onChange={(v) => setFormData({ ...formData, keyResultId: v })}
          options={keyResultOptions}
          placeholder="请选择关联的关键结果"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="负责人"
            value={formData.assigneeId}
            onChange={(v) => setFormData({ ...formData, assigneeId: v })}
            options={userOptions}
            placeholder="请选择负责人"
          />

          <Select
            label="优先级"
            value={formData.priority}
            onChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
            options={priorityOptions}
          />
        </div>

        <Input
          label="截止日期"
          type="date"
          value={formData.dueDate}
          onChange={(v) => setFormData({ ...formData, dueDate: v })}
        />
      </div>
    </Modal>
  );

  return (
    <Layout title="任务" subtitle="任务管理与跟踪">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setTaskViewMode('kanban')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                taskViewMode === 'kanban'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              看板视图
            </button>
            <button
              onClick={() => setTaskViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                taskViewMode === 'list'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <List className="w-4 h-4" />
              列表视图
            </button>
          </div>

          <Button onClick={handleOpenModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            新建任务
          </Button>
        </div>

        {taskViewMode === 'kanban' ? <KanbanView /> : <ListView />}
        <NewTaskModal />
      </div>
    </Layout>
  );
};
