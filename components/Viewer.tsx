import React, { useEffect, useState, useRef } from 'react';
import { Slide } from '../types';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sparkles, X, Loader2, BookOpen, BrainCircuit, ListChecks, Layers, CheckCircle, Bookmark, Trophy, Maximize, Minimize, ChevronUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ViewerProps {
  slides: Slide[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onExplain?: () => void;
  onSummarize?: () => void;
  onSummarizeAll?: () => void;
  onTakeQuiz?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  explanation: string | null;
  isExplaining: boolean;
  onCloseExplanation: () => void;
  children?: React.ReactNode;
}

const Viewer: React.FC<ViewerProps> = ({ 
  slides, 
  currentIndex, 
  onNavigate, 
  onExplain,
  onSummarize,
  onSummarizeAll,
  onTakeQuiz,
  isSidebarOpen,
  onToggleSidebar,
  explanation,
  isExplaining,
  onCloseExplanation,
  children
}) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when slide changes
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent navigation if user is typing in a text input/textarea
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < slides.length - 1) onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, onNavigate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-800 m-4">
        <BookOpen className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No document loaded</p>
        <p className="text-sm opacity-60">Upload a PDF or images to start</p>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const showSplitPanel = explanation !== null || isExplaining;
  const isLastSlide = currentIndex === slides.length - 1;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} className="flex h-full bg-[#09090b] relative overflow-hidden group/viewer">
      
      {/* Main Slide Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-0 custom-scrollbar relative transition-all duration-300 bg-black">
        <div 
          className="relative transition-transform duration-200 ease-out z-10"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <img 
            src={currentSlide.url} 
            alt={currentSlide.name} 
            className="max-w-full max-h-[100vh] object-contain shadow-2xl" 
          />
          
          {/* End of Deck Overlay Trigger */}
          {isLastSlide && (
            <div className="absolute inset-x-0 bottom-32 flex justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity duration-500 z-50">
               {onSummarizeAll && (
                 <button 
                   onClick={onSummarizeAll}
                   className="bg-gray-900/90 hover:bg-indigo-600 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 transform hover:scale-105 transition-all font-medium"
                 >
                   <CheckCircle size={18} className="text-emerald-400" />
                   Generate Guide
                 </button>
               )}
               
               {onTakeQuiz && (
                 <button 
                   onClick={onTakeQuiz}
                   className="bg-gray-900/90 hover:bg-orange-500 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 transform hover:scale-105 transition-all font-medium"
                 >
                   <Trophy size={18} className="text-yellow-400" />
                   Test Yourself
                 </button>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar Container - Sits at very bottom, handles hover interaction */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center justify-end pb-6 transition-all duration-300 pointer-events-none h-32
        ${isFullscreen ? 'pb-8' : ''}
        ${showSplitPanel ? 'pr-[450px]' : ''}
        `}
      >
        
        {/* Interaction Group */}
        <div className="pointer-events-auto flex flex-col items-center group/tools">
          
          {/* Toolbar Items */}
          <div className={`
              flex items-center bg-gray-950/90 backdrop-blur-2xl rounded-2xl px-3 py-2 shadow-2xl gap-3 border border-white/10 transition-all duration-300 origin-bottom mb-3
              ${showToolbar ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none absolute bottom-0'}
          `}>
            
            {/* Navigation */}
            <div className="flex items-center gap-2">
               <button 
                onClick={() => onNavigate(currentIndex - 1)} 
                disabled={currentIndex === 0}
                className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors text-gray-300 hover:text-white"
                title="Previous (Arrow Left)"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-mono text-gray-400 min-w-[3rem] text-center select-none">
                {currentIndex + 1} / {slides.length}
              </span>
              <button 
                onClick={() => onNavigate(currentIndex + 1)} 
                disabled={currentIndex === slides.length - 1}
                className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors text-gray-300 hover:text-white"
                title="Next (Arrow Right)"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="w-px h-6 bg-white/10"></div>

            {/* Tools */}
            <div className="flex items-center gap-1">
              <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors" title="Zoom Out">
                <ZoomOut size={18} />
              </button>
              <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors" title="Zoom In">
                <ZoomIn size={18} />
              </button>
               <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors" title="Full Screen">
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>

            <div className="w-px h-6 bg-white/10"></div>
            
            {/* AI Actions */}
            <div className="flex items-center gap-2">
              {onSummarize && (
                <button 
                  onClick={onSummarize}
                  className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-emerald-400 transition-colors"
                  title="Key Points"
                >
                  <ListChecks size={18} />
                </button>
              )}

              {onExplain && (
                <button 
                  onClick={showSplitPanel ? onCloseExplanation : onExplain}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg ml-1 ${
                    showSplitPanel 
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25'
                  }`}
                >
                  {showSplitPanel ? <X size={16} /> : <BrainCircuit size={16} />}
                  <span className="hidden sm:inline">{showSplitPanel ? 'Close' : 'Explain'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Toggle Button */}
          <button
              onClick={() => setShowToolbar(!showToolbar)}
              className={`
                  flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg border backdrop-blur-md transition-all duration-300
                  ${showToolbar 
                      ? 'bg-gray-900/50 text-gray-500 border-transparent hover:bg-gray-900 hover:text-white' 
                      : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 opacity-0 group-hover/tools:opacity-100 translate-y-full group-hover/tools:translate-y-0'
                  }
              `}
          >
              {showToolbar ? (
                  <>
                    <ChevronDown size={12} />
                    <span>Hide Controls</span>
                  </>
              ) : (
                  <>
                    <ChevronUp size={12} />
                    <span>Show Tools</span>
                  </>
              )}
          </button>
        </div>

      </div>

      {/* Internal Split Panel (Explanation) */}
      {showSplitPanel && (
        <div className="w-[450px] bg-gray-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-40 animate-slide-in-right relative h-full">
          
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
            <div>
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-400" />
                Smart Analysis
              </h3>
            </div>
            <button onClick={onCloseExplanation} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isExplaining ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-white">Analyzing pixels...</p>
                  <p className="text-xs text-gray-500">Extracting context & solving</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown 
                  components={{
                    h1: ({node, ...props}) => <h1 {...props} className="text-lg font-bold text-white mb-3" />,
                    h2: ({node, ...props}) => <h2 {...props} className="text-sm font-bold text-indigo-300 mt-6 mb-3 uppercase tracking-wide flex items-center gap-2 border-b border-white/5 pb-2" />,
                    p: ({node, ...props}) => <p {...props} className="text-gray-300 leading-relaxed mb-4" />,
                    ul: ({node, ...props}) => <ul {...props} className="space-y-2 mb-4 list-none pl-0" />,
                    li: ({node, ...props}) => (
                      <li {...props} className="flex gap-3 text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>
                        <span>{props.children}</span>
                      </li>
                    ),
                    strong: ({node, ...props}) => <strong {...props} className="text-indigo-200 font-bold" />,
                    code: ({node, ...props}) => <code {...props} className="bg-black/50 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono border border-white/10" />,
                  }}
                >
                  {explanation || ""}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-white/5 bg-black/20 text-center">
             <span className="text-[10px] text-gray-600 font-mono uppercase">AI Generated Output</span>
          </div>
        </div>
      )}

      {/* Render children (like Modals) inside the fullscreen container */}
      {children}
    </div>
  );
};

export default Viewer;