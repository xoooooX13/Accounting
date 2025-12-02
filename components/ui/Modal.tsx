import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full ${maxWidth} bg-surface rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-highlight/30">
          <h3 className="text-xl font-bold text-text-main tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main hover:bg-surface-highlight rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};