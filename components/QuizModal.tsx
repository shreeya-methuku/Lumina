import React, { useState } from 'react';
import { QuizData, QuizConfig } from '../types';
import { CheckCircle, XCircle, Trophy, ArrowRight, RefreshCw, X, Eye, Play, Settings2, BookOpen, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizModalProps {
  data: QuizData | null;
  onClose: () => void;
  onStartQuiz: (config: QuizConfig) => void;
  onGenerateQuestionBank?: () => Promise<string>;
  isLoading?: boolean;
}

const QuizModal: React.FC<QuizModalProps> = ({ data, onClose, onStartQuiz, onGenerateQuestionBank, isLoading }) => {
  // Setup State
  const [config, setConfig] = useState<QuizConfig>({ type: 'mcq', difficulty: 'medium' });
  const [isSetupMode, setIsSetupMode] = useState(!data); // If no data, we are in setup mode

  // Quiz Execution State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false); // For MCQ: Answer selected. For Subjective: Model Answer revealed.
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [subjectiveRating, setSubjectiveRating] = useState<number | null>(null);

  // Question Bank State
  const [questionBank, setQuestionBank] = useState<string | null>(null);
  const [loadingBank, setLoadingBank] = useState(false);
  const [view, setView] = useState<'quiz' | 'bank'>('quiz');

  const handleStart = () => {
    setIsSetupMode(false);
    onStartQuiz(config);
  };

  const handleGetQuestionBank = async () => {
    if (!onGenerateQuestionBank) return;
    setLoadingBank(true);
    try {
      const result = await onGenerateQuestionBank();
      setQuestionBank(result);
      setView('bank');
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBank(false);
    }
  };

  // 1. Question Bank View (Highest Priority)
  if (view === 'bank' && questionBank) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-indigo-400" size={24} /> Study Question Bank
              </h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Comprehensive Review Material</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setView('quiz')} 
                className="text-gray-300 hover:text-white px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                {data ? "Back to Results" : "Back to Setup"}
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0f1117]">
            <ReactMarkdown 
              className="prose prose-invert prose-sm max-w-none"
              components={{
                h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mt-8 mb-4 pb-2 border-b border-gray-800" />,
                p: ({node, ...props}) => <div {...props} className="mb-4 text-gray-300 leading-relaxed text-[15px]" />,
                strong: ({node, ...props}) => <strong {...props} className="text-white font-semibold" />,
                blockquote: ({node, ...props}) => (
                  <div className="bg-gray-800/40 border-l-4 border-emerald-500/30 p-4 rounded-r-xl my-4 text-sm text-gray-300 shadow-sm">
                    <span className="text-emerald-400 font-bold block mb-1 text-xs uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle size={12} /> Answer
                    </span>
                    <div className="opacity-90 leading-relaxed">{props.children}</div>
                  </div>
                ),
                ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 space-y-2 mb-4 text-gray-300" />,
                li: ({node, ...props}) => <li {...props} className="pl-1" />
              }}
            >
              {questionBank}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // 2. Setup Mode (If no data or specifically in setup)
  if (isSetupMode || isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
          <div className="mb-6 flex items-center justify-center">
             <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
               <Settings2 className="text-indigo-400 w-8 h-8" />
             </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Test Yourself</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Customize your test parameters</p>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Question Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setConfig({...config, type: 'mcq'})}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.type === 'mcq' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                >
                  Multiple Choice
                </button>
                <button 
                  onClick={() => setConfig({...config, type: 'subjective'})}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.type === 'subjective' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                >
                  Short Answer
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button 
                    key={level}
                    onClick={() => setConfig({...config, difficulty: level as any})}
                    className={`p-2 rounded-lg border text-xs font-medium capitalize transition-all ${config.difficulty === level ? 'bg-white text-black border-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            disabled={isLoading || loadingBank}
            className="w-full mt-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
          >
            {isLoading ? (
               <>Generating Quiz...</>
            ) : (
               <>Start Quiz <Play size={16} fill="currentColor" /></>
            )}
          </button>

          {onGenerateQuestionBank && (
            <div className="mt-4 pt-4 border-t border-gray-800">
               <button 
                onClick={handleGetQuestionBank}
                disabled={isLoading || loadingBank}
                className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {loadingBank ? (
                  <span className="flex items-center gap-2">
                     <RefreshCw size={14} className="animate-spin" /> Generating Bank...
                  </span>
                ) : (
                  <>
                    <BookOpen size={16} />
                    Generate Question Bank Only
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Quiz Execution Mode Check
  if (!data) return null;

  const currentQuestion = data.questions[currentIndex];
  const isMcq = currentQuestion.type === 'mcq';

  // MCQ Handlers
  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    if (index === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  // Subjective Handlers
  const handleRevealAnswer = () => {
    setShowResult(true);
  };
  
  const handleRateSelf = (isCorrect: boolean) => {
    if (isCorrect) setScore(s => s + 1);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setSubjectiveRating(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-8 text-center relative shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
          
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
            <Trophy size={40} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
          <p className="text-gray-400 mb-6">You scored</p>
          
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-8">
            {score} / {data.questions.length}
          </div>
          
          <div className="space-y-3">
             <button 
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
            >
              Back to Slides
            </button>
            
            {onGenerateQuestionBank && (
              <button 
                onClick={handleGetQuestionBank}
                disabled={loadingBank}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                {loadingBank ? (
                  <span className="animate-pulse flex items-center gap-2"><RefreshCw size={14}/> Generating...</span>
                ) : (
                  <>
                    <BookOpen size={16} />
                    See All Potential Questions
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900">
          <div>
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
              {isMcq ? 'Multiple Choice' : 'Short Answer'} • Q{currentIndex + 1}/{data.questions.length}
            </span>
            <div className="w-32 h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / data.questions.length) * 100}%` }}
              />
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <h3 className="text-xl font-medium text-white mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* MCQ Options */}
          {isMcq && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                let stateClasses = "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200";
                
                if (showResult) {
                  if (idx === currentQuestion.correctAnswer) {
                    stateClasses = "bg-emerald-500/10 border-emerald-500 text-emerald-400";
                  } else if (idx === selectedOption) {
                    stateClasses = "bg-red-500/10 border-red-500 text-red-400";
                  } else {
                    stateClasses = "bg-gray-800/50 border-gray-800 text-gray-500 opacity-50";
                  }
                } else if (selectedOption === idx) {
                  stateClasses = "bg-indigo-600 border-indigo-500 text-white";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${stateClasses}`}
                  >
                    <span className="flex-1">{option}</span>
                    {showResult && idx === currentQuestion.correctAnswer && <CheckCircle size={20} />}
                    {showResult && idx === selectedOption && idx !== currentQuestion.correctAnswer && <XCircle size={20} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Subjective Flow */}
          {!isMcq && (
            <div className="space-y-6">
              {!showResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-dashed border-gray-700 text-center text-gray-400 py-12">
                     <p className="mb-2">Think of your answer...</p>
                     <p className="text-xs text-gray-500">When you are ready, reveal the model answer.</p>
                  </div>
                  <button 
                    onClick={handleRevealAnswer}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={18} /> Reveal Answer
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in space-y-4">
                  <div className="bg-emerald-900/10 border border-emerald-500/30 p-4 rounded-xl">
                    <h4 className="text-emerald-400 text-sm font-bold mb-2 uppercase tracking-wide">Model Answer</h4>
                    <ReactMarkdown className="prose prose-invert prose-sm text-gray-200">
                      {currentQuestion.modelAnswer || ""}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-center text-gray-400 text-sm mb-4">How did you do?</p>
                    <div className="flex gap-3">
                      <button 
                         onClick={() => handleRateSelf(false)}
                         className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium transition-all"
                      >
                        Needs Work
                      </button>
                      <button 
                         onClick={() => handleRateSelf(true)}
                         className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium transition-all"
                      >
                        I Got It!
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explanation (MCQ Only) */}
          {isMcq && showResult && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-400 mb-2">
                <RefreshCw size={14} />
                EXPLANATION
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer (MCQ Only - Subjective handles nav internally) */}
        {isMcq && (
          <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!showResult}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {currentIndex === data.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuizModal;