import React, { useRef, useEffect, useState } from 'react';
import { Message, LoadingState } from '../types';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, AlertCircle, BookOpen, PenTool, X } from 'lucide-react';

interface ChatSidebarProps {
  messages: Message[];
  loadingState: LoadingState;
  onSendMessage: (text: string) => void;
  onExplainSlide: () => void;
  hasSlide: boolean;
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  messages, 
  loadingState, 
  onSendMessage, 
  onExplainSlide,
  hasSlide,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loadingState !== 'idle') return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-full shadow-2xl flex-shrink-0">
      {/* Notebook Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900">
        <div>
          <h2 className="text-xl font-serif font-medium text-gray-100 flex items-center gap-2">
            <BookOpen className="text-indigo-400 w-5 h-5" />
            Study Notes
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
            AI Generated Insights
          </p>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Content Area (Notebook Style) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-900">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
            <Sparkles className="w-12 h-12 text-gray-600" />
            <p className="text-gray-400 font-serif italic text-lg">
              "Select a slide and ask me to explain it to generate study notes."
            </p>
          </div>
        )}

        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={msg.id} className="animate-fade-in">
            
            {/* User Query - Styled as a Section Header/Prompt */}
            {msg.role === 'user' && (
              <div className="flex items-start gap-3 mb-4 group">
                <div className="mt-1 p-1 bg-indigo-500/10 rounded text-indigo-400">
                  <PenTool size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-indigo-300 font-mono uppercase tracking-wide opacity-80 mb-1">
                    Query
                  </h3>
                  <p className="text-gray-100 text-lg font-serif leading-relaxed border-l-2 border-indigo-500/50 pl-3">
                    {msg.content}
                  </p>
                </div>
              </div>
            )}

            {/* Model Response - Styled as Document Content */}
            {msg.role === 'model' && (
              <div className="pl-4 border-l border-gray-800 ml-2 pb-6">
                 <ReactMarkdown 
                  className="prose prose-invert prose-lg max-w-none prose-headings:text-gray-100 prose-headings:font-serif prose-p:text-gray-300 prose-p:leading-8 prose-li:text-gray-300 prose-strong:text-indigo-200 prose-code:text-indigo-300 prose-code:bg-gray-800/50 prose-code:px-1 prose-code:rounded"
                  components={{
                    h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-serif font-medium mb-4 text-white mt-2" />,
                    h2: ({node, ...props}) => <h2 {...props} className="text-xl font-serif font-medium mb-3 text-indigo-100 mt-6 border-b border-gray-800 pb-2" />,
                    h3: ({node, ...props}) => <h3 {...props} className="text-lg font-medium mb-2 text-gray-200 mt-4" />,
                    ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 space-y-2 mb-4 marker:text-gray-600" />,
                    li: ({node, ...props}) => <li {...props} className="pl-1" />,
                    strong: ({node, ...props}) => <strong {...props} className="font-semibold text-indigo-200" />,
                    blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-gray-700 pl-4 italic text-gray-400 my-4" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                
                {/* Footer of the note card */}
                <div className="mt-4 flex items-center gap-2">
                   <div className="h-px bg-gray-800 flex-1"></div>
                   <span className="text-[10px] text-gray-600 font-mono uppercase">AI Note • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {loadingState === 'analyzing' && (
          <div className="pl-6 ml-2 border-l border-gray-800 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-800/50 rounded w-full"></div>
              <div className="h-4 bg-gray-800/50 rounded w-5/6"></div>
              <div className="h-4 bg-gray-800/50 rounded w-4/6"></div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-indigo-400 text-sm font-medium">
               <Sparkles size={16} className="animate-spin" />
               Drafting notes...
            </div>
          </div>
        )}

        {loadingState === 'error' && (
           <div className="bg-red-900/10 border border-red-900/50 p-4 rounded-lg flex items-center gap-3 text-red-200">
             <AlertCircle className="flex-shrink-0" />
             <p className="text-sm">Unable to analyze the slide. Please try again.</p>
           </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 bg-gray-900 border-t border-gray-800 z-10">
        {hasSlide && (
          <button
            onClick={onExplainSlide}
            disabled={loadingState !== 'idle'}
            className="w-full mb-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Scan & Explain Page
          </button>
        )}
        
        <div className="relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasSlide ? "Ask a specific question..." : "Upload a document first..."}
            disabled={!hasSlide || loadingState !== 'idle'}
            className="w-full bg-gray-800/50 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-gray-700 resize-none h-12 min-h-[48px] max-h-32 scrollbar-hide disabled:opacity-50 placeholder-gray-500 transition-all focus:bg-gray-800"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || loadingState !== 'idle' || !hasSlide}
            className="absolute right-2 top-2 p-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-indigo-600 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;