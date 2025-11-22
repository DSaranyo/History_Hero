
import React, { useCallback, useEffect } from 'react';
import { TimelineEvent } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GenerateButton } from './common/GenerateButton';
import { ErrorMessage } from './common/ErrorMessage';

interface TimelineViewProps {
  text: string;
  data: TimelineEvent[] | null;
  setData: (data: TimelineEvent[] | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ text, data, setData, isLoading, setLoading }) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    const result = await geminiService.generateTimeline(text);
    if (result) {
      setData(result);
    } else {
      setError("Failed to generate timeline. The AI model might be busy. Please try again.");
    }
    setLoading(false);
  }, [text, setLoading, setData]);
  
  useEffect(() => {
    if (text && !data && !isLoading) {
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <LoadingSpinner message="Constructing your timeline..." />;
  if (error) return <ErrorMessage message={error}/>;

  if (!data) {
    return <GenerateButton onClick={handleGenerate} disabled={!text || isLoading} text="Generate Timeline" />;
  }

  return (
    <div className="relative animate-fade-in">
      <h2 className="text-xl font-bold text-center mb-8">Historical Timeline</h2>
      <div className="flex overflow-x-auto space-x-8 pb-8 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 dark:bg-gray-600 transform -translate-y-1/2"></div>
        {data.map((item, index) => (
          <div key={index} className="relative z-10 flex-shrink-0 w-72">
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-4 border-white dark:border-gray-800"></div>
            <div className={`${index % 2 === 0 ? 'mb-8 -mt-4' : 'mt-12'} transform ${index % 2 === 0 ? 'translate-y-[-50%]' : 'translate-y-[-50%]'}`}>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.year}</p>
                <p className="font-semibold my-1">{item.event}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.impact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
