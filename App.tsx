import React, { useState, useEffect } from 'react';
import { Slide, Message, LoadingState, QuizData, QuizConfig } from './types';
import Viewer from './components/Viewer';
import ChatSidebar from './components/ChatSidebar';
import UploadZone from './components/UploadZone';
import QuizModal from './components/QuizModal';
import LandingPage from './components/LandingPage';
import { getSlideExplanation, getSlideTakeaways, analyzeBatchSlides, generateQuizFromSlides, generateQuestionBank, MODELS } from './services/gemini';
import { convertPdfToImages } from './utils/pdf';
import { saveWorkspace, loadWorkspace, clearWorkspace } from './services/storage';
import { Menu, Loader2, Sparkles, BrainCircuit, ChevronDown, Zap, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]); 
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  // Quick Explanation State (Internal Split View)
  const [quickExplanation, setQuickExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<string>(MODELS.FLASH);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Quiz State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false); // Controls visibility
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Auto-Save Effect
  useEffect(() => {
    if (slides.length > 0) {
      const saveData = setTimeout(() => {
        saveWorkspace({
          slides,
          messages,
          lastActiveIndex: currentSlideIndex,
          timestamp: Date.now()
        });
      }, 2000); // Debounce save every 2 seconds
      return () => clearTimeout(saveData);
    }
  }, [slides, messages, currentSlideIndex]);

  // Load Session Handler
  const handleResumeSession = async () => {
    setIsProcessing(true);
    try {
      const data = await loadWorkspace();
      if (data) {
        setSlides(data.slides);
        setMessages(data.messages);
        setCurrentSlideIndex(data.lastActiveIndex);
        setShowLanding(false);
      }
    } catch (e) {
      console.error("Failed to resume", e);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClearSession = async () => {
    if(confirm("Are you sure you want to clear the current workspace? This cannot be undone.")) {
      await clearWorkspace();
      setSlides([]);
      setMessages([]);
      setShowLanding(true);
    }
  }

  // Handle File Uploads (Images or PDF)
  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    const newSlides: Slide[] = [];
    
    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const pdfSlides = await convertPdfToImages(file);
          newSlides.push(...pdfSlides);
        } else if (file.type.startsWith('image/')) {
          newSlides.push({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            name: file.name,
            file
          });
        }
      }

      if (newSlides.length > 0) {
        setSlides(prev => [...prev, ...newSlides]);
        setShowLanding(false); // Automatically enter app on upload if not already
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      alert(error.message || "Failed to process files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getBase64FromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleNavigate = (index: number) => {
    setCurrentSlideIndex(index);
    // Restore persisted explanation if it exists
    if (slides[index].explanation) {
      setQuickExplanation(slides[index].explanation!);
    } else {
      setQuickExplanation(null);
    }
  };

  // Handle "Quick Explain" - Internal Split View
  const handleExplainSlide = async () => {
    if (slides.length === 0 || isExplaining) return;

    setQuickExplanation(null);
    setIsExplaining(true);
    if (sidebarOpen) setSidebarOpen(false);

    try {
      const currentSlide = slides[currentSlideIndex];
      
      const base64data = await getBase64FromUrl(currentSlide.url);
      
      const explanation = await getSlideExplanation(
        base64data, 
        "Look at this slide. If there are questions, SOLVE them. If it's a topic, explain it simply (ELI5) with an analogy.",
        selectedModel
      );
      
      setQuickExplanation(explanation);

      // Persist the explanation to the slide object
      setSlides(prev => prev.map((slide, idx) => 
        idx === currentSlideIndex ? { ...slide, explanation: explanation } : slide
      ));

    } catch (err) {
      console.error(err);
      setQuickExplanation("Sorry, I couldn't analyze this slide. Please try again.");
    } finally {
      setIsExplaining(false);
    }
  };

  // Handle "Key Points" Summary
  const handleSummarizeSlide = async () => {
    if (slides.length === 0 || isExplaining) return;

    setQuickExplanation(null);
    setIsExplaining(true);
    if (sidebarOpen) setSidebarOpen(false);

    try {
      const currentSlide = slides[currentSlideIndex];
      const base64data = await getBase64FromUrl(currentSlide.url);

      const summary = await getSlideTakeaways(base64data, selectedModel);
      setQuickExplanation(summary);
      
      // Persist summary as explanation if user prefers
       setSlides(prev => prev.map((slide, idx) => 
        idx === currentSlideIndex ? { ...slide, explanation: summary } : slide
      ));

    } catch (err) {
      console.error(err);
      setQuickExplanation("Sorry, I couldn't summarize this slide. Please try again.");
    } finally {
      setIsExplaining(false);
    }
  }

  // Handle "Summarize All Slides" (Full Deck)
  const handleGenerateFullSummary = async () => {
    if (slides.length === 0 || loadingState !== 'idle') return;

    setSidebarOpen(true);
    setLoadingState('analyzing');
    
    // Add a placeholder message for the summary
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: "Generate a comprehensive study guide for the entire document.",
      timestamp: Date.now()
    }]);

    try {
      // 1. Process slides in chunks to avoid payload limits
      // Batch size of 4 slides per request is safe for images + text
      const BATCH_SIZE = 4;
      let fullSummaryText = "# 📚 Complete Study Guide\n\n";

      for (let i = 0; i < slides.length; i += BATCH_SIZE) {
        const batch = slides.slice(i, i + BATCH_SIZE);
        
        // Prepare base64 data for the batch
        const batchData = await Promise.all(batch.map(async (slide, idx) => ({
          base64: await getBase64FromUrl(slide.url),
          index: i + idx
        })));

        // Call API
        const batchSummary = await analyzeBatchSlides(batchData, selectedModel);
        fullSummaryText += batchSummary + "\n\n---\n\n";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: fullSummaryText,
        timestamp: Date.now()
      }]);
      setLoadingState('idle');

    } catch (error) {
      console.error("Full Summary Error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: "Error: Could not complete full document analysis. Please try again later.",
        timestamp: Date.now()
      }]);
      setLoadingState('error');
    }
  };

  const handleStartQuiz = async (config: QuizConfig) => {
    setIsGeneratingQuiz(true);
    try {
       const slidesPayload = await Promise.all(slides.map(async (slide, idx) => ({
          base64: await getBase64FromUrl(slide.url),
          index: idx
       })));

       const quiz = await generateQuizFromSlides(slidesPayload, config, selectedModel);
       if (quiz && quiz.questions) {
         setQuizData(quiz);
       } else {
         alert("Could not generate a quiz. Try again.");
         setShowQuizModal(false);
       }

    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz.");
      setShowQuizModal(false);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Handler for generating question bank
  const handleGenerateQuestionBank = async (): Promise<string> => {
    try {
      const slidesPayload = await Promise.all(slides.map(async (slide, idx) => ({
        base64: await getBase64FromUrl(slide.url),
        index: idx
      })));
      return await generateQuestionBank(slidesPayload, selectedModel);
    } catch (e) {
      console.error(e);
      return "Failed to generate question bank.";
    }
  };


  // Handle Chat Message (Sidebar)
  const handleSendMessage = async (text: string) => {
    if (slides.length === 0 || loadingState !== 'idle') return;

    if (!sidebarOpen) setSidebarOpen(true);
    if (quickExplanation) setQuickExplanation(null);

    const currentSlide = slides[currentSlideIndex];
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    }]);

    setLoadingState('analyzing');

    try {
      const base64data = await getBase64FromUrl(currentSlide.url);
      const answer = await getSlideExplanation(base64data, text, selectedModel);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: answer,
        timestamp: Date.now()
      }]);
      setLoadingState('idle');
    } catch (error) {
       console.error(error);
       setLoadingState('error');
    }
  };

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} onResume={handleResumeSession} />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 relative`}>
        
        {/* Header - Glassmorphism */}
        <header className="h-14 bg-gray-950/80 backdrop-blur-md border-b border-gray-900 flex items-center justify-between px-6 z-30 shrink-0 relative">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowLanding(true)}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <Sparkles size={16} className="fill-white/20" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Lumina</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Model Selector */}
             <div className="relative z-50">
                <button 
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs hover:border-gray-700 transition-colors"
                >
                  {selectedModel === MODELS.FLASH ? (
                    <Zap size={14} className="text-yellow-400" />
                  ) : (
                    <BrainCircuit size={14} className="text-purple-400" />
                  )}
                  <span className="text-gray-300 font-medium hidden sm:inline">
                    {selectedModel === MODELS.FLASH ? 'Lumina Flash' : 'Lumina Genius'}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                
                {isModelMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <button 
                      onClick={() => { setSelectedModel(MODELS.FLASH); setIsModelMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-800 flex items-start gap-3 transition-colors"
                    >
                      <Zap size={16} className="text-yellow-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-white">Lumina Flash</div>
                        <div className="text-xs text-gray-500">Fast analysis & standard explanations</div>
                      </div>
                    </button>
                    <div className="h-px bg-gray-800 mx-4"></div>
                    <button 
                      onClick={() => { setSelectedModel(MODELS.PRO); setIsModelMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-800 flex items-start gap-3 transition-colors"
                    >
                      <BrainCircuit size={16} className="text-purple-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-white">Lumina Genius</div>
                        <div className="text-xs text-gray-500">Deep reasoning for complex math/science</div>
                      </div>
                    </button>
                  </div>
                )}
             </div>

             {slides.length > 0 && (
                <>
                  <button 
                    onClick={handleClearSession} 
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="Clear Workspace"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`hidden md:flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border transition-all ${
                      sidebarOpen 
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                      <Sparkles size={14} />
                      {sidebarOpen ? 'Hide Chat' : 'Ask AI'}
                  </button>
                </>
            )}
          </div>
        </header>

        {/* Viewer or Upload Screen */}
        <main className="flex-1 relative overflow-hidden bg-gray-950 flex flex-col">
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-gray-950/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-medium text-white">Restoring workspace...</h3>
            </div>
          )}

          {slides.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black">
              <div className="max-w-3xl w-full h-full max-h-[500px]">
                <UploadZone onFilesSelected={handleFilesSelected} />
              </div>
            </div>
          ) : (
            <Viewer 
              slides={slides} 
              currentIndex={currentSlideIndex} 
              onNavigate={handleNavigate}
              onExplain={handleExplainSlide}
              onSummarize={handleSummarizeSlide}
              onSummarizeAll={handleGenerateFullSummary}
              onTakeQuiz={() => setShowQuizModal(true)}
              isSidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              // New Props
              explanation={quickExplanation}
              isExplaining={isExplaining}
              onCloseExplanation={() => setQuickExplanation(null)}
            >
              {/* Nested Quiz Modal for Fullscreen Support */}
              {showQuizModal && (
                <QuizModal 
                  data={quizData}
                  onClose={() => {
                    setShowQuizModal(false);
                    setQuizData(null);
                  }}
                  onStartQuiz={handleStartQuiz}
                  onGenerateQuestionBank={handleGenerateQuestionBank}
                  isLoading={isGeneratingQuiz}
                />
              )}
            </Viewer>
          )}

          {/* Add Slide Button Floating (when slides exist) */}
          {slides.length > 0 && !isProcessing && (
             <div className="absolute bottom-6 left-6 z-20">
               <label className="cursor-pointer bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white px-4 py-2 rounded-full shadow-2xl border border-gray-700/50 flex items-center gap-2 text-xs font-medium transition-all group backdrop-blur hover:shadow-indigo-500/10 hover:border-indigo-500/30">
                  <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                    if (e.target.files?.length) handleFilesSelected(Array.from(e.target.files));
                  }} />
                  <span className="group-hover:text-indigo-400 transition-colors">+ Add Pages</span>
               </label>
             </div>
          )}
        </main>
      </div>

      {/* Notebook Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-out bg-gray-900 border-l border-gray-800 shadow-2xl w-full sm:w-[450px]
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <ChatSidebar 
          messages={messages}
          loadingState={loadingState}
          onSendMessage={handleSendMessage}
          onExplainSlide={() => {
            setSidebarOpen(false);
            handleExplainSlide();
          }}
          hasSlide={slides.length > 0}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
    </div>
  );
};

export default App;