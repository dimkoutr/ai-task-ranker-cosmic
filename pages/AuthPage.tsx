import React, { useState, useEffect } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animateError, setAnimateError] = useState(false);

  const formElements = [
    { id: 'username', label: 'Username', type: 'text', value: username, setter: setUsername, placeholder: 'e.g., cosmic_voyager' },
    { id: 'password', label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: 'Enter your secret code' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAnimateError(false);
    setIsLoading(true);

    try {
      if (isSigningUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        const user = await authService.signUp(username, password);
        onLoginSuccess(user);
      } else {
        const user = await authService.signIn(username, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      setError((err as Error).message);
      setAnimateError(true); // Trigger shake animation
      setTimeout(() => setAnimateError(false), 600); // Reset animation state
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFormMode = () => {
    setIsSigningUp(!isSigningUp);
    setError(null);
    setAnimateError(false);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };
  
  // Unique key for the form to ensure re-animation on mode switch
  const formKey = isSigningUp ? 'signup-form' : 'signin-form';

  return (
    <div className="page-container-flex">
      <main className="page-content-scrollable flex flex-col items-center justify-center p-4">
        <div 
            className="w-full max-w-md bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-8 md:p-10 border auth-card-pulsing"
        >
          <div className="text-center mb-8 animate-fadeInUp" style={{ animationDelay: '0ms' }}>
            <h1 className="text-4xl sm:text-5xl font-bold text-gradient-sky-rose-lime flex items-center justify-center gap-x-3">
              <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 opacity-80 animate-sparkles-pulse" />
              {isSigningUp ? 'Join the Cosmos' : 'Welcome Back'}
              <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400 opacity-80 animate-sparkles-pulse [animation-delay:-1s]" />
            </h1>
            <p className="text-text-secondary mt-3 text-base">
              {isSigningUp ? 'Create your celestial account.' : 'Access your AI-powered task lists.'}
            </p>
          </div>

          {error && (
            <div 
              className={`bg-red-500/30 border border-red-600 text-red-200 p-3.5 rounded-lg mb-6 text-sm shadow-md ${animateError ? 'animate-shake-error' : ''}`} 
              role="alert"
            >
              {error}
            </div>
          )}

          <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
            {formElements.map((el, index) => (
              <div 
                key={el.id} 
                className="animate-fadeInUp" 
                style={{ animationDelay: `${100 + index * 100}ms` }}
              >
                <label htmlFor={el.id} className="block text-sm font-medium text-text-accent mb-1.5">
                  {el.label}
                </label>
                <input
                  id={el.id}
                  type={el.type}
                  value={el.value}
                  onChange={(e) => el.setter(e.target.value)}
                  required
                  className="w-full p-3.5 bg-input-bg border border-input-border rounded-lg focus:ring-0 outline-none transition-all duration-300 shadow-sm placeholder-input-placeholder text-input-text input-focus-glow"
                  placeholder={el.placeholder}
                  disabled={isLoading}
                />
              </div>
            ))}
            
            {isSigningUp && (
              <div 
                className="animate-fadeInUp" // Re-uses fadeInUp for consistent entry, key on form helps reset
                style={{ animationDelay: `${100 + formElements.length * 100}ms` }}
              >
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-accent mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3.5 bg-input-bg border border-input-border rounded-lg focus:ring-0 outline-none transition-all duration-300 shadow-sm placeholder-input-placeholder text-input-text input-focus-glow"
                  placeholder="Repeat your cosmic code"
                  disabled={isLoading}
                />
              </div>
            )}

            <div 
              className="pt-2 animate-fadeInUp" 
              style={{ animationDelay: `${200 + (isSigningUp ? formElements.length + 1 : formElements.length) * 100}ms` }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full button-primary text-white font-semibold py-3.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 button-active-pop button-hover-glow flex items-center justify-center min-h-[50px]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner className="w-5 h-5 mr-3 text-white" />
                    Processing...
                  </div>
                ) : (isSigningUp ? 'Create Cosmic Account' : 'Enter the Cosmos')}
              </button>
            </div>
          </form>
          <div 
            className="mt-8 text-center animate-fadeInUp" 
            style={{ animationDelay: `${300 + (isSigningUp ? formElements.length + 1 : formElements.length) * 100}ms` }}
          >
            <button
              onClick={toggleFormMode}
              disabled={isLoading}
              className="text-text-accent hover:text-text-accent-hover text-sm transition-colors duration-200 hover:underline disabled:opacity-70"
            >
              {isSigningUp
                ? 'Already a Cosmic Voyager? Sign In'
                : "New to the Universe? Sign Up"}
            </button>
          </div>
        </div>
      </main>
      <footer className="page-footer-area text-center py-5 text-text-muted text-xs opacity-80 animate-fadeInUp" style={{ animationDelay: '800ms' }}>
         <p>AI Task Ranker &copy; {new Date().getFullYear()} - Cosmic Edition ✨</p>
      </footer>
    </div>
  );
};

export default AuthPage;
