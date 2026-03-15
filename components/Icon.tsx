import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  // @ts-ignore - Dynamic access to icon library
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    return <LucideIcons.HelpCircle className={className} size={size} />;
  }

  return <LucideIcon className={className} size={size} />;
};