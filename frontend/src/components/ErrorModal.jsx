import React, { useEffect } from 'react';
import {
  AlertTriangle,
  XCircle,
  Ban,
  CloudOff,
  SearchX,
  X
} from 'lucide-react';

const errorTypes = {
  openaiQuota: {
    title: "OpenAI Quota Exceeded",
    description: "Your OpenAI API quota has been exceeded. Please check your subscription or try again later.",
    icon: AlertTriangle
  },
  embeddings: {
    title: "Embedding Generation Failed",
    description: "Failed to generate embeddings for your search query. This could be due to service unavailability or invalid input.",
    icon: XCircle
  },
  database: {
    title: "Database Connection Error",
    description: "Failed to connect to one or more databases. Please try again later or contact support if the problem persists.",
    icon: Ban
  },
  network: {
    title: "Network Error",
    description: "A network error occurred while processing your search. Please check your internet connection and try again.",
    icon: CloudOff
  },
  generic: {
    title: "Search Error",
    description: "An error occurred while processing your search. Please try again later.",
    icon: SearchX
  }
};

const ErrorModal = ({ isOpen, onClose, errorType = 'generic', customMessage }) => {
  const error = errorTypes[errorType] || errorTypes.generic;
  const Icon = error.icon;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-md transform rounded-lg bg-white p-6 text-left shadow-xl transition-all duration-300 scale-100 opacity-100 sm:my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Icon className="h-6 w-6 text-red-600" />
          </div>
          <h3 id="modal-title" className="text-xl font-semibold mb-2">{error.title}</h3>
          <div className="text-gray-600 mt-2">{customMessage || error.description}</div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="py-2 px-10 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
