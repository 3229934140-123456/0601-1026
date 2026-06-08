import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Archive,
  Target,
  AlertTriangle,
  Calendar,
  Trophy,
  ChevronRight,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Layout } from '../components/Layout/Layout';
import { ProgressBar } from '../components/ProgressBar';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn } from '../utils/helpers';

const weeklyTrendData = [
  { week: 'W14', progress: 15, target: 25 },
  { week: 'W15', progress: 28, target: 35 },
  { week: 'W16', progress: 42, target: 50 },
  { week: 'W17', progress: 55, target: 60 },
  { week: 'W18', progress: 68, target: 72 },
  { week: 'W19', progress: 75, target: 80 },
];

const periodCompareData = [
  { period: 'Q4 2025', completed: 65, total: 8 },
  { period: 'Q1 2026', completed: 72, total: 10 },
  { period: 'Q2 2026', completed: 78, total: 9 },
];

const categoryData = [
  { name: '产品研发', value: 45, color: '#1E3A8A' },
  { name: '用户增长', value: 30, color: '#6366F1' },
  { name: '运营效率', value: 15, color: '#8B5CF6' },
  { name: '团队建设', value: 10, color: '#A78BFA' },
];

export const Stats = () => {
  const { goals, keyResults, tasks, risks, meetings, users, calculateGoalProgress, getUserById } =
    useStore();

  const activeGoals = goals.filter((g) => !g.archived && g.status === 'active');
  const avgProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + calculateGoalProgress(g.id), 0) / activeGoals.length
        )
      : 0;

  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const totalGoals = goals.filter((g) => !g.archived).length;
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const openRisks = risks.filter((r) => r.status === 'open').length;
  const meetingCount = meetings.length;

  const statCardData = [
    {
      title: '目标完成率',
      value: `${goalCompletionRate}%`,
      change: '+5%',
      trend: 'up',
      icon: Target,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: '平均进度',
      value: `${avgProgress}%`,
      change: '+8%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: '风险数量',
      value: openRisks,
      change: '-1',
      trend: 'up',
      icon: AlertTriangle,
      color: 'from-amber-500 to-amber-600',
    },
    {
      title: '会议次数',
      value: meetingCount,
      change: '+2',
      trend: 'up',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
    },
  ];

  const userPerformance = users.map((user) => {
    const userGoals = goals.filter((g) => g.ownerId === user.id && !g.archived);
    const userAvgProgress =
      userGoals.length > 0
        ? Math.round(
            userGoals.reduce((sum, g) => sum + calculateGoalProgress(g.id), 0) / userGoals.length
          )
        : 0;
    const completedCount = userGoals.filter((g) => g.status === 'completed').length;
    return {
      user,
      avgProgress: userAvgProgress,
      goalCount: userGoals.length,
      completedCount,
    };
  });

  const sortedPerformance = [...userPerformance].sort((a, b) => b.avgProgress - a.avgProgress);

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-amber-100 text-amber-700';
    if (index === 1) return 'bg-gray-200 text-gray-600';
    if (index === 2) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <Layout title="统计" subtitle="数据分析与报告">
      <div className="space-y-6">
        {/* 功能按钮区 */}
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <FileText className="w-4 h-4" />
            生成周报
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            导出绩效
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
            <Archive className="w-4 h-4" />
            目标归档
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          {statCardData.map((card, index) => {
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
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          card.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
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

        {/* 图表区域 - 折线图和柱状图 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 完成率趋势图 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">完成率趋势</h3>
                  <p className="text-xs text-gray-500">最近6周目标完成率变化</p>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                    iconSize={8}
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
                    name="实际完成率"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 周期对比图 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">周期对比</h3>
                  <p className="text-xs text-gray-500">最近几个周期目标完成情况</p>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodCompareData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="total"
                    name="目标总数"
                    fill="#E5E7EB"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="已完成"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 人员绩效排行和分类占比 */}
        <div className="grid grid-cols-3 gap-6">
          {/* 人员绩效排行 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">人员绩效排行</h3>
                  <p className="text-xs text-gray-500">团队成员目标完成情况</p>
                </div>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {sortedPerformance.map((item, index) => (
                <div
                  key={item.user.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      getRankBadge(index)
                    )}
                  >
                    {index + 1}
                  </div>
                  <Avatar name={item.user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{item.user.name}</span>
                        <span className="text-xs text-gray-500">{item.user.department}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.avgProgress}%
                      </span>
                    </div>
                    <ProgressBar percent={item.avgProgress} size="sm" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {item.completedCount}/{item.goalCount}
                    </p>
                    <p className="text-xs text-gray-500">完成/总数</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 目标分类占比 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">目标分类</h3>
                <p className="text-xs text-gray-500">不同分类占比</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number) => [`${value}%`, '占比']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
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
        </div>
      </div>
    </Layout>
  );
};
