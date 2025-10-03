import React from 'react';
import { ChevronRightIcon } from 'lucide-react';
interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  meta?: string;
  onClick?: () => void;
}
export const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  meta,
  onClick
}) => {
  return <div className={`flex items-center p-4 mb-2 border border-ink-60/5 rounded-xl ${onClick ? 'cursor-pointer hover:bg-surface/80' : ''} bg-surface shadow-sm`} onClick={onClick}>
      {icon && <div className="mr-3 p-2 bg-brand-primary/10 rounded-full">{icon}</div>}
      <div className="flex-1">
        <div className="text-bodySmall font-semibold text-ink-100">{title}</div>
        {meta && <div className="text-bodySmall text-ink-60">{meta}</div>}
      </div>
      {onClick && <ChevronRightIcon size={20} className="text-ink-60" />}
    </div>;
};