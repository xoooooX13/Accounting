
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/mockDb';
import { AlertTriangle, ArrowRight, Database, RefreshCcw, Lock } from 'lucide-react';

const FiscalRollover = () => {
  const { user, updateUserDb } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Processing, 3: Done

  const company = db.getCompanyProfile();
  const currentYear = new Date(company.fiscalYearStart || new Date()).getFullYear();
  const nextYear = currentYear + 1;
  
  // Calculate new DB name preview
  const prefix = user?.dbName?.split('-')[0] || 'NX';
  const newDbName = `${prefix}-${String(nextYear).slice(2)}${String(nextYear + 1).slice(2)}`;

  const handleStartRollover = async () => {
      setIsProcessing(true);
      setStep(2);
      
      // Simulate heavy processing
      await new Promise(r => setTimeout(r, 3000));
      
      try {
          const resultDb = await db.rolloverFiscalYear(newDbName);
          updateUserDb(resultDb);
          setStep(3);
      } catch (e: any) {
          alert("Rollover Failed: " + e.message);
          setIsProcessing(false);
          setStep(1);
      }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden text-white font-sans p-6">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#0B0E14] to-[#0B0E14]"></div>
       
       <div className="w-full max-w-2xl relative z-10">
           <div className="bg-[#151A25]/90 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl p-10">
               
               {/* Header */}
               <div className="text-center mb-10">
                   <div className="inline-flex p-4 rounded-full bg-warning/10 text-warning mb-6 ring-1 ring-warning/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                       <Lock size={40} />
                   </div>
                   <h1 className="text-3xl font-bold tracking-tight mb-3">Fiscal Year End Procedure</h1>
                   <p className="text-gray-400 max-w-md mx-auto">
                       The current fiscal year <span className="text-white font-mono font-bold">({currentYear}-{nextYear})</span> has expired. 
                       System access is restricted until the rollover is complete.
                   </p>
               </div>

               {/* Content based on Step */}
               {step === 1 && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
                           <div className="flex justify-between items-center border-b border-white/5 pb-4">
                               <span className="text-gray-400 text-sm">Action</span>
                               <span className="font-bold text-white">Annual Book Closing</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-white/5 pb-4">
                               <span className="text-gray-400 text-sm">Current Database</span>
                               <span className="font-mono text-warning">{user?.dbName}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-400 text-sm">New Database</span>
                               <span className="font-mono text-success">{newDbName}</span>
                           </div>
                       </div>

                       <div className="space-y-3">
                           <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">What will happen?</h3>
                           <ul className="space-y-2 text-sm text-gray-400">
                               <li className="flex items-start gap-3">
                                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                   <span>Closing balances of Assets, Liabilities, and Equity will carry forward.</span>
                               </li>
                               <li className="flex items-start gap-3">
                                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                   <span>Net Income/Loss will be transferred to Retained Earnings.</span>
                               </li>
                               <li className="flex items-start gap-3">
                                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                   <span>Inventory closing stock becomes opening stock.</span>
                               </li>
                               <li className="flex items-start gap-3">
                                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                   <span>All temporary accounts (Revenue/Expense) will reset to zero.</span>
                               </li>
                           </ul>
                       </div>

                       <div className="flex items-center gap-4 pt-4">
                           <button onClick={handleStartRollover} className="flex-1 bg-primary hover:bg-primary-light text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                               Start Processing <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                       </div>
                   </div>
               )}

               {step === 2 && (
                   <div className="py-12 text-center animate-in fade-in duration-500">
                       <div className="relative w-20 h-20 mx-auto mb-8">
                           <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                           <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                           <RefreshCcw className="absolute inset-0 m-auto text-primary animate-pulse" size={30} />
                       </div>
                       <h2 className="text-2xl font-bold text-white mb-2">Processing Rollover...</h2>
                       <p className="text-gray-400">Migrating ledgers and balances. Please do not close this window.</p>
                   </div>
               )}

               {step === 3 && (
                   <div className="py-12 text-center animate-in zoom-in duration-500">
                       <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-success/10">
                           <Database size={40} />
                       </div>
                       <h2 className="text-2xl font-bold text-white mb-4">Migration Complete!</h2>
                       <p className="text-gray-400 mb-8">You are now working in the new fiscal year database.</p>
                       <button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-colors">
                           Go to Dashboard
                       </button>
                   </div>
               )}

           </div>
       </div>
    </div>
  );
};

export default FiscalRollover;
