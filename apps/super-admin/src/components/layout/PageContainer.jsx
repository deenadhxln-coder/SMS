import React from 'react';

const PageContainer = ({
  title,
  description = '',
  action = null, // React element (e.g. Button)
  children
}) => {
  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5 select-none">
            {title}
          </h1>
          {description && (
            <p className="text-xs font-semibold text-slate-400">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 flex items-center gap-3">
            {action}
          </div>
        )}
      </div>

      {/* Main Page Content */}
      <div className="w-full">
        {children}
      </div>

    </div>
  );
};

export default PageContainer;
