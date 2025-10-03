import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BarChart2Icon, AlertCircleIcon, SettingsIcon } from 'lucide-react';
export const Navigation: React.FC = () => {
  const navItems = [{
    path: '/live-monitor',
    label: 'Monitor',
    icon: <HomeIcon size={20} />
  }, {
    path: '/history',
    label: 'History',
    icon: <BarChart2Icon size={20} />
  }, {
    path: '/emergency',
    label: 'Emergency',
    icon: <AlertCircleIcon size={20} />
  }, {
    path: '/settings',
    label: 'Settings',
    icon: <SettingsIcon size={20} />
  }];
  return <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-ink-60/10 flex justify-around rounded-t-2xl shadow-lg">
      {navItems.map(item => <NavLink key={item.path} to={item.path} className={({
      isActive
    }) => `flex flex-col items-center py-3 px-4 ${isActive ? 'text-brand-primary' : 'text-ink-60'}`}>
          <div className={`p-2 rounded-full ${isActive => isActive ? 'bg-brand-primary/10' : ''}`}>
            {item.icon}
          </div>
          <span className="text-bodySmall mt-1">{item.label}</span>
        </NavLink>)}
    </nav>;
};