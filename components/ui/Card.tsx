import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
  return (
    <div className={clsx("rounded-2xl bg-surface p-6 shadow-soft border border-border transition-colors duration-300", className)}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-text-main tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};