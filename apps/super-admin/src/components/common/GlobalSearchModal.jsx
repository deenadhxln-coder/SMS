import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Building, ArrowRight, X, ExternalLink, Hash, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearchModal = ({ isOpen, onClose, tenants = [], onSelectTenant }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = query.trim() === '' 
    ? tenants.slice(0, 5) 
    : tenants.filter(t => {
        const q = query.toLowerCase();
        return (
          (t.schoolName || '').toLowerCase().includes(q) ||
          (t.slug || '').toLowerCase().includes(q) ||
          (t.contactEmail || '').toLowerCase().includes(q) ||
          (t.planType || '').toLowerCase().includes(q) ||
          (t.status || '').toLowerCase().includes(q)
        );
      }).slice(0, 8);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  const handleSelect = (tenant) => {
    onClose();
    if (onSelectTenant) {
      onSelectTenant(tenant);
    } else {
      navigate(`/tenants?school=${tenant.slug}`);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Tenant Search"
    >
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-left"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search school name, slug, email, plan (e.g. greenwood, premium)..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            aria-label="Search tenants"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              aria-label="Clear query"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              No matching institutions found for "<span className="font-semibold text-slate-600">{query}</span>"
            </div>
          ) : (
            filtered.map((tenant, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={tenant.id}
                  onClick={() => handleSelect(tenant)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left ${
                    isSelected ? 'bg-indigo-50/80 text-indigo-950' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tenant.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      <Building size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{tenant.schoolName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          tenant.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tenant.status}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {tenant.planType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate font-mono">
                        <span className="flex items-center gap-1 text-indigo-600">
                          <Hash size={11} />{tenant.slug}
                        </span>
                        {tenant.contactEmail && (
                          <span className="flex items-center gap-1 text-slate-400 truncate">
                            <Mail size={11} />{tenant.contactEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className={`flex-shrink-0 ml-2 transition-transform ${isSelected ? 'translate-x-0.5 text-indigo-600' : 'text-slate-300'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="font-mono bg-white px-1 border border-slate-200 rounded">↑</kbd> <kbd className="font-mono bg-white px-1 border border-slate-200 rounded">↓</kbd></span>
            <span>Select: <kbd className="font-mono bg-white px-1 border border-slate-200 rounded">↵</kbd></span>
          </div>
          <span>SMS Platform Search</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default GlobalSearchModal;
