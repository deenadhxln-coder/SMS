import React from 'react';

const PageContainer = ({
  title,
  description = '',
  action = null,
  children
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 flex items-center gap-2.5">
            {action}
          </div>
        )}
      </div>

      {/* Main Content Workspace */}
      <div className="w-full space-y-6">
        {children}
      </div>

    </div>
  );
};

export default PageContainer;
