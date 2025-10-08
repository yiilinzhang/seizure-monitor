import React from 'react';
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  className = ''
}) => {
  return <div className={`w-full ${className}`}>
      <h2 className="text-h2 font-semibold text-ink-100 mb-2">{title}</h2>
      <div className="bg-surface rounded-lg p-2 border border-ink-60/10">
        {children}
      </div>
    </div>;
};