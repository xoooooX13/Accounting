
import React from 'react';
import { Settings, Clock } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-[#0B0E14] to-[#0B0E14]"></div>
        
        <div className="max-w-md w-full text-center relative z-10 space-y-8">
            <div className="inline-flex items-center justify-center p-6 bg-white/5 rounded-full ring-1 ring-white/10 mb-4 animate-pulse">
                <Settings size={48} className="text-gray-400" />
            </div>
            
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-3">System Under Maintenance</h1>
                <p className="text-lg text-gray-400">Fiscal Year End Processing in Progress.</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-left flex items-start gap-4">
                <Clock className="text-yellow-500 shrink-0 mt-1" size={24} />
                <div>
                    <h3 className="font-bold text-yellow-500 mb-1">Access Restricted</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        The administrator is currently performing the annual fiscal year rollover. 
                        Access to the ERP is temporarily disabled to ensure data integrity. 
                        Please try again later.
                    </p>
                </div>
            </div>

            <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">
                Check Status (Refresh)
            </button>
        </div>
    </div>
  );
};

export default Maintenance;
