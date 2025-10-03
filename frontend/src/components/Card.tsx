import React from 'react';
type CardVariant = 'default' | 'warning';
interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const baseStyles = 'p-4 rounded-2xl shadow-sm';
  const variantStyles = {
    default: 'bg-surface',
    warning: 'bg-semantic-alert/10 border border-semantic-alert/20'
  };
  return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>;
};