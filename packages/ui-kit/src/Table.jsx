import React from 'react';
import { ArrowUpDown, Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const Table = ({
  columns,
  data = [],
  loading = false,
  pagination = null, // { totalPages, currentPage, onPageChange }
  sorting = null,    // { sortBy, sortOrder, onSort }
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange = null,
  filters = null,
  emptyMessage = 'No records found',
  emptyDescription = null,
  emptyIcon = null,
  emptyAction = null,
  dark = false
}) => {
  const containerClass = dark 
    ? "w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-none overflow-hidden flex flex-col animate-fade-in"
    : "w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-fade-in";
    
  const utilityClass = dark
    ? "p-5 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row gap-4 justify-between items-center"
    : "p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center";
    
  const inputClass = dark
    ? "w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-600 transition-all text-slate-200 placeholder-slate-500"
    : "w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400";

  const theadClass = dark
    ? "bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800"
    : "bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100";

  const tbodyClass = dark
    ? "divide-y divide-slate-800/80 font-medium text-slate-300"
    : "divide-y divide-slate-100 font-medium text-slate-700";

  const trClass = dark
    ? "hover:bg-slate-800/30 transition-colors"
    : "hover:bg-slate-50/50 transition-colors";

  const footerClass = dark
    ? "px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center"
    : "px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center";

  const paginationButtonClass = dark
    ? "p-1.5 border border-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-400"
    : "p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600";

  return (
    <div className={containerClass}>
      
      {/* Header Utilities (Search & Filters) */}
      {(onSearchChange || filters) && (
        <div className={utilityClass}>
          {onSearchChange && (
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={inputClass}
              />
            </div>
          )}
          {filters && <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto justify-end">{filters}</div>}
        </div>
      )}

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className={theadClass}>
            <tr>
              {columns.map((col, idx) => {
                const isSortable = Boolean(col.sortable && sorting);
                const isCurrentSort = Boolean(sorting && sorting.sortBy === col.accessor);
                const ariaSortValue = isCurrentSort 
                  ? (sorting.sortOrder === 'asc' ? 'ascending' : 'descending') 
                  : (isSortable ? 'none' : undefined);

                return (
                  <th
                    key={idx}
                    scope="col"
                    aria-sort={ariaSortValue}
                    role={isSortable ? 'button' : undefined}
                    tabIndex={isSortable ? 0 : undefined}
                    aria-label={isSortable ? `Sort by ${col.header}` : undefined}
                    className={`px-6 py-4 font-semibold ${isSortable ? 'cursor-pointer select-none hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30' : ''}`}
                    onClick={() => isSortable && sorting.onSort(col.accessor)}
                    onKeyDown={(e) => {
                      if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        sorting.onSort(col.accessor);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <ArrowUpDown size={14} className={isCurrentSort ? "text-indigo-600" : "text-slate-400"} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className={`w-8 h-8 border-4 ${dark ? 'border-purple-500' : 'border-indigo-500'} border-t-transparent rounded-full animate-spin`}></div>
                    <span className="text-slate-400 text-sm">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center animate-fade-in">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                      dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {emptyIcon || <Inbox size={24} strokeWidth={1.75} />}
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${
                      dark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {emptyMessage}
                    </p>
                    {emptyDescription && (
                      <p className="text-xs text-slate-400 mb-3 max-w-xs leading-relaxed">
                        {emptyDescription}
                      </p>
                    )}
                    {emptyAction && (
                      <div className="mt-2">
                        {emptyAction}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className={trClass}>
                  {columns.map((col, colIdx) => {
                    let val = '';
                    if (typeof col.accessor === 'function') {
                      val = col.accessor(row);
                    } else {
                      val = row[col.accessor];
                    }
                    
                    return (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                        {col.render ? col.render(val, row) : val}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className={footerClass}>
          <span className="text-xs text-slate-500">
            Page <strong className={dark ? "text-slate-200" : "text-slate-700"}>{pagination.currentPage}</strong> of <strong className={dark ? "text-slate-200" : "text-slate-700"}>{pagination.totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={paginationButtonClass}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={paginationButtonClass}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
