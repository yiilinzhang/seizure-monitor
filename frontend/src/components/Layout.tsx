import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
interface LayoutProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  showBack = false,
  rightElement
}) => {
  const navigate = useNavigate();
  return <div className="flex flex-col min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-ink-60/5 rounded-b-2xl shadow-sm">
        <div className="flex items-center justify-between p-margin h-16">
          <div className="flex items-center">
            {showBack && <button onClick={() => navigate(-1)} className="mr-2 p-2 rounded-full hover:bg-gray-100">
                <ArrowLeftIcon size={20} className="text-ink-100" />
              </button>}
            <h1 className="text-title font-semibold text-ink-100">{title}</h1>
          </div>
          {rightElement && <div>{rightElement}</div>}
        </div>
      </header>
      <main className="flex-1 p-margin">{children}</main>
    </div>;
};