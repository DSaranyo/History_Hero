
import React from 'react';
import { Sparkles } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  text?: string;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, disabled, text = "Generate" }) => {
  return (
    <div className="text-center my-8">
      <button
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform transition-transform hover:scale-105"
      >
        <Sparkles className="w-5 h-5 mr-2 -ml-1" />
        {text}
      </button>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Click to generate insights from your text.
      </p>
    </div>
  );
};
