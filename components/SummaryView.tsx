
import React, { useCallback, useEffect } from 'react';
import { Summary } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GenerateButton } from './common/GenerateButton';
import { ErrorMessage } from './common/ErrorMessage';
import { FileText, Calendar, Users, GitCommit } from 'lucide-react';

interface SummaryViewProps {
  text: string;
  data: Summary | null;
  setData: (data: Summary | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
        <h3 className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        {children}
    </div>
);

export const SummaryView: React.FC<SummaryViewProps> = ({ text, data, setData, isLoading, setLoading }) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    const result = await geminiService.generateSummary(text);
    if (result) {
      setData(result);
    } else {
      setError("Failed to generate summary. The AI model might be busy. Please try again.");
    }
    setLoading(false);
  }, [text, setLoading, setData]);

  useEffect(() => {
    if (text && !data && !isLoading) {
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <LoadingSpinner message="Crafting your summary..." />;
  if (error) return <ErrorMessage message={error}/>;

  if (!data) {
    return <GenerateButton onClick={handleGenerate} disabled={!text || isLoading} text="Generate Summary" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h2 className="flex items-center text-xl font-bold text-blue-800 dark:text-blue-200 mb-2"><FileText className="mr-2" /> 5-Line Summary</h2>
            <p className="text-gray-700 dark:text-gray-300">{data.summary_5_lines}</p>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-6">Key Points</h2>
        <ul className="list-disc list-inside space-y-2 pl-4 text-gray-700 dark:text-gray-300">
            {data.key_points.map((point, i) => <li key={i}>{point}</li>)}
        </ul>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
            <InfoCard title="Important Dates" icon={<Calendar/>}>
                <ul className="space-y-2">
                    {data.important_dates.map((item, i) => <li key={i}><strong className="font-semibold">{item.date}:</strong> {item.event}</li>)}
                </ul>
            </InfoCard>
            <InfoCard title="Important People" icon={<Users/>}>
                <ul className="space-y-2">
                    {data.important_people.map((item, i) => <li key={i}><strong className="font-semibold">{item.name}:</strong> {item.significance}</li>)}
                </ul>
            </InfoCard>
        </div>
        
        <InfoCard title="Cause & Effect" icon={<GitCommit/>}>
             <ul className="space-y-3">
                {data.cause_effect.map((item, i) => (
                    <li key={i} className="flex flex-col md:flex-row">
                        <div className="md:w-1/2 pr-2"><strong className="font-semibold text-red-600 dark:text-red-400">Cause:</strong> {item.cause}</div>
                        <div className="md:w-1/2 pl-2 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-600 mt-1 pt-1 md:mt-0 md:pt-0"><strong className="font-semibold text-green-600 dark:text-green-400">Effect:</strong> {item.effect}</div>
                    </li>
                ))}
            </ul>
        </InfoCard>
    </div>
  );
};
