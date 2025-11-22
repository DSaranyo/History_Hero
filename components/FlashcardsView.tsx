
import React, { useState, useCallback, useEffect } from 'react';
import { Flashcard } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GenerateButton } from './common/GenerateButton';
import { ErrorMessage } from './common/ErrorMessage';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

interface FlashcardsViewProps {
  text: string;
  data: Flashcard[] | null;
  setData: (data: Flashcard[] | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ text, data, setData, isLoading, setLoading }) => {
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    const result = await geminiService.generateFlashcards(text);
    if (result) {
      setData(result);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else {
      setError("Failed to generate flashcards. Please try again.");
    }
    setLoading(false);
  }, [text, setLoading, setData]);

  useEffect(() => {
    if (text && !data && !isLoading) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % (data?.length || 1)), 150);
  };
  
  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + (data?.length || 1)) % (data?.length || 1)), 150);
  };
  
  const card = data?.[currentIndex];
  
  const renderCardContent = (content: string, isAnswer: boolean) => {
    if (card?.type === 'fill_up' && !isAnswer) {
      return content.split('___').map((part, i, arr) => 
        i < arr.length - 1 ? <span key={i}>{part}<span className="font-bold text-blue-500">___</span></span> : <span key={i}>{part}</span>
      );
    }
    return content;
  };

  if (isLoading) return <LoadingSpinner message="Creating your flashcards..." />;
  if (error) return <ErrorMessage message={error}/>;

  if (!data || !card) {
    return <GenerateButton onClick={handleGenerate} disabled={!text || isLoading} text="Generate Flashcards" />;
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
        <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
            <div
                className={`relative w-full h-80 rounded-lg shadow-xl transition-transform duration-500 cursor-pointer`}
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front of card */}
                <div className="absolute w-full h-full bg-white dark:bg-gray-700 rounded-lg p-6 flex flex-col justify-center items-center text-center" style={{ backfaceVisibility: 'hidden' }}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">{card.type.replace('_', ' ')}</p>
                    <div className="text-xl md:text-2xl font-semibold my-4">{renderCardContent(card.question, false)}</div>
                    {card.type === 'mcq' && (
                        <div className="grid grid-cols-2 gap-4 w-full mt-4">
                            {card.options?.map((option, i) => (
                                <div key={i} className="p-2 border rounded-md text-sm">{option}</div>
                            ))}
                        </div>
                    )}
                     <div className="absolute bottom-4 text-sm text-gray-400 flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Click to flip</div>
                </div>
                {/* Back of card */}
                <div className="absolute w-full h-full bg-blue-100 dark:bg-blue-900/50 rounded-lg p-6 flex justify-center items-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{card.answer}</p>
                    <div className="absolute bottom-4 text-sm text-blue-500 dark:text-blue-400 flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Click to flip</div>
                </div>
            </div>
        </div>
        <div className="mt-8 flex items-center justify-between w-full max-w-2xl">
            <button onClick={handlePrev} className="p-3 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                <ArrowLeft />
            </button>
            <p className="font-semibold text-lg">{currentIndex + 1} / {data.length}</p>
            <button onClick={handleNext} className="p-3 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                <ArrowRight />
            </button>
        </div>
    </div>
  );
};
