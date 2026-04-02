import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-base font-black text-gray-700 dark:text-gray-300 mb-1">{heading}</p>
      {description && (
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 max-w-xs mb-5">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={
            action.variant === 'secondary'
              ? 'px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
              : 'px-5 py-2.5 bg-[#008081] text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors'
          }
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
