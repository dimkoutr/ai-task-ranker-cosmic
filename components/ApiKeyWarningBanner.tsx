
import React from 'react';
import { isApiConfigured } from '../services/geminiService';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

const ApiKeyWarningBanner: React.FC = () => {
  if (isApiConfigured()) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[1000] p-3 bg-danger-bg text-danger-text border-b border-danger-border shadow-lg flex items-center justify-center gap-3"
      role="alert"
    >
      <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
      <p className="text-sm font-medium">
        <strong>AI Features Disabled:</strong> The Gemini API Key is not configured.
        Please ensure the <code>API_KEY</code> environment variable is set correctly during the build process or in your deployment settings.
        AI-powered task ranking will not function until this is resolved.
      </p>
    </div>
  );
};

export default ApiKeyWarningBanner;
