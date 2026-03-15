import React from 'react';
import { Icon } from './Icon';

interface DashboardWidgetProps {
  title: string;
  icon?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  color?: string; // Header accent color
  transparent?: boolean;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  title, 
  icon, 
  action, 
  children, 
  className = "",
  color = "text-brand-600",
  transparent = false
}) => {
  if (transparent) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-between mb-2 px-1">
           <div className="flex items-center gap-2">
            {icon && <Icon name={icon} className={color} size={16} />}
            <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">{title}</h3>
          </div>
          {action}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-sm p-3">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-full ${className}`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-white/5">
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className={color} size={18} />}
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">{title}</h3>
        </div>
        {action && (
          <div className="text-sm">
            {action}
          </div>
        )}
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
};