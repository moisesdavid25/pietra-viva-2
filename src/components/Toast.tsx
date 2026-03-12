import React, { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onDismiss: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onDismiss }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animate in
        const showTimer = setTimeout(() => setVisible(true), 10);
        // Auto-dismiss
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 350);
        }, duration);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [duration, onDismiss]);

    const styles = {
        success: {
            bg: 'bg-[#008080]',
            border: 'border-teal-600',
            icon: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
        },
        error: {
            bg: 'bg-red-600',
            border: 'border-red-700',
            icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
        },
        info: {
            bg: 'bg-gray-800',
            border: 'border-gray-700',
            icon: <Info className="w-5 h-5 flex-shrink-0" />,
        },
    };

    const s = styles[type];

    return (
        <div
            className={`
        fixed bottom-24 left-1/2 z-[300]
        flex items-center gap-3
        px-5 py-3.5 rounded-2xl shadow-xl
        text-white font-semibold text-sm
        border ${s.bg} ${s.border}
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-[-50%] translate-y-0' : 'opacity-0 translate-x-[-50%] translate-y-4'}
      `}
            style={{ minWidth: '240px', maxWidth: '340px' }}
        >
            {s.icon}
            <span className="flex-1">{message}</span>
            <button
                onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Hook for easy Toast usage
export function useToast() {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);
    const counterRef = React.useRef(0);

    const showToast = (message: string, type: ToastType = 'success') => {
        counterRef.current += 1;
        const id = counterRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const ToastContainer = () => (
        <>
            {toasts.map(t => (
                <Toast
                    key={t.id}
                    message={t.message}
                    type={t.type}
                    onDismiss={() => dismissToast(t.id)}
                />
            ))}
        </>
    );

    return { showToast, ToastContainer };
}

