import React from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
}
export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit
}) => {
  const increment = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };
  const decrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };
  return <div className="w-full">
      {label && <label className="block text-bodySmall text-ink-100 mb-1">
          {label}
        </label>}
      <div className="flex items-center">
        <button type="button" onClick={decrement} disabled={value <= min} className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-l-lg text-ink-60 disabled:opacity-50">
          <MinusIcon size={16} />
        </button>
        <div className="h-8 px-2 flex items-center justify-center bg-white border-y border-gray-200">
          <span className="text-mono">{value}</span>
          {unit && <span className="text-bodySmall text-ink-60 ml-1">{unit}</span>}
        </div>
        <button type="button" onClick={increment} disabled={value >= max} className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-r-lg text-ink-60 disabled:opacity-50">
          <PlusIcon size={16} />
        </button>
      </div>
    </div>;
};