import React from 'react';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: 'text' | 'email' | 'number' | 'url' | 'tel' | 'password';
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  autoComplete?: string;
  maxLength?: number;
}

export default function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  prefix,
  suffix,
  autoComplete,
  maxLength,
}: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="flex items-center gap-1 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-red-500 leading-none">*</span>}
      </label>

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={[
            'w-full py-2.5 bg-gray-50 dark:bg-[#1A1A1A]',
            'border rounded-xl text-sm font-medium',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-[#008081]/40 focus:border-[#008081]',
            'transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600',
            prefix ? 'pl-9' : 'pl-3',
            suffix ? 'pr-10' : 'pr-3',
            hasError
              ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-700',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            inputClassName,
          ].join(' ')}
        />
        {suffix && (
          <span className="absolute right-3 flex items-center">
            {suffix}
          </span>
        )}
      </div>

      {hasError && (
        <p className="text-[11px] font-bold text-red-500 dark:text-red-400">{error}</p>
      )}
      {helperText && !hasError && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
