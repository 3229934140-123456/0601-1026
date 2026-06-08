import {
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  MessageSquare,
  CheckSquare,
  Flag,
  FileText,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layout } from '../components/Layout/Layout';
import { ProgressBar } from '../components/ProgressBar';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { useStore } from '../store/useStore';
import { weeklyTrendData, categoryData } from '../data/mockData';
import { formatRelativeTime } from '../utils/helpers';

const statCards = [
  {
    title: '目标总数',
    value: 9,
    change: '+2',
    trend: 'up',
    icon: Target,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    title: '进行中',
    value: 7,
    change: '+1',
    trend: 'up',
    icon: Clock,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: '已完成',
    value: 2,
    change: '0',
    trend: 'neutral',
    icon: CheckCircle,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: '风险项',
    value: 4,
    change: '+1',
    trend: 'down',
    icon: AlertTriangle,
    color: 'from-amber-500 to-amber-600',
  },
];

export const Dashboard = () => {
  const { goals, keyResults, tasks, risks, activities, calculateGoalProgress, getUserById } =
    useStore();

  const activeGoals = goals.filter((g) => !g.archived && g.status === 'active');
  const overallProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + calculateGoalProgress(g.id), 0) / activeGoals.length
        )
      : 0;

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const myTasks = tasks.filter((t) => t.assigneeId === 'user-1');

  const getActivityIcon = (type: string) => {
    const icons = {
      progress: TrendingUp,
      comment: MessageSquare,
      task: CheckSquare,
      risk: Flag,
      goal: Target,
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      progress: 'bg-emerald-100 text-emerald-600',
      comment: 'bg-blue-100 text-blue-600',
      task: 'bg-purple-100 text-purple-600',
      risk: 'bg-amber-100 text-amber-600',
      goal: 'bg-indigo-100 text-indigo-600',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  return (
    <Layout title="仪表盘" subtitle="Q2 2026 · 目标执行概览">
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {card.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      ) : card.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                      ) : null}
                      <span
                        className={`text-sm font-medium ${
                          card.trend === 'up'
                            ? 'text-emerald-600'
                            : card.trend === 'down'
                            ? 'text-rose-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {card.change} 较上周
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 整体进度 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">整体进度</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${overallProgress * 2.64} 264`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{overallProgress}%</span>
                  <span className="text-sm text-gray-500">完成率</span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {activeGoals.slice(0, 3).map((goal) => (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate flex-1 mr-2">
                      {goal.title}
                    </span>
                    <span className="text-gray-500">{calculateGoalProgress(goal.id)}%</span>
                  </div>
                  <ProgressBar percent={calculateGoalProgress(goal.id)} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* 趋势图 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-gray-900">进度趋势</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg">
                  本周
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg">
                  本月
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg">
                  本季度
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#E5E7EB"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    name="目标线"
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="#6366F1"
                    strokeWidth={3}
                    dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#6366F1' }}
                    name="实际进度"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 我的任务 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">我的任务</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {inProgressTasks.slice(0, 3).map((task) => {
                const assignee = getUserById(task.assigneeId);
                return (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded border-2 border-blue-400 bg-blue-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar name={assignee?.name || '未知'} size="sm" />
                          <StatusBadge status={task.priority} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-gray-900">{todoTasks.length}</p>
                  <p className="text-xs text-gray-500 mt-1">待办</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{inProgressTasks.length}</p>
                  <p className="text-xs text-gray-500 mt-1">进行中</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">
                    {tasks.filter((t) => t.status === 'done').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">已完成</p>
                </div>
              </div>
            </div>
          </div>

          {/* 分类占比 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">目标分类</h3>
            <div className="flex items-center justify-center">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 风险概览 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">风险概览</h3>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                {risks.filter((r) => r.status === 'open').length} 项待处理
              </span>
            </div>
            <div className="space-y-3">
              {risks.slice(0, 3).map((risk) => (
                <div
                  key={risk.id}
                  className="p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  style={{
                    borderLeftColor:
                      risk.level === 'critical'
                        ? '#F43F5E'
                        : risk.level === 'high'
                        ? '#F97316'
                        : risk.level === 'medium'
                        ? '#F59E0B'
                        : '#9CA3AF',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{risk.title}</p>
                    <StatusBadge status={risk.level} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{risk.description}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors">
              查看全部风险
            </button>
          </div>
        </div>

        {/* 近期动态 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">近期动态</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-6">
              {activities.slice(0, 5).map((activity) => {
                const user = getUserById(activity.userId);
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="relative flex gap-4 pl-10">
                    <div
                      className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Avatar name={user?.name || '未知'} size="sm" />
                        <span className="text-sm font-medium text-gray-900">
                          {user?.name}
                        </span>
                        <span className="text-sm text-gray-600">{activity.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 ml-10">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1 ml-10">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
