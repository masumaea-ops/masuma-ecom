import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, ExternalLink, Car, ShieldCheck, MapPin, MessageSquareText, Globe, Loader2, Info, Search } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ExtendedChatMessage extends ChatMessage {
  sources?: { uri: string; title: string }[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    { 
      role: 'model', 
      text: "Jambo! Karibu to Masuma Autoparts East Africa. 🇰🇪\n\nI am your live technical consultant. I have full access to our global part catalogs and live internet data. \n\nI can help you identify parts, check local prices, or solve complex technical issues for your vehicle. What are you working on today?" 
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMessage: ExtendedChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
        const history = messages.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

      const result = await sendMessageToGemini(history, userMessage.text);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text,
        sources: result.sources 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Samahani, I'm having a connection hiccup. Please visit us at Ruby Mall, First Floor, or message our team directly on WhatsApp +254 792 506 590.", 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex flex-col md:flex-row items-end justify-end">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto md:bg-transparent" onClick={onClose}></div>

      <div className="pointer-events-auto absolute md:relative bottom-0 right-0 w-full md:w-[450px] md:h-[750px] md:bottom-6 md:right-6 bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slide-up">
        
        {/* Header */}
        <div className="bg-masuma-dark p-5 flex justify-between items-center text-white border-b-4 border-masuma-orange shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-masuma-orange p-2 rounded-lg shadow-inner">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                Masuma Live Expert
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Connected to Web Grounding</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition bg-white/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-masuma-orange text-white rounded-tr-none' 
                    : 'bg-white text-masuma-dark border border-gray-100 rounded-tl-none'
                } ${msg.isError ? 'border-red-500 text-red-600 bg-red-50' : ''}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1">
                        <Globe size={10} className="text-masuma-orange" /> Web References & Data:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {msg.sources.map((src, sIdx) => (
                        <a key={sIdx} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-masuma-dark font-bold hover:text-masuma-orange transition flex items-center gap-1 bg-gray-50 p-2 rounded border border-gray-100 truncate group">
                          <ExternalLink size={10} className="shrink-0 group-hover:scale-110 transition" />
                          <span className="truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-masuma-dark p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-masuma-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-masuma-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-masuma-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Expert is thinking...</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-blue-500 uppercase animate-pulse px-1">
                    <Search size={10} /> Searching web for technical data...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Buttons */}
        {!isLoading && messages.length < 10 && (
          <div className="px-5 py-3 flex gap-2 overflow-x-auto bg-white border-t border-gray-100 scrollbar-hide">
             <button onClick={() => handleSend("Current price of Fielder shocks in Kenya?")} className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-masuma-orange hover:text-white text-[10px] font-bold uppercase rounded-full border border-gray-200 transition flex items-center gap-1">
               <Globe size={12}/> Market Prices
             </button>
             <button onClick={() => handleSend("Tell me about Masuma 1-year warranty")} className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-masuma-orange hover:text-white text-[10px] font-bold uppercase rounded-full border border-gray-200 transition flex items-center gap-1">
               <ShieldCheck size={12}/> Warranty
             </button>
             <button onClick={() => handleSend("How to find Ruby Mall on Accra Road?")} className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-masuma-orange hover:text-white text-[10px] font-bold uppercase rounded-full border border-gray-200 transition flex items-center gap-1">
               <MapPin size={12}/> Shop Location
             </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-5 bg-white border-t border-gray-100">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about parts or car issues..."
                className="w-full pl-4 pr-10 py-4 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-masuma-orange/20 focus:bg-white focus:border-masuma-orange transition outline-none text-sm shadow-inner"
                disabled={isLoading}
              />
              <MessageSquareText className="absolute right-3 top-4 text-gray-300" size={20} />
            </div>
            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="p-4 bg-masuma-dark text-white hover:bg-masuma-orange disabled:opacity-50 transition rounded-xl shadow-lg flex items-center justify-center">
              <Send size={20} />
            </button>
          </div>
          <p className="text-[8px] text-center text-gray-300 font-bold uppercase tracking-widest mt-3">Masuma Autoparts East Africa Ltd • Real-time AI</p>
        </div>

      </div>
    </div>
  );
};

export default AIAssistant;