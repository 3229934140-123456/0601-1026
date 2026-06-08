import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Target,
  User,
  Calendar,
  Filter,
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn, formatDate, formatRelativeTime } from '../utils/helpers';
import { RiskLevel, RiskStatus } from '../types';

const statusColumns: { status: RiskStatus; title: string; color: string; icon: typeof AlertTriangle }[] = [
  { status: 'open', title: '待处理', color: 'bg-rose-500', icon: AlertTriangle },
  { status: 'mitigating', title: '缓解中', color: 'bg-amber-500', icon: Shield },
  { status: 'resolved', title: '已解决', color: 'bg-emerald-500', icon: CheckCircle },
];

const levelColors: Record<RiskLevel, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

const levelBadgeColors: Record<RiskLevel, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-700',
};

const levelText: Record<RiskLevel, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

type ViewMode = 'kanban' | 'list';
type FilterLevel = 'all' | RiskLevel;

export const Risks = () => {
  const { risks, getUserById, getGoalById } = useStore();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const filteredRisks = useMemo(() => {
    if (filterLevel === 'all') return risks;
    return risks.filter((r) => r.level === filterLevel);
  }, [risks, filterLevel]);

  const risksByStatus = useMemo(() => {
    const grouped: Record<RiskStatus, typeof risks> = {
      open: [],
      mitigating: [],
      resolved: [],
    };
    filteredRisks.forEach((risk) => {
      grouped[risk.status].push(risk);
    });
    return grouped;
  }, [filteredRisks]);

  const toggleExpand = (riskId: string) => {
    setExpandedRiskId(expandedRiskId === riskId ? null : riskId);
  };

  const RiskCard = ({ risk }: { risk: (typeof risks)[0] }) => {
    const owner = getUserById(risk.ownerId);
    const goal = risk.goalId ? getGoalById(risk.goalId) : null;
    const isExpanded = expandedRiskId === risk.id;

    return (
      <div
        className={cn(
          'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden',
          'hover:shadow-md hover:border-indigo-200 transition-all duration-200'
        )}
      >
        <div
          className="flex cursor-pointer"
          onClick={() => toggleExpand(risk.id)}
        >
          <div className={cn('w-1.5 shrink-0', levelColors[risk.level])} />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                {risk.title}
              </h4>
              <span
                className={cn(
                  'shrink-0 px-2 py-0.5 text-xs font-medium rounded-md',
                  levelBadgeColors[risk.level]
                )}
              >
                {levelText[risk.level]}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={risk.status} size="sm" />
            </div>

            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {risk.description}
            </p>

            {goal && (
              <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
                <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{goal.title}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <Avatar name={owner?.name || '未知'} size="sm" />
                <span className="text-xs text-gray-600 truncate max-w-24">
                  {owner?.name || '未知'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelativeTime(risk.updatedAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center mt-2">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-4 pb-4">
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                  风险描述
                </h5>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {risk.description}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  缓解方案
                </h5>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {risk.mitigation}
                </p>
              </div>

              <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>负责人：{owner?.name || '未知'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>更新于：{formatDate(risk.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KanbanView = () => (
    <div className="grid grid-cols-3 gap-6">
      {statusColumns.map((column) => {
        const Icon = column.icon;
        return (
          <div
            key={column.status}
            className="rounded-xl flex flex-col min-h-96 bg-gray-50"
          >
            <div className="p-4 border-b border-gray-100 bg-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="text-sm text-gray-400 font-medium">
                    {risksByStatus[column.status].length}
                  </span>
                </div>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {risksByStatus[column.status].map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
              {risksByStatus[column.status].length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <List className="w-6 h-6" />
                  </div>
                  <p className="text-sm">暂无风险</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  风险标题
                </span>
              </th>
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  等级
                </span>
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
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  关联目标
                </span>
              </th>
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  更新时间
                </span>
              </th>
              <th className="text-left px-6 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRisks.map((risk) => {
              const owner = getUserById(risk.ownerId);
              const goal = risk.goalId ? getGoalById(risk.goalId) : null;
              const isExpanded = expandedRiskId === risk.id;

              return (
                <>
                  <tr
                    key={risk.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(risk.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-1.5 h-8 rounded-full shrink-0',
                            levelColors[risk.level]
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {risk.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1 max-w-md mt-0.5">
                            {risk.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md',
                          levelBadgeColors[risk.level]
                        )}
                      >
                        {levelText[risk.level]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={risk.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={owner?.name || '未知'} size="sm" />
                        <span className="text-sm text-gray-700">
                          {owner?.name || '未知'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {goal ? (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-sm text-gray-600 truncate max-w-48">
                            {goal.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(risk.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        {isExpanded ? '收起' : '详情'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                              风险描述
                            </h5>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {risk.description}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-gray-400" />
                              缓解方案
                            </h5>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {risk.mitigation}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRisks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <List className="w-8 h-8" />
          </div>
          <p className="text-base font-medium text-gray-600">暂无风险</p>
          <p className="text-sm text-gray-400 mt-1">调整筛选条件或登记新风险</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout title="风险" subtitle="风险管理与跟踪">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'kanban'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              看板视图
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <List className="w-4 h-4" />
              列表视图
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
                className="appearance-none bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer pr-6"
              >
                <option value="all">全部等级</option>
                <option value="critical">紧急</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 -ml-4 pointer-events-none" />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              登记风险
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-900">{filteredRisks.length}</span> 个风险
        </div>

        {viewMode === 'kanban' ? <KanbanView /> : <ListView />}
      </div>
    </Layout>
  );
};
