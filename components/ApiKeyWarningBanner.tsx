
import React from 'react';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';


const ApiKeyWarningBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-red-700 via-pink-800 to-purple-900/80 border border-red-600/70 text-white px-4 py-4 rounded-lg relative mb-8 shadow-2xl shadow-red-500/30" role="alert">
      <div className="flex items-center">
        <AlertTriangleIcon className="w-7 h-7 mr-4 text-yellow-300 flex-shrink-0" />
        <div className="flex-grow">
          <strong className="font-bold text-lg block mb-1">API Key Alert!</strong>
          <span className="block text-sm opacity-90">The Gemini API key (process.env.API_KEY) is not configured. AI-powered task ranking will be disabled. Please ensure it's set up correctly.</span>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyWarningBanner;
