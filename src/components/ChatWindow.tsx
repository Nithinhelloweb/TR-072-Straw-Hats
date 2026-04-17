import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { User, ShieldCheck, Send, Loader2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  userLanguage: string;
}

// Add SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const languageMap: Record<string, string> = {
  'Hindi': 'hi-IN',
  'Bengali': 'bn-IN',
  'Telugu': 'te-IN',
  'Marathi': 'mr-IN',
  'Tamil': 'ta-IN',
  'Urdu': 'ur-PK',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Odia': 'or-IN',
  'Punjabi': 'pa-IN',
  'Assamese': 'as-IN',
  'Bhojpuri': 'hi-IN',
  'English': 'en-IN',
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, userLanguage }) => {
  const [input, setInput] = React.useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      // Use selected language for recognition
      recognitionRef.current.lang = languageMap[userLanguage] || 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInput(transcript);
        setSpeechError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          setSpeechError("Didn't catch that. Please try speaking again.");
        } else if (event.error === 'not-allowed') {
          setSpeechError("Microphone access is blocked.");
        } else {
          setSpeechError("Connection error. Please try again.");
        }

        // Clear error message after 3 seconds
        setTimeout(() => setSpeechError(null), 3000);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [userLanguage]);

  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        setInput('');
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-legal-primary" />
            </div>
            <h2 className="text-xl font-bold text-legal-secondary">Welcome to JusticeLink</h2>
            <p className="text-sm text-slate-500">
              I am your AI legal assistant. Please describe the problem you are facing at your workplace.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                message.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-legal-primary text-white'
              }`}>
                {message.role === 'user' ? <User className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              
               <div className={`max-w-[80%] rounded-2xl p-4 ${
                 message.role === 'user' 
                   ? 'bg-slate-100 text-slate-800 rounded-tr-none' 
                   : 'bg-white border border-slate-100 chat-shadow text-slate-800 rounded-tl-none'
               }`}>
                 {message.legalData ? (
                   message.legalData.chat_response_local && message.legalData.chat_response_english ? (
                     <>
                       <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
                         {message.legalData.chat_response_local}
                       </p>
                       <div className="border-t border-slate-200 pt-3 mt-2">
                         <p className="text-xs font-semibold text-slate-500 mb-1">English</p>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                           {message.legalData.chat_response_english}
                         </p>
                       </div>
                     </>
                   ) : message.content.includes('---') ? (
                     <>
                       <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
                         {message.content.split('---')[0].trim()}
                       </p>
                       <div className="border-t border-slate-200 pt-3 mt-2">
                         <p className="text-xs font-semibold text-slate-500 mb-1">English</p>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                           {message.content.split('---')[1].trim()}
                         </p>
                       </div>
                     </>
                   ) : (
                     <p className="text-sm leading-relaxed whitespace-pre-wrap">
                       {message.content}
                     </p>
                   )
                 ) : (
                   <p className="text-sm leading-relaxed whitespace-pre-wrap">
                     {message.content}
                   </p>
                 )}
                 <span className="text-[10px] text-slate-400 mt-2 block opacity-50">
                   {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
               </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-legal-primary text-white flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-slate-50 text-slate-400 p-4 rounded-2xl flex gap-2 items-center">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
              </span>
              <span className="text-xs font-medium">Analyzing legal implications...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative cursor-pointer flex gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={
                speechError 
                  ? speechError 
                  : isListening 
                    ? "Listening..." 
                    : "Type or speak your complaint..."
              }
              className={`w-full bg-slate-100 border-none rounded-2xl py-4 pl-6 pr-16 text-sm focus:ring-2 focus:ring-legal-primary transition-all placeholder:text-slate-400 ${
                isListening ? 'ring-2 ring-red-400 bg-red-50' : ''
              } ${
                speechError ? 'ring-2 ring-amber-400 bg-amber-50 placeholder:text-amber-600' : ''
              }`}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-12 top-1.5 bottom-1.5 px-3 rounded-xl flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-slate-400 hover:bg-slate-200'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-1.5 bottom-1.5 px-3 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-legal-primary text-white shadow-lg shadow-legal-primary/20 hover:bg-legal-secondary' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
