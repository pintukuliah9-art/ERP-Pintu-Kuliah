import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface ContextMenuProps {
  x: number;
  y: number;
  isLocked: boolean;
  onClose: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onMove: () => void;
  onMirror: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onToggleDisable: () => void;
  isDisabled: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, y, isLocked, isDisabled, onClose, onOpen, onEdit, onMove, onMirror, onArchive, onDelete, onToggleLock, onToggleDisable
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', (e) => handleClickOutside(e as unknown as MouseEvent));
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', (e) => handleClickOutside(e as unknown as MouseEvent));
    };
  }, [onClose]);

  // Adjust position if it goes off screen (basic)
  const style = {
    top: y,
    left: x,
  };

  // If x is too close to right edge, shift left
  if (x > window.innerWidth - 200) {
    style.left = x - 180;
  }
  // If y is too close to bottom, shift up
  if (y > window.innerHeight - 350) {
    style.top = y - 320;
  }

  const MenuItem: React.FC<{ 
    icon: string; 
    label: string; 
    onClick: () => void; 
    color?: string; 
    subtext?: string;
    disabled?: boolean;
  }> = ({ icon, label, onClick, color, subtext, disabled }) => (
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        if (!disabled) onClick(); 
      }}
      disabled={disabled}
      className={`
        w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors group
        ${disabled 
            ? 'opacity-40 cursor-not-allowed grayscale' 
            : `hover:bg-gray-50 dark:hover:bg-white/10 ${color || 'text-gray-700 dark:text-gray-200'}`
        }
      `}
    >
      <Icon name={icon} size={16} />
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
        {subtext && <div className="text-[10px] text-gray-400 leading-none mt-0.5">{subtext}</div>}
      </div>
      {disabled && <Icon name="Lock" size={12} className="text-gray-400" />}
    </button>
  );

  return (
    <div 
      ref={menuRef}
      style={style}
      className="fixed z-[9999] w-56 bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 overflow-hidden animate-[scaleIn_0.1s_ease-out]"
    >
      <MenuItem icon="ExternalLink" label="Open Tool" onClick={onOpen} />
      
      <MenuItem 
        icon={isLocked ? "Unlock" : "Lock"} 
        label={isLocked ? "Unlock Tool" : "Lock Tool"} 
        subtext={isLocked ? "Allow editing" : "Prevent changes"}
        onClick={onToggleLock} 
        color={isLocked ? "text-amber-600" : "text-gray-500"}
      />

      <MenuItem 
        icon={isDisabled ? "Eye" : "EyeOff"} 
        label={isDisabled ? "Enable Link" : "Disable Link"} 
        subtext={isDisabled ? "Make it clickable" : "Temporarily hide/deactivate"}
        onClick={onToggleDisable} 
        color={isDisabled ? "text-emerald-600" : "text-orange-500"}
      />

      <div className="h-[1px] bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
      
      <MenuItem icon="Edit" label="Edit" onClick={onEdit} disabled={isLocked} />
      <MenuItem icon="Move" label="Move / Drag" subtext="Change location" onClick={onMove} disabled={isLocked} />
      <MenuItem icon="Copy" label="Mirror" subtext="Copy to another div" onClick={onMirror} disabled={isLocked} />
      
      <div className="h-[1px] bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
      
      <MenuItem icon="Archive" label="Archive" onClick={onArchive} disabled={isLocked} />
      <MenuItem icon="Trash2" label="Move to Trash" onClick={onDelete} color="text-red-500" disabled={isLocked} />
    </div>
  );
};