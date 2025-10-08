import React, { useState } from 'react';
interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
}
export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  showValue = true
}) => {
  const percentage = (value - min) / (max - min) * 100;
  return <div className="w-full">
      {(label || showValue) && <div className="flex justify-between mb-2">
          {label && <span className="text-bodySmall text-ink-100">{label}</span>}
          {showValue && <span className="text-mono text-ink-60 bg-brand-primary/10 px-2 py-0.5 rounded-full">
              {value}
            </span>}
        </div>}
      <div className="relative w-full h-8 flex items-center">
        <div className="w-full h-2 bg-ink-60/10 rounded-full">
          <div className="h-2 bg-brand-primary rounded-full" style={{
          width: `${percentage}%`
        }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="absolute w-full h-8 opacity-0 cursor-pointer" />
        <div className="absolute w-6 h-6 bg-white border-2 border-brand-primary rounded-full shadow-md" style={{
        left: `calc(${percentage}% - 12px)`
      }} />
      </div>
    </div>;
};