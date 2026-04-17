import React from 'react';
import { UserContext } from '../types';
import { MapPin, Briefcase, UserCircle, Globe, Scale, X } from 'lucide-react';

interface SidebarProps {
  context: UserContext;
  setContext: (context: UserContext) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ context, setContext, onClose }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContext({ ...context, [name]: value });
  };

  return (
    <div className="w-full sm:w-80 h-full border-r border-slate-200 bg-white p-6 overflow-y-auto flex flex-col gap-8 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-legal-primary rounded-lg">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-legal-secondary">JusticeLink</h1>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <p className="text-sm text-slate-500 mb-2">
        AI Legal Assistant for migrant workers in India.
      </p>

      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin className="w-4 h-4" /> State
          </label>
          <select
            name="state"
            value={context.state}
            onChange={handleChange}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-legal-primary focus:border-transparent transition-all"
          >
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Bihar">Bihar</option>
            <option value="Delhi">Delhi</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="West Bengal">West Bengal</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Briefcase className="w-4 h-4" /> Industry
          </label>
          <select
            name="industry"
            value={context.industry}
            onChange={handleChange}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-legal-primary focus:border-transparent transition-all"
          >
            <option value="Construction">Construction</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Textile / Garment">Textile / Garment</option>
            <option value="Domestic Work">Domestic Work</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Brick Kiln">Brick Kiln</option>
            <option value="Logistics / Delivery">Logistics / Delivery</option>
            <option value="Security Services">Security Services</option>
            <option value="Hotel / Hospitality">Hotel / Hospitality</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserCircle className="w-4 h-4" /> Employment Type
          </label>
          <select
            name="employment_type"
            value={context.employment_type}
            onChange={handleChange}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-legal-primary focus:border-transparent transition-all"
          >
            <option value="contract">Contract</option>
            <option value="daily_wage">Daily Wage</option>
            <option value="permanent">Permanent</option>
            <option value="informal">Informal</option>
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="flex items-center justify-between text-sm font-bold text-legal-secondary uppercase tracking-wider">
            <span>AI Provider</span>
             <span className={`text-[10px] px-2 py-0.5 rounded-full ${context.provider === 'ollama' || context.provider === 'ollama-1b' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
               {context.provider === 'ollama' ? 'Local (3B)' : context.provider === 'ollama-1b' ? 'Local (1B)' : 'Cloud'}
             </span>
          </label>
           <select
             name="provider"
             value={context.provider}
             onChange={handleChange}
             className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-legal-primary focus:border-transparent transition-all"
           >
             <option value="gemini">Google Gemini (Default)</option>
             <option value="ollama">Local Ollama (Llama 3.2:3b)</option>
             <option value="ollama-1b">Local Ollama (Llama 3.2:1b) - Fastest</option>
           </select>
          {context.provider === 'ollama' && (
            <p className="text-[10px] text-slate-400 italic">
              * Requires Ollama running locally on port 11434
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 text-[10px] text-slate-400 text-center border-t border-slate-100">
        &copy; 2026 JusticeLink Legal AI
      </div>
    </div>
  );
};
