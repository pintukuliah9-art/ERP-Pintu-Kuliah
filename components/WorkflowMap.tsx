import React from 'react';
import { WorkflowStep, Tool } from '../types';
import { Icon } from './Icon';

interface WorkflowMapProps {
  steps: WorkflowStep[];
  onStepClick: (step: WorkflowStep) => void;
}

export const WorkflowMap: React.FC<WorkflowMapProps> = ({ steps, onStepClick }) => {
  if (steps.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto py-8 px-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
      <div className="flex items-center min-w-max space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Node */}
            <div 
              onClick={() => onStepClick(step)}
              className="relative flex flex-col items-center group cursor-pointer"
            >
              <div className="
                w-16 h-16 rounded-full flex items-center justify-center
                bg-white dark:bg-dark-card border-2 border-brand-500
                text-brand-600 dark:text-brand-400 font-bold text-xl
                shadow-md group-hover:bg-brand-500 group-hover:text-white transition-colors
                z-10
              ">
                {index + 1}
              </div>
              <div className="absolute top-20 w-32 text-center">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{step.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{step.description}</p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 w-16 h-[2px] bg-gray-300 dark:bg-gray-700 relative">
                <div className="absolute -right-1 -top-1.5 text-gray-300 dark:text-gray-700">
                  <Icon name="ChevronRight" size={16} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-20 text-center text-xs text-gray-400 italic">
        Click a step to see relevant tools
      </div>
    </div>
  );
};