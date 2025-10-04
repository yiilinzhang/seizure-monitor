import React from 'react';
interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange
}) => {
  return <div className="flex items-center">
      {label && <span className="text-bodySmall text-ink-100 mr-2">{label}</span>}
      <button type="button" role="switch" aria-checked={checked} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${checked ? 'bg-brand-primary' : 'bg-ink-60/30'}`} onClick={() => onChange(!checked)}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>;
};