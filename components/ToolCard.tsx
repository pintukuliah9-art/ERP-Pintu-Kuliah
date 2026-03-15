import React, { useRef } from 'react';
import { Tool } from '../types';
import { Icon } from './Icon';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent | React.TouchEvent, tool: Tool) => void;
  onSelect?: () => void;
  variant?: 'default' | 'compact' | 'list' | 'tiny';
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({ 
  tool, onClick, onContextMenu, onSelect, variant = 'default', isSelectionMode, isSelected 
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextClick = useRef(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, tool);
    }
  };

  // Mobile Long Press Logic (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode) return; // Disable long press context menu in selection mode
    timerRef.current = setTimeout(() => {
      if (onContextMenu) onContextMenu(e, tool);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Desktop Hold Logic (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only Left Click
    ignoreNextClick.current = false;

    holdTimerRef.current = setTimeout(() => {
      if (onSelect) {
        onSelect();
        ignoreNextClick.current = true; // Prevent the subsequent click from triggering 'Open'
      }
    }, 500); // 500ms hold to select
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // 1. If we just finished a long-hold, ignore this click event
    if (ignoreNextClick.current) {
      e.stopPropagation();
      ignoreNextClick.current = false;
      return;
    }

    // 2. Shift + Click OR Selection Mode Active -> Trigger Select
    if ((e.shiftKey || isSelectionMode) && onSelect) {
      e.stopPropagation();
      onSelect();
      return;
    }

    // 3. Normal Click -> Open Tool
    onClick();
  };

  const commonProps = {
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp // Cancel hold if mouse leaves
  };
  
  // Selection Overlay
  const SelectionOverlay = () => (
    <div className={`absolute top-2 right-2 z-20 pointer-events-none transition-all duration-200 ${isSelectionMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
            {isSelected && <Icon name="Check" size={12} className="text-white" />}
        </div>
    </div>
  );

  const selectionStyles = isSelected 
    ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-900/20 transform scale-95' 
    : '';

  const disabledStyles = tool.isDisabled 
    ? 'opacity-40 grayscale-[0.8] cursor-not-allowed' 
    : '';

  if (variant === 'tiny') {
    return (
      <button 
        {...commonProps}
        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all group w-full h-full min-h-[80px] relative select-none ${selectionStyles} ${disabledStyles}`}
        title={tool.name}
      >
        <SelectionOverlay />
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm
          ${tool.color || 'bg-gray-500'} 
          transform group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-200 shadow-brand-500/20
        `}>
          <Icon name={tool.icon || 'Link'} size={18} />
        </div>
        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight w-full line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-gray-200">
          {tool.name}
        </span>
        {tool.isDisabled && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter mt-0.5">Disabled</span>}
      </button>
    );
  }

  if (variant === 'list') {
    return (
      <button 
        {...commonProps}
        className={`w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group select-none relative ${selectionStyles} ${disabledStyles}`}
      >
        <div className={`absolute left-2 z-20 ${isSelectionMode ? 'opacity-100' : 'opacity-0'}`}>
             <div className={`w-4 h-4 rounded border flex items-center justify-center bg-white ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-400'}`}>
                {isSelected && <Icon name="Check" size={10} className="text-white" />}
            </div>
        </div>
        <div className={`p-2 rounded-md ${tool.color || 'bg-gray-500'} text-white shadow-sm shrink-0 transition-opacity ${isSelectionMode ? 'opacity-0' : 'opacity-100'}`}>
          <Icon name={tool.icon || 'Link'} size={16} />
        </div>
        <div className={`flex-1 min-w-0 transition-transform ${isSelectionMode ? 'translate-x-6' : ''}`}>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-brand-600 transition-colors">
            {tool.name}
          </h4>
          {tool.isDisabled && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Disabled</span>}
        </div>
      </button>
    );
  }

  return (
    <div 
      {...commonProps}
      className={`
        group relative cursor-pointer select-none
        flex flex-col items-center justify-center 
        p-3 rounded-xl 
        border border-transparent hover:border-brand-200 dark:hover:border-brand-800
        hover:bg-brand-50 dark:hover:bg-brand-900/20
        transition-all duration-200
        ${selectionStyles}
        ${disabledStyles}
      `}
    >
      <SelectionOverlay />
      <div className={`
        w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md mb-2
        transform group-hover:scale-110 transition-transform duration-200
        ${tool.color || 'bg-gray-500'}
      `}>
        <Icon name={tool.icon || 'Link'} size={24} />
      </div>
      <h3 className="text-xs font-semibold text-center text-gray-700 dark:text-gray-300 leading-tight line-clamp-2 px-1">
        {tool.name}
      </h3>
      {tool.isDisabled && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter mt-1">Disabled</span>}
    </div>
  );
};