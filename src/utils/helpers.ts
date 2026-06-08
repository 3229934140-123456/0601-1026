export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatShortDate(dateString);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    paused: 'bg-gray-100 text-gray-700',
    archived: 'bg-gray-100 text-gray-500',
    on_track: 'bg-emerald-100 text-emerald-700',
    at_risk: 'bg-amber-100 text-amber-700',
    behind: 'bg-rose-100 text-rose-700',
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-emerald-100 text-emerald-700',
    open: 'bg-rose-100 text-rose-700',
    mitigating: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-rose-100 text-rose-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

export const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    archived: '已归档',
    on_track: '正常',
    at_risk: '有风险',
    behind: '滞后',
    todo: '待办',
    in_progress: '进行中',
    done: '已完成',
    open: '待处理',
    mitigating: '缓解中',
    resolved: '已解决',
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急',
  };
  return textMap[status] || status;
};

export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-rose-100 text-rose-700',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-700';
};

export const getPriorityText = (priority: string): string => {
  const textMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return textMap[priority] || priority;
};

export const getProgressColor = (percent: number): string => {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-blue-500';
  if (percent >= 30) return 'bg-amber-500';
  return 'bg-rose-500';
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
