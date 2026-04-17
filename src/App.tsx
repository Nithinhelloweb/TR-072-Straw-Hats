import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LegalDashboard } from './components/LegalDashboard';
import { UserContext, Message, LegalResponse } from './types';
import { processLegalComplaint as processGemini } from './services/gemini.ts';
import { processLegalComplaint as processOllama3b } from './services/ollama.ts';
import { processLegalComplaint as processOllama1b } from './services/ollama-1b.ts';
import { Menu, Info, X, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [context, setContext] = useState<UserContext>({
    state: 'Karnataka',
    industry: 'Construction',
    employment_type: 'contract',
    user_language: 'Hindi',
    provider: 'gemini',
    original_input: '',
    translated_input: '',
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLegalResponse, setCurrentLegalResponse] = useState<LegalResponse | null>(null);
  
  // Responsive States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    // On mobile, close dashboard when sending new message to see chat
    if (window.innerWidth < 1024) {
      setIsDashboardOpen(false);
    }

    // 1. Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Prepare context (Simulating translation by passing same content)
      const updatedContext: UserContext = {
        ...context,
        original_input: content,
        translated_input: content, // Simulate translated input
      };

      // 3. Process with AI based on provider
      let processAI = processGemini;
      if (context.provider === 'ollama') processAI = processOllama3b;
      if (context.provider === 'ollama-1b') processAI = processOllama1b;
      const result = await processAI(updatedContext);

      // 4. Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.chat_response,
        legalData: result,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentLegalResponse(result);
      
      // Auto-open dashboard on larger screens if results come in
      if (window.innerWidth >= 1280) {
        setIsDashboardOpen(true);
      }
    } catch (error: any) {
      let friendlyMessage = "I'm sorry, I encountered an error while processing your request. Please try again or check your configuration.";
      
      if (error?.message === "QUOTA_EXCEEDED") {
        friendlyMessage = "JusticeLink is currently experiencing high demand. Our AI's daily quota has been reached. Please try again in a little while or later today.";
      } else if (error?.message === "INVALID_API_KEY") {
        friendlyMessage = "Google Gemini API Key is invalid. Please check your .env.local file and ensure the VITE_GEMINI_API_KEY is correct.";
      } else if (error?.message === "OLLAMA_NOT_RUNNING") {
        friendlyMessage = "Local Ollama instance not found. Please ensure Ollama is running on your machine and you have pulled the 'llama3:latest' model.";
      } else if (error?.message?.includes("Gemini Error:") || error?.message?.includes("Ollama Error:")) {
        friendlyMessage = `Service ${error.message}. Please check your configuration.`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: friendlyMessage,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-legal-bg relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Configuration Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar 
          context={context} 
          setContext={setContext} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex items-center px-4 lg:px-8 justify-between z-10 w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex w-8 h-8 bg-legal-primary rounded-lg items-center justify-center text-white font-bold text-xs">J</div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-legal-secondary leading-none">Legal Support Session</h2>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Active Monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  isDashboardOpen 
                    ? 'bg-legal-primary text-white border-legal-primary' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
             >
               <Info className={`w-4 h-4 ${isDashboardOpen ? 'animate-pulse' : ''}`} />
               <span className="text-xs font-semibold hidden sm:inline">Case Info</span>
             </button>
          </div>
        </header>

        {/* Language Selection Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 sm:px-8 flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
            <Globe className="w-4 h-4" /> Input Language
          </label>
          <select 
            value={context.user_language}
            onChange={(e) => setContext({ ...context, user_language: e.target.value })}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg focus:ring-legal-primary focus:border-legal-primary block p-2 transition-all hover:bg-slate-100"
          >
            {[
              "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", 
              "Urdu", "Kannada", "Malayalam", "Odia", "Punjabi", 
              "Assamese", "Bhojpuri", "English"
            ].map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage}
            userLanguage={context.user_language}
          />
        </div>
      </main>

      {/* Legal Case Dashboard */}
      <AnimatePresence>
        {isDashboardOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDashboardOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed lg:static inset-y-0 right-0 z-50 w-full sm:w-[450px] shadow-2xl lg:shadow-none"
            >
              <LegalDashboard 
                data={currentLegalResponse} 
                onClose={() => setIsDashboardOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}