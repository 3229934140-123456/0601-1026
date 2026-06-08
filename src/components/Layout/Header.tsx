import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronDown, Plus, X, Target, CheckSquare, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/helpers';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface SearchResult {
  id: string;
  type: 'goal' | 'task' | 'user';
  title: string;
  subtitle: string;
  path: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { goals, tasks, users, getGoalById, getUserById, setSelectedGoalId, setSelectedKRId } = useStore();

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    goals.forEach((goal) => {
      if (
        goal.title.toLowerCase().includes(query) ||
        goal.description.toLowerCase().includes(query)
      ) {
        results.push({
          id: goal.id,
          type: 'goal',
          title: goal.title,
          subtitle: goal.type === 'department' ? '部门目标' : '个人目标',
          path: `/goals`,
        });
      }
    });

    tasks.forEach((task) => {
      if (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      ) {
        const kr = useStore.getState().keyResults.find((k) => k.id === task.keyResultId);
        const goal = kr ? getGoalById(kr.goalId) : null;
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: goal ? `关联目标：${goal.title}` : '未关联目标',
          path: `/tasks`,
        });
      }
    });

    users.forEach((user) => {
      if (user.name.toLowerCase().includes(query) || user.department.toLowerCase().includes(query)) {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: `${user.department} · ${user.role === 'manager' ? '部门负责人' : '团队成员'}`,
          path: `/goals`,
        });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, goals, tasks, users, getGoalById]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'goal') {
      setSelectedGoalId(result.id);
      setSelectedKRId(null);
    }
    navigate(result.path);
    setSearchQuery('');
    setShowResults(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4 text-indigo-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'user':
        return <User className="w-4 h-4 text-amber-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'goal':
        return '目标';
      case 'task':
        return '任务';
      case 'user':
        return '人员';
      default:
        return '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div ref={searchRef} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="搜索目标、任务、人员..."
            className="w-72 pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="p-2">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  按 Enter 查看全部结果
                </p>
              </div>
            </div>
          )}

          {showResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6 z-50">
              <div className="text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">未找到相关结果</p>
                <p className="text-xs text-gray-400 mt-1">试试其他关键词</p>
              </div>
            </div>
          )}
        </div>

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          新建
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
