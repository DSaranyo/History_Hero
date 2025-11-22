
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorMessage: React.FC<{ message?: string }> = ({ message = "Something went wrong. Please try again." }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <p className="mt-4 text-lg font-semibold text-red-700 dark:text-red-300">Oops!</p>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
};
