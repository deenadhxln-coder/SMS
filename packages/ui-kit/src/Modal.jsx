import React, { useEffect, useRef, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg, xl
  maxWidth = null,
  footer = null,
  dark = false,
  className = ''
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();

  // Prevent background scrolling and manage focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Move focus into the modal once opened
      const focusTimer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = originalOverflow || 'unset';
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Keyboard navigation: Escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (typeof onClose === 'function') {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const selectedSize = maxWidth || sizes[size] || sizes.md;

  const modalBg = dark
    ? "bg-slate-900 border-slate-800 text-slate-100 shadow-2xl"
    : "bg-white border-slate-100 text-slate-800 shadow-xl";

  const headerBg = dark
    ? "border-slate-800 bg-slate-950/60"
    : "border-slate-100 bg-slate-50/30";

  const closeBtnClass = dark
    ? "p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
    : "p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const footerBg = dark
    ? "border-slate-800 bg-slate-950/60"
    : "border-slate-100 bg-slate-50/30";

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        style={{ maxHeight: 'min(88vh, calc(100dvh - 2.5rem))' }}
        className={`w-full rounded-2xl border flex flex-col overflow-hidden min-h-0 relative z-10 animate-fade-in focus:outline-none ${modalBg} ${selectedSize} ${className}`}
      >

        {/* Header */}
        <div className={`px-5 py-3.5 sm:px-6 sm:py-4 border-b flex justify-between items-center flex-shrink-0 ${headerBg}`}>
          <h3 id={titleId} className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          <button
            onClick={onClose}
            className={closeBtnClass}
            aria-label="Close dialog"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`px-5 py-3.5 sm:px-6 sm:py-4 border-t flex justify-end gap-3 flex-shrink-0 ${footerBg}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default Modal;
