
import React, { useEffect, useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  reason: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  reason,
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const [contentAnimationClass, setContentAnimationClass] = useState('');

  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow;
    if (isOpen) {
      setAnimationClass('animate-modal-fade-in');
      setContentAnimationClass('animate-modal-scale-up');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = originalOverflow;
    }
    return () => {
      document.documentElement.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm ${animationClass}`}
      onClick={onClose} 
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className={`bg-gradient-to-br from-purple-700 via-pink-600 to-indigo-800 shadow-secondary rounded-xl w-full max-w-md p-6 md:p-8 border border-purple-500/70 transform transition-all duration-300 ${contentAnimationClass} animate-modal-pulse-border-glow`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="text-center">
            <SparklesIcon className="w-12 h-12 text-yellow-300 opacity-90 mx-auto mb-4 animate-sparkles-pulse" />
            <h2 id="upgrade-modal-title" className="text-2xl font-bold text-white mb-3">
                Unlock More Power!
            </h2>
        </div>
        
        <p className="text-purple-200/90 mb-8 text-center text-sm leading-relaxed">
          {reason} Upgrade your plan to continue enjoying all features without limits.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ring-offset-2 ring-offset-purple-700 focus:ring-white button-active-pop"
            aria-label="Maybe Later"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 ring-offset-2 ring-offset-purple-700 focus:ring-yellow-300 button-active-pop button-hover-glow flex items-center justify-center gap-2"
            aria-label="Upgrade Now"
          >
            Upgrade Plan <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
