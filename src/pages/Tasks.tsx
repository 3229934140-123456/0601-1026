import { useState, useMemo, DragEvent } from 'react';
import {
  LayoutGrid,
  List,
  Calendar,
  Flag,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Target,
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn, formatShortDate, getPriorityColor, getPriorityText } from '../utils/helpers';
import { TaskStatus, TaskPriority } from '../types';

const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'todo', title: '待办', color: 'bg-gray-100 text-gray-700' },
  { status: 'in_progress', title: '进行中', color: 'bg-blue-100 text-blue-700' },
  { status: 'done', title: '已完成', color: 'bg-emerald-100 text-emerald-700' },
];

type SortField = 'title' | 'priority' | 'dueDate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const Tasks = () => {
  const {
    tasks,
    keyResults,
    taskViewMode,
    setTaskViewMode,
    updateTaskStatus,
    getUserById,
  } = useStore();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getKeyResultById = (krId: string) => {
    return keyResults.find((kr) => kr.id === krId);
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
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

              return (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
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
                    <StatusBadge status={task.status} size="sm" />
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
        </div>

        {taskViewMode === 'kanban' ? <KanbanView /> : <ListView />}
      </div>
    </Layout>
  );
};
