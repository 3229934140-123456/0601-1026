import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  TrendingUp,
  Calendar,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useStore } from '../../store/useStore';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/goals', label: '目标树', icon: Target },
  { path: '/tasks', label: '任务', icon: CheckSquare },
  { path: '/progress', label: '进展', icon: TrendingUp },
  { path: '/meetings', label: '会议', icon: Calendar },
  { path: '/risks', label: '风险', icon: AlertTriangle },
  { path: '/stats', label: '统计', icon: BarChart3 },
];

export const Sidebar = () => {
  const { currentUser } = useStore();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">目标管理</h1>
            <p className="text-xs text-slate-400">OKR System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
            功能模块
          </p>
        </div>
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-semibold">
            {currentUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {currentUser.role === 'manager' ? '部门负责人' : '团队成员'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-3 flex items-center gap-2 px-2 text-xs text-slate-500">
          <Building2 className="w-3.5 h-3.5" />
          <span>{currentUser.department}</span>
        </div>
      </div>
    </aside>
  );
};
