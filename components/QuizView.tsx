
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Quiz, MCQ, ShortAnswer, OneWordAnswer } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GenerateButton } from './common/GenerateButton';
import { ErrorMessage } from './common/ErrorMessage';
import { Check, X } from 'lucide-react';

interface QuizViewProps {
    text: string;
    data: Quiz | null;
    setData: (data: Quiz | null) => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

type AllQuestion = (MCQ & { type: 'mcq' }) | (ShortAnswer & { type: 'short' }) | (OneWordAnswer & { type: 'one-word' }) | ({ question: string, answer_guideline: string, type: 'long' });

export const QuizView: React.FC<QuizViewProps> = ({ text, data, setData, isLoading, setLoading }) => {
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
    const [feedback, setFeedback] = useState<{[key: number]: boolean | null}>({});
    const [quizStarted, setQuizStarted] = useState(false);

    const allQuestions = useMemo<AllQuestion[]>(() => {
        if (!data) return [];
        return [
            ...data.mcqs.map(q => ({ ...q, type: 'mcq' as const })),
            ...data.short_answers.map(q => ({ ...q, type: 'short' as const })),
            ...data.one_word_questions.map(q => ({ ...q, type: 'one-word' as const })),
            { ...data.long_answer_question, type: 'long' as const }
        ];
    }, [data]);

    const handleGenerate = useCallback(async () => {
        if (!text) return;
        setLoading(true);
        setError(null);
        setQuizStarted(false);
        const result = await geminiService.generateQuiz(text);
        if (result) {
            setData(result);
            setCurrentQuestionIndex(0);
            setScore(0);
            setUserAnswers({});
            setFeedback({});
        } else {
            setError("Failed to generate quiz. Please try again.");
        }
        setLoading(false);
    }, [text, setLoading, setData]);

    useEffect(() => {
        if (text && !data && !isLoading) {
          handleGenerate();
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    

    const handleAnswer = (answer: string) => {
        if (feedback[currentQuestionIndex] !== undefined) return;

        setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
        const currentQuestion = allQuestions[currentQuestionIndex];
        let isCorrect = false;
        if(currentQuestion.type === 'mcq' || currentQuestion.type === 'one-word') {
            isCorrect = answer.toLowerCase() === (currentQuestion as MCQ | OneWordAnswer).answer.toLowerCase();
        } else {
            // For short/long answers, we can't auto-grade, so we just mark it as seen
            isCorrect = true; 
        }

        setFeedback(prev => ({ ...prev, [currentQuestionIndex]: isCorrect }));
        if (isCorrect) setScore(s => s + 1);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        }
    };
    
    const resetQuiz = () => {
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setScore(0);
        setUserAnswers({});
        setFeedback({});
    }

    if (isLoading) return <LoadingSpinner message="Preparing your quiz..." />;
    if (error) return <ErrorMessage message={error}/>;

    if (!data) {
        return <GenerateButton onClick={handleGenerate} disabled={!text || isLoading} text="Generate Quiz" />;
    }
    
    if (!quizStarted) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold">Quiz is Ready!</h2>
                <p className="my-4">Test your knowledge with {allQuestions.length} questions generated from your text.</p>
                <button onClick={() => setQuizStarted(true)} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition">
                    Start Quiz
                </button>
            </div>
        )
    }

    if (currentQuestionIndex >= allQuestions.length) {
        const gradedQuestions = allQuestions.filter(q => q.type === 'mcq' || q.type === 'one-word').length;
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold">Quiz Complete!</h2>
                <p className="my-4 text-xl">Your score: <span className="font-bold text-blue-500">{score} / {gradedQuestions}</span></p>
                <p className="text-gray-500">(Short and long answers are not auto-graded)</p>
                <button onClick={resetQuiz} className="mt-6 px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition">
                    Try Again
                </button>
            </div>
        )
    }

    const currentQuestion = allQuestions[currentQuestionIndex];
    const answered = feedback[currentQuestionIndex] !== undefined;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-gray-500">Question {currentQuestionIndex + 1} of {allQuestions.length}</span>
                <span className="text-sm font-semibold text-blue-500">Score: {score}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg shadow-inner">
                <p className="text-lg font-semibold mb-4">{currentQuestion.question}</p>
                {currentQuestion.type === 'mcq' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentQuestion.options.map((option, i) => {
                            const isSelected = userAnswers[currentQuestionIndex] === option;
                            const isCorrect = option === currentQuestion.answer;
                            let buttonClass = 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
                            if (answered && isCorrect) {
                                buttonClass = 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-500';
                            } else if (answered && isSelected && !isCorrect) {
                                buttonClass = 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border-red-500';
                            }
                            return (
                            <button key={i} onClick={() => handleAnswer(option)} disabled={answered} className={`w-full text-left p-3 border rounded-lg transition-all ${buttonClass}`}>
                                {option}
                            </button>
                        )})}
                    </div>
                )}
                {(currentQuestion.type === 'short' || currentQuestion.type === 'one-word' || currentQuestion.type === 'long') && (
                    <form onSubmit={(e)=>{e.preventDefault(); handleAnswer(userAnswers[currentQuestionIndex] || '')}}>
                        <input type="text"
                         value={userAnswers[currentQuestionIndex] || ''}
                         onChange={(e) => setUserAnswers(p => ({...p, [currentQuestionIndex]: e.target.value}))}
                         disabled={answered}
                         placeholder={currentQuestion.type === 'one-word' ? "One word answer" : "Type your answer here"}
                         className="w-full p-2 border rounded bg-white dark:bg-gray-600" />
                        {!answered && <button type="submit" className="mt-3 px-4 py-2 bg-blue-500 text-white rounded">Submit</button>}
                    </form>
                )}
                {answered && (
                    <div className="mt-4 p-3 rounded-lg flex items-center bg-opacity-20 text-opacity-80
                        ${feedback[currentQuestionIndex] ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}">
                        {feedback[currentQuestionIndex] ? <Check className="w-5 h-5 mr-2" /> : <X className="w-5 h-5 mr-2" />}
                        {currentQuestion.type === 'mcq' && `Correct Answer: ${currentQuestion.answer}`}
                        {currentQuestion.type === 'one-word' && `Correct Answer: ${currentQuestion.answer}`}
                        {currentQuestion.type === 'short' && `Answer Hint: ${currentQuestion.answer_hint}`}
                        {currentQuestion.type === 'long' && `Answer Guideline: ${currentQuestion.answer_guideline}`}
                    </div>
                )}
            </div>
            {answered && currentQuestionIndex < allQuestions.length -1 && (
                <div className="text-center mt-6">
                    <button onClick={handleNextQuestion} className="px-6 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-800">Next Question</button>
                </div>
            )}
            {answered && currentQuestionIndex === allQuestions.length -1 && (
                 <div className="text-center mt-6">
                    <button onClick={() => setCurrentQuestionIndex(i => i + 1)} className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700">Finish Quiz</button>
                </div>
            )}
        </div>
    );
};
