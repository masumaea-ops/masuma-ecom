
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Jambo! I'm MasumaBot. I can help you find parts for your car or answer maintenance questions. What vehicle are you driving?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const history = messages.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

      const responseText = await sendMessageToGemini(history, userMessage.text);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the Masuma network right now. Please check your internet.", isError: true }]);
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
      {/* Backdrop (Click to Close) - Pointer events re-enabled */}
      <div 
          className="absolute inset-0 bg-black/50 pointer-events-auto md:bg-transparent" 
          onClick={onClose}
      ></div>

      {/* Chat Window */}
      {/* On Mobile: top-[120px] pushes it below the header. On Desktop: Standard bottom-right */}
      <div className="pointer-events-auto absolute md:relative top-[120px] bottom-0 left-0 right-0 md:top-auto md:bottom-6 md:right-6 md:left-auto w-full md:w-96 md:h-[600px] bg-white md:rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 font-sans animate-slide-up z-[1001]">
        
        {/* Header */}
        <div className="bg-masuma-dark p-4 flex justify-between items-center text-white border-b-4 border-masuma-orange shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-masuma-orange p-2 rounded-full shadow-inner">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Masuma Expert AI</h3>
              <p className="text-[10px] text-gray-400">Live Assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 text-gray-400 hover:text-white transition text-xs font-bold uppercase bg-white/10 px-2 py-1 rounded hover:bg-masuma-orange"
          >
            Close <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-masuma-orange text-white rounded-t-lg rounded-bl-lg' 
                    : 'bg-white text-masuma-dark border border-gray-200 rounded-t-lg rounded-br-lg'
                } ${msg.isError ? 'border-red-500 text-red-600 bg-red-50' : ''}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-masuma-dark p-3 rounded-t-lg rounded-br-lg shadow-sm border border-gray-200 flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse text-masuma-orange" />
                <span className="text-xs font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about parts..."
              className="w-full pl-4 pr-12 py-3 bg-gray-100 border border-transparent rounded-none focus:ring-1 focus:ring-masuma-orange focus:bg-white transition outline-none text-sm text-masuma-dark placeholder:text-gray-400"
              disabled={isLoading}
              autoFocus
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-masuma-dark text-white hover:bg-masuma-orange disabled:opacity-50 disabled:hover:bg-masuma-dark transition rounded-sm"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAssistant;
