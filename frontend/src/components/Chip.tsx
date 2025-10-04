import React from 'react';
type ChipVariant = 'connected' | 'disconnected';
interface ChipProps {
  variant: ChipVariant;
  label?: string;
}
export const Chip: React.FC<ChipProps> = ({
  variant,
  label = variant === 'connected' ? 'Connected' : 'Disconnected'
}) => {
  const baseStyles = 'inline-flex items-center px-3 py-1.5 rounded-full text-bodySmall font-semibold';
  const variantStyles = {
    connected: 'bg-semantic-ok/10 text-semantic-ok',
    disconnected: 'bg-ink-60/10 text-ink-60'
  };
  return <div className={`${baseStyles} ${variantStyles[variant]}`}>
      <span className={`w-2 h-2 rounded-full mr-1.5 ${variant === 'connected' ? 'bg-semantic-ok' : 'bg-ink-60'}`}></span>
      {label}
    </div>;
};