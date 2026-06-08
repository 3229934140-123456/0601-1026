import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ListTree, AlignHorizontalJustifyEnd, X, Target, Calendar, Scale, User, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../utils/helpers';
import type { Goal, KeyResult } from '../types';

const Goals = () => {
  const {
    goals,
    selectedGoalId,
    setSelectedGoalId,
    viewMode,
    setViewMode,
    calculateGoalProgress,
    getKeyResultsByGoalId,
    getChildGoals,
    getUserById,
  } = useStore();

  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set(['goal-1', 'goal-2']));

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

    return (
      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-4">
          {departmentGoals.map((deptGoal) => {
            const childGoals = getChildGoals(deptGoal.id);
            const deptProgress = calculateGoalProgress(deptGoal.id);
            const deptOwner = getUserById(deptGoal.ownerId);
            const isDeptSelected = selectedGoalId === deptGoal.id;

            return (
              <div key={deptGoal.id} className="flex gap-6">
                <div className="w-72 flex-shrink-0">
                  <div
                    className={cn(
                      'p-5 rounded-xl bg-white border transition-all duration-200 cursor-pointer',
                      isDeptSelected
                        ? 'border-indigo-300 shadow-md ring-2 ring-indigo-100'
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
                  {childGoals.map((personalGoal, index) => {
                    const progress = calculateGoalProgress(personalGoal.id);
                    const owner = getUserById(personalGoal.ownerId);
                    const isSelected = selectedGoalId === personalGoal.id;

                    return (
                      <div
                        key={personalGoal.id}
                        className="relative"
                      >
                        {index < childGoals.length - 1 && (
                          <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-200 -translate-x-full" />
                        )}
                        {index === 0 && (
                          <div className="absolute left-0 bottom-1/2 w-3 h-1/2 border-l border-t border-gray-200 rounded-tl -translate-x-full" />
                        )}
                        {index === childGoals.length - 1 && childGoals.length > 1 && (
                          <div className="absolute left-0 top-1/2 w-3 h-1/2 border-l border-b border-gray-200 rounded-bl -translate-x-full" />
                        )}
                        {index > 0 && index < childGoals.length - 1 && (
                          <div className="absolute left-0 top-0 w-3 h-full border-l border-gray-200 -translate-x-full" />
                        )}

                        <div
                          className={cn(
                            'p-4 rounded-xl bg-white border transition-all duration-200 cursor-pointer w-64',
                            isSelected
                              ? 'border-emerald-300 shadow-md ring-2 ring-emerald-100'
                              : 'border-gray-100 hover:border-emerald-200 hover:shadow-sm'
                          )}
                          onClick={() => handleGoalClick(personalGoal.id)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              个人目标
                            </span>
                            <StatusBadge status={personalGoal.status} size="sm" />
                          </div>
                          <h5 className="font-medium text-gray-900 mb-2 text-sm leading-snug">
                            {personalGoal.title}
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
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DetailSidebar = () => {
    if (!selectedGoal) return null;

    const progress = calculateGoalProgress(selectedGoal.id);

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
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-gray-400" />
              关键结果 ({selectedGoalKeyResults.length})
            </h4>
            <div className="space-y-2">
              {selectedGoalKeyResults.map((kr: KeyResult) => {
                const krProgress = Math.min(
                  100,
                  Math.round((kr.currentValue / kr.targetValue) * 100)
                );
                const krOwner = getUserById(kr.ownerId);

                return (
                  <div
                    key={kr.id}
                    className="bg-white border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors"
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

      <DetailSidebar />
    </Layout>
  );
};

export { Goals };
export default Goals;
