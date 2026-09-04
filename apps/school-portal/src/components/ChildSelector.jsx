import React from 'react';
import { Badge } from '@sms/ui-kit';

/**
 * Reusable ChildSelector component for parents with multiple enrolled children.
 * Renders cleanly with student initial avatar, name, admission number, and class.
 * Returns null if the parent has 0 or only 1 child to avoid unnecessary UI clutter.
 */
const ChildSelector = ({
  children = [],
  selectedChild = null,
  onSelectChild = () => {},
  className = ''
}) => {
  // If 0 or only 1 child, no selector is needed
  if (!children || children.length <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 mb-6 ${className}`} role="tablist" aria-label="Select Enrolled Child">
      <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider mr-1 select-none">
        Student:
      </span>
      {children.map((child) => {
        const isSelected = selectedChild?.id === child.id;
        const childName = child.user?.name || 'Child';
        const admissionNo = child.admissionNo || 'ENROLLED';
        const classNameStr = child.class?.name || '';
        const sectionNameStr = child.section?.name || '';

        return (
          <button
            key={child.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectChild(child)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
            }`}
          >
            {/* Avatar Circle */}
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-2xs flex-shrink-0 ${
                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {childName.charAt(0)}
            </div>

            {/* Child Name */}
            <span className="truncate max-w-[130px]">{childName}</span>

            {/* Admission No Badge */}
            <span
              className={`text-3xs font-mono px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-indigo-700/60 text-indigo-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {admissionNo}
            </span>

            {/* Class Pill if available */}
            {classNameStr && (
              <span
                className={`text-3xs hidden sm:inline ${
                  isSelected ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                ({classNameStr}{sectionNameStr ? `-${sectionNameStr}` : ''})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ChildSelector;
