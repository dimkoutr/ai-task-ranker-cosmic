import React, { useEffect, useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon'; // Import SparklesIcon

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonType?: 'primary' | 'danger'; // New prop
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonType = 'primary', // Default to 'primary'
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

  const handleConfirmClick = () => {
    onConfirm();
  };
  
  let confirmButtonClasses = 'w-full sm:w-auto px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 button-active-pop button-hover-glow ';
  if (confirmButtonType === 'danger') {
    confirmButtonClasses += 'button-danger-solid focus:ring-red-400'; // Use specific danger styles
  } else {
    confirmButtonClasses += 'button-primary text-white focus:ring-pink-400'; // Default primary button
  }


  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm ${animationClass}`}
      onClick={onClose} 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-surface-interactive/80 shadow-secondary rounded-xl w-full max-w-md p-6 md:p-8 border border-border-secondary transform transition-all duration-300 ${contentAnimationClass} animate-modal-pulse-border-glow`}
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 id="modal-title" className="text-2xl font-semibold text-gradient-purple-pink-sky mb-5 text-center flex items-center justify-center gap-2">
          <SparklesIcon className="w-5 h-5 text-yellow-400/80 animate-sparkles-pulse [animation-delay:-0.3s]" />
          {title}
          <SparklesIcon className="w-5 h-5 text-pink-400/80 animate-sparkles-pulse [animation-delay:-0.7s]" />
        </h2>
        <p className="text-text-secondary mb-8 text-center text-sm leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-lg button-secondary font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 button-active-pop"
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirmClick}
            className={confirmButtonClasses}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;