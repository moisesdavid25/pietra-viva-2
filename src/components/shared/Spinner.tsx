import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
const borders: Record<string, string> = {
  primary: 'border-gray-200 dark:border-gray-700 border-t-[#008081]',
  white:   'border-white/30 border-t-white',
  gray:    'border-gray-200 dark:border-gray-700 border-t-gray-400',
};

export default function Spinner({ size = 'md', variant = 'primary', className = '' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full border-2 animate-spin ${sizes[size]} ${borders[variant]} ${className}`}
      role="status"
      aria-label="Caricamento..."
    />
  );
}
