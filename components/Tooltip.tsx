import React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const isTop = position === 'top';

  const popoverClasses = [
    'absolute left-1/2 -translate-x-1/2 w-72 md:w-80',
    'opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10',
    isTop ? 'bottom-full mb-2' : 'top-full mt-2'
  ].join(' ');
  
  const arrowClasses = [
    'absolute left-1/2 -translate-x-1/2 h-2 w-full text-slate-800',
    isTop ? 'top-full' : 'bottom-full rotate-180'
  ].join(' ');

  return (
    <div className="relative flex items-center group">
      {children}
      <div className={popoverClasses}>
        <div className="bg-slate-800 text-white text-sm rounded-lg shadow-lg p-3">
          {content}
        </div>
        <svg className={arrowClasses} x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </div>
    </div>
  );
};