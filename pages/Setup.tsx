
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/mockDb';
import { useNavigate } from 'react-router-dom';
import { Building, Calendar, ArrowRight, CheckCircle, Database } from 'lucide-react';

const Setup = () => {
  const { user, updateUserCompany } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [fiscalYearStart, setFiscalYearStart] = useState(`${new Date().getFullYear()}-07-01`);
  const [isProcessing, setIsProcessing] = useState(false);

  // If accessed by mistake
  if (user?.companyId) {
      navigate('/');
      return null;
  }

  const handleCreateDatabase = async () => {
      if(!companyName.trim()) return;
      setIsProcessing(true);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
          if (!user?.id) throw new Error("User ID not found");
          const startDate = new Date(fiscalYearStart);
          const dbName = db.createCompanyDatabase(user.id, companyName, startDate);
          
          // Save Company Profile in the new DB context
          db.saveCompanyProfile({
              name: companyName,
              address: address,
              email: user?.email || '',
              fiscalYearStart: fiscalYearStart,
              phone: '', ntn: '', strn: '', cnic: ''
          });

          // Link DB to User
          updateUserCompany(dbName, companyName);
          
          navigate('/');
      } catch (e: any) {
          alert("Error creating database: " + e.message);
          setIsProcessing(false);
      }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden text-white font-sans">
       <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px]"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[100px]"></div>

       <div className="w-full max-w-lg p-8 relative z-10">
           
           <div className="text-center mb-10">
               <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent mb-6 shadow-glow animate-in zoom-in duration-500">
                   <Database className="text-white" size={32} />
               </div>
               <h1 className="text-3xl font-bold tracking-tight mb-2">Setup Organization</h1>
               <p className="text-gray-400">Welcome, {user?.name}. Let's initialize your ERP environment.</p>
           </div>

           <div className="bg-[#151A25]/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/5">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                        <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-600"
                                placeholder="e.g. Nexus Textiles Ltd."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fiscal Year Start</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="date" 
                                value={fiscalYearStart}
                                onChange={(e) => setFiscalYearStart(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Address (Optional)</label>
                        <textarea 
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-600 resize-none"
                            placeholder="Head Office Address"
                        />
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle className="text-primary mt-0.5 shrink-0" size={18} />
                        <div className="text-xs text-gray-300">
                            <p className="font-bold text-white mb-1">What happens next?</p>
                            <ul className="list-disc pl-4 space-y-1 opacity-80">
                                <li>A dedicated local database will be created.</li>
                                <li>Standard Chart of Accounts will be seeded.</li>
                                <li>All ledgers will be initialized as empty.</li>
                            </ul>
                        </div>
                    </div>

                    <button 
                        onClick={handleCreateDatabase}
                        disabled={isProcessing || !companyName}
                        className="w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'Initializing Database...' : <>Launch ERP <ArrowRight size={18}/></>}
                    </button>
                </div>
           </div>
       </div>
    </div>
  );
};

export default Setup;