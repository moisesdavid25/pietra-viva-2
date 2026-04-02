import React from 'react';
import clsx from 'clsx';

export default function Logo({ className = '', darkText = false, logoUrl }: { className?: string; darkText?: boolean; logoUrl?: string }) {
    return (
        <div className={clsx("flex items-center gap-2", className)}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-contain bg-white flex-shrink-0" />
            ) : (
                <div className="w-8 h-8 rounded bg-[#008081] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                        <path d="M7 2v20" />
                        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                    </svg>
                </div>
            )}
            <span className={clsx("text-xl font-bold tracking-tight font-sans leading-none", darkText ? "text-[#111827]" : "text-gray-900 dark:text-white")}>
                Leomenu
            </span>
        </div>
    );
}

export function LogoIcon({ className = 'w-10 h-10' }: { className?: string }) {
     return (
        <div className={clsx("rounded bg-[#008081] flex items-center justify-center flex-shrink-0 shadow-sm", className)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
        </div>
    );
}

