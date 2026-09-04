import React, { useState } from 'react';
import { Modal, Button } from '@sms/ui-kit';
import { Clock, Shield, Building, User, Copy, Check, Terminal } from 'lucide-react';

const AuditPayloadModal = ({ isOpen, onClose, log }) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  let parsedMetadata = {};
  try {
    if (typeof log.metadata === 'string') {
      parsedMetadata = JSON.parse(log.metadata);
    } else if (typeof log.metadata === 'object' && log.metadata !== null) {
      parsedMetadata = log.metadata;
    }
  } catch (e) {
    parsedMetadata = { raw: log.metadata };
  }

  const jsonString = JSON.stringify(parsedMetadata, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Audit Event Payload"
      size="md"
    >
      <div className="space-y-4 text-left py-1">
        
        {/* Header Summary */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Action Event</span>
            <span className="font-bold text-slate-900 font-mono">{log.action}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Recorded Timestamp</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Administrator</span>
            <span className="font-mono text-indigo-600 font-semibold truncate block">
              {log.adminId}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Target Tenant</span>
            <span className="font-mono text-slate-700 truncate block">
              {log.tenantId || 'Global / Platform Scope'}
            </span>
          </div>
        </div>

        {/* JSON Payload Viewer */}
        <div>
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Terminal size={14} /> Payload Parameters
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
            <code>{jsonString}</code>
          </pre>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuditPayloadModal;
