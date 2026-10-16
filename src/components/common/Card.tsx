import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 ${
        hoverable ? 'transition-all hover:border-slate-300 hover:shadow-sm cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
