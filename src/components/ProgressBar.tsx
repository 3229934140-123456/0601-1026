import { cn, getProgressColor } from '../utils/helpers';

interface ProgressBarProps {
  percent: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = ({ percent, size = 'md', showLabel = false, className }: ProgressBarProps) => {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          heightClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getProgressColor(clampedPercent)
          )}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>进度</span>
          <span className="font-medium text-gray-700">{Math.round(clampedPercent)}%</span>
        </div>
      )}
    </div>
  );
};
