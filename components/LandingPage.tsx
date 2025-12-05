import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Zap, Play } from 'lucide-react';
import { loadWorkspace } from '../services/storage';

interface LandingPageProps {
  onGetStarted: () => void;
  onResume: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onResume }) => {
  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    const checkStorage = async () => {
      const data = await loadWorkspace();
      if (data && data.slides.length > 0) {
        setHasSavedSession(true);
      }
    };
    checkStorage();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black animate-pulse" style={{animationDuration: '8s'}}></div>
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        
        {/* Animated Logo/Icon */}
        <div className="mb-12 relative group cursor-pointer">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
          <div className="relative w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500 border border-white/10">
            <Sparkles size={32} className="text-white fill-white/20" />
          </div>
        </div>

        {/* Minimal Typography */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 animate-fade-in-up">
          Lumina
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 font-light mb-12 max-w-2xl tracking-wide animate-fade-in-up delay-100">
          Your intelligent study space.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-5 animate-fade-in-up delay-200 w-full justify-center">
          {hasSavedSession && (
             <button 
              onClick={onResume}
              className="group relative px-8 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full text-white font-medium transition-all border border-white/10 flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              Resume Session
            </button>
          )}

          <button 
            onClick={onGetStarted}
            className="group relative px-10 py-4 bg-white text-black rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span>{hasSavedSession ? 'Start New' : 'Get Started'}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;