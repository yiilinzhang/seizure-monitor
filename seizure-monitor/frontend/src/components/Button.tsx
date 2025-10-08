import React from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'destructive';
interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  fullWidth = false,
  disabled = false
}) => {
  const baseStyles = 'px-5 py-3 rounded-2xl font-semibold text-bodySmall transition-colors shadow-sm';
  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
    secondary: 'bg-white border border-ink-60/10 text-ink-100 hover:bg-gray-50',
    destructive: 'bg-semantic-alert text-white hover:bg-semantic-alert/90'
  };
  return <button className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>;
};