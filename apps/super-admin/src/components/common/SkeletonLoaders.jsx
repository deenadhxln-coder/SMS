import React from 'react';

export const KPISkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-slate-200 rounded"></div>
          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-7 w-16 bg-slate-200 rounded"></div>
        <div className="h-3 w-32 bg-slate-100 rounded"></div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div className="h-4 w-48 bg-slate-200 rounded"></div>
      <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
    </div>
    <div className="divide-y divide-slate-100 p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 pt-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3.5 bg-slate-200 rounded" style={{ width: `${60 + (j % 3) * 20}px` }}></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = ({ height = 'h-64' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse ${height} flex flex-col justify-between`}>
    <div className="space-y-2">
      <div className="h-4 w-36 bg-slate-200 rounded"></div>
      <div className="h-3 w-48 bg-slate-100 rounded"></div>
    </div>
    <div className="h-32 bg-slate-100 rounded-lg"></div>
  </div>
);
