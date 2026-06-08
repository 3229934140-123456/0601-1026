import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Archive,
  Target,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Trophy,
  ChevronRight,
  X,
  Check,
  FileDown,
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
import { Modal, Button } from '../components/Modal';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../utils/helpers';

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

const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

export const Stats = () => {
  const {
    goals,
    keyResults,
    tasks,
    risks,
    meetings,
    users,
    progresses,
    calculateGoalProgress,
    getUserById,
    getKeyResultsByGoalId,
    archiveGoal,
  } = useStore();

  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedArchiveGoals, setSelectedArchiveGoals] = useState<string[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const { start: weekStart, end: weekEnd } = getWeekRange();

  const weeklyProgressCount = progresses.filter((p) => {
    const pDate = new Date(p.createdAt);
    return pDate >= weekStart && pDate <= weekEnd;
  }).length;

  const weeklyCompletedTasks = tasks.filter((t) => {
    const tDate = new Date(t.createdAt);
    return t.status === 'done' && tDate >= weekStart && tDate <= weekEnd;
  }).length;

  const weeklyMeetings = meetings.filter((m) => {
    const mDate = new Date(m.date);
    return mDate >= weekStart && mDate <= weekEnd;
  }).length;

  const weeklyNewRisks = risks.filter((r) => {
    const rDate = new Date(r.createdAt);
    return rDate >= weekStart && rDate <= weekEnd;
  }).length;

  const weeklyResolvedRisks = risks.filter((r) => {
    const rDate = new Date(r.updatedAt);
    return r.status === 'resolved' && rDate >= weekStart && rDate <= weekEnd;
  }).length;

  const archivableGoals = goals.filter(
    (g) => !g.archived && (g.status === 'completed' || new Date(g.endDate) < new Date())
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const generateWeeklyReportText = () => {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push('           团队目标周报');
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    lines.push(`📅 周期：${formatDate(weekStart.toISOString())} - ${formatDate(weekEnd.toISOString())}`);
    lines.push(`生成时间：${formatDate(new Date().toISOString())}`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('一、目标完成进度概览');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`  活跃目标数：${activeGoals.length} 个`);
    lines.push(`  已完成目标：${completedGoals} 个`);
    lines.push(`  目标完成率：${goalCompletionRate}%`);
    lines.push(`  平均进度：${avgProgress}%`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('二、本周数据统计');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`  📈 新增进展：${weeklyProgressCount} 条`);
    lines.push(`  ✅ 完成任务：${weeklyCompletedTasks} 个`);
    lines.push(`  👥 会议记录：${weeklyMeetings} 次`);
    lines.push(`  ⚠️  新增风险：${weeklyNewRisks} 个`);
    lines.push(`  ✨ 解决风险：${weeklyResolvedRisks} 个`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('三、风险状态变化');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`  当前待处理风险：${openRisks} 个`);
    lines.push(`  本周新增：${weeklyNewRisks} 个`);
    lines.push(`  本周解决：${weeklyResolvedRisks} 个`);
    const netChange = weeklyResolvedRisks - weeklyNewRisks;
    lines.push(`  净变化：${netChange >= 0 ? '+' : ''}${netChange} 个`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('四、各目标完成情况');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    activeGoals.forEach((goal, index) => {
      const progress = calculateGoalProgress(goal.id);
      const owner = getUserById(goal.ownerId);
      const krs = getKeyResultsByGoalId(goal.id);
      lines.push(`  ${index + 1}. ${goal.title}`);
      lines.push(`     ├─ 负责人：${owner?.name || '未分配'}`);
      lines.push(`     ├─ 类型：${goal.type === 'department' ? '部门目标' : '个人目标'}`);
      lines.push(`     ├─ 周期：${goal.period} ${goal.year}`);
      lines.push(`     ├─ 进度：${progress}%`);
      lines.push(`     ├─ 关键结果数：${krs.length} 个`);
      lines.push(`     └─ 状态：${goal.status === 'active' ? '进行中' : goal.status}`);
      lines.push('');
    });

    if (activeGoals.length === 0) {
      lines.push('  暂无活跃目标');
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════');
    lines.push('           报告结束');
    lines.push('═══════════════════════════════════════════');

    return lines.join('\n');
  };

  const handleDownloadWeeklyReport = () => {
    const content = generateWeeklyReportText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    link.download = `团队周报_${startStr}_${endStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('周报下载成功');
  };

  const handleExportPerformance = () => {
    const headers = [
      '目标名称',
      '目标类型',
      '目标周期',
      '目标权重',
      '目标负责人',
      '关键结果名称',
      '目标值',
      '当前值',
      '完成率',
      'KR权重',
      'KR负责人',
      '整体完成率',
    ];

    const rows: string[][] = [];

    goals
      .filter((g) => !g.archived)
      .forEach((goal) => {
        const goalProgress = calculateGoalProgress(goal.id);
        const goalOwner = getUserById(goal.ownerId);
        const krs = getKeyResultsByGoalId(goal.id);

        if (krs.length === 0) {
          rows.push([
            goal.title,
            goal.type === 'department' ? '部门目标' : '个人目标',
            `${goal.year} ${goal.period}`,
            `${goal.weight}%`,
            goalOwner?.name || '',
            '',
            '',
            '',
            '',
            '',
            '',
            `${goalProgress}%`,
          ]);
        } else {
          krs.forEach((kr, index) => {
            const krProgress = Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100));
            const krOwner = getUserById(kr.ownerId);
            rows.push([
              index === 0 ? goal.title : '',
              index === 0 ? (goal.type === 'department' ? '部门目标' : '个人目标') : '',
              index === 0 ? `${goal.year} ${goal.period}` : '',
              index === 0 ? `${goal.weight}%` : '',
              index === 0 ? goalOwner?.name || '' : '',
              kr.title,
              `${kr.targetValue} ${kr.unit}`,
              `${kr.currentValue} ${kr.unit}`,
              `${krProgress}%`,
              `${kr.weight}%`,
              krOwner?.name || '',
              index === 0 ? `${goalProgress}%` : '',
            ]);
          });
        }
      });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `绩效数据_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('绩效数据导出成功');
  };

  const toggleArchiveGoal = (goalId: string) => {
    setSelectedArchiveGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleArchiveGoals = () => {
    selectedArchiveGoals.forEach((id) => {
      archiveGoal(id);
    });
    setSelectedArchiveGoals([]);
    setShowArchiveModal(false);
    showToast(`成功归档 ${selectedArchiveGoals.length} 个目标`);
  };

  const handleSelectAllArchivable = () => {
    if (selectedArchiveGoals.length === archivableGoals.length) {
      setSelectedArchiveGoals([]);
    } else {
      setSelectedArchiveGoals(archivableGoals.map((g) => g.id));
    }
  };

  return (
    <Layout title="统计" subtitle="数据分析与报告">
      <div className="space-y-6 relative">
        {/* 功能按钮区 */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowWeeklyReport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            生成周报
          </button>
          <button
            onClick={handleExportPerformance}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出绩效
          </button>
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
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

        {/* 周报模态框 */}
        <Modal
          isOpen={showWeeklyReport}
          onClose={() => setShowWeeklyReport(false)}
          title="本周工作周报"
          size="xl"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowWeeklyReport(false)}>
                关闭
              </Button>
              <Button onClick={handleDownloadWeeklyReport} className="gap-2">
                <FileDown className="w-4 h-4" />
                下载周报
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6" />
                <h3 className="text-xl font-bold">本周工作周报</h3>
              </div>
              <p className="text-indigo-100">
                {formatDate(weekStart.toISOString())} - {formatDate(weekEnd.toISOString())}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-indigo-600">{goalCompletionRate}%</div>
                <div className="text-sm text-indigo-600 mt-1">目标完成率</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{weeklyProgressCount}</div>
                <div className="text-sm text-emerald-600 mt-1">新增进展</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{weeklyCompletedTasks}</div>
                <div className="text-sm text-amber-600 mt-1">完成任务</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{weeklyMeetings}</div>
                <div className="text-sm text-blue-600 mt-1">会议记录</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                风险状态变化
              </h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-rose-600">{weeklyNewRisks}</div>
                    <div className="text-sm text-gray-500">新增风险</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{weeklyResolvedRisks}</div>
                    <div className="text-sm text-gray-500">解决风险</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{openRisks}</div>
                    <div className="text-sm text-gray-500">待处理风险</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                各目标完成情况
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activeGoals.length > 0 ? (
                  activeGoals.map((goal) => {
                    const progress = calculateGoalProgress(goal.id);
                    const owner = getUserById(goal.ownerId);
                    return (
                      <div
                        key={goal.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Target className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{goal.title}</p>
                              <p className="text-xs text-gray-500">
                                负责人：{owner?.name || '未分配'} · {goal.period} {goal.year}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">{progress}%</span>
                        </div>
                        <ProgressBar percent={progress} size="sm" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无活跃目标
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* 归档模态框 */}
        <Modal
          isOpen={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false);
            setSelectedArchiveGoals([]);
          }}
          title="目标归档"
          size="lg"
          footer={
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                已选择 {selectedArchiveGoals.length} 个目标
              </span>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowArchiveModal(false);
                    setSelectedArchiveGoals([]);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  onClick={handleArchiveGoals}
                  disabled={selectedArchiveGoals.length === 0}
                  className="gap-2"
                >
                  <Archive className="w-4 h-4" />
                  确认归档
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              选择需要归档的目标（已完成或已结束的目标），归档后目标将从活跃视图中移除。
            </p>

            {archivableGoals.length > 0 ? (
              <>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedArchiveGoals.length === archivableGoals.length && archivableGoals.length > 0}
                      onChange={handleSelectAllArchivable}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">全选</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    共 {archivableGoals.length} 个可归档目标
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {archivableGoals.map((goal) => {
                    const progress = calculateGoalProgress(goal.id);
                    const owner = getUserById(goal.ownerId);
                    const isSelected = selectedArchiveGoals.includes(goal.id);
                    return (
                      <div
                        key={goal.id}
                        onClick={() => toggleArchiveGoal(goal.id)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border',
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-indigo-600'
                              : 'border-2 border-gray-300'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{goal.title}</p>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                goal.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {goal.status === 'completed' ? '已完成' : '已结束'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            负责人：{owner?.name || '未分配'} · {goal.period} {goal.year} · 权重 {goal.weight}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{progress}%</p>
                          <p className="text-xs text-gray-500">完成进度</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">暂无需要归档的目标</p>
                <p className="text-sm text-gray-400 mt-1">所有目标都在活跃状态中</p>
              </div>
            )}
          </div>
        </Modal>

        {/* 成功提示 */}
        {showSuccessToast && (
          <div className="fixed top-6 right-6 z-50 animate-fade-in">
            <div className="bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
};
