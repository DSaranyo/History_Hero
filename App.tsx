
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Tabs, Tab } from './components/Tabs';
import { SummaryView } from './components/SummaryView';
import { TimelineView } from './components/TimelineView';
import { FlashcardsView } from './components/FlashcardsView';
import { MindmapView } from './components/MindmapView';
import { QuizView } from './components/QuizView';
import { ChatView } from './components/ChatView';
import { Summary, TimelineEvent, Flashcard, MindmapNode, Quiz } from './types';
import { BookOpen, Clock, Layers, MessageSquare, BrainCircuit, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Summary');
  const [inputText, setInputText] = useState('');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[] | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [mindmapData, setMindmapData] = useState<MindmapNode | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  
  const [loadingStates, setLoadingStates] = useState({
    Summary: false,
    Timeline: false,
    Flashcards: false,
    Mindmap: false,
    Quiz: false,
  });

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Reset generated content when text changes
    setSummary(null);
    setTimelineEvents(null);
    setFlashcards(null);
    setMindmapData(null);
    setQuiz(null);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  const tabs: Tab[] = [
    { name: 'Summary', icon: BookOpen },
    { name: 'Timeline', icon: Clock },
    { name: 'Flashcards', icon: Layers },
    { name: 'Mindmap', icon: BrainCircuit },
    { name: 'Quiz', icon: HelpCircle },
    { name: 'Chat with Figures', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Summary':
        return <SummaryView text={inputText} data={summary} setData={setSummary} isLoading={loadingStates.Summary} setLoading={(val) => setLoadingStates(s => ({...s, Summary: val}))} />;
      case 'Timeline':
        return <TimelineView text={inputText} data={timelineEvents} setData={setTimelineEvents} isLoading={loadingStates.Timeline} setLoading={(val) => setLoadingStates(s => ({...s, Timeline: val}))} />;
      case 'Flashcards':
        return <FlashcardsView text={inputText} data={flashcards} setData={setFlashcards} isLoading={loadingStates.Flashcards} setLoading={(val) => setLoadingStates(s => ({...s, Flashcards: val}))} />;
      case 'Mindmap':
        return <MindmapView text={inputText} data={mindmapData} setData={setMindmapData} isLoading={loadingStates.Mindmap} setLoading={(val) => setLoadingStates(s => ({...s, Mindmap: val}))} />;
      case 'Quiz':
        return <QuizView text={inputText} data={quiz} setData={setQuiz} isLoading={loadingStates.Quiz} setLoading={(val) => setLoadingStates(s => ({...s, Quiz: val}))} />;
      case 'Chat with Figures':
        return <ChatView />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Enter Your History Chapter</h2>
          <textarea
            value={inputText}
            onChange={handleTextChange}
            placeholder="Paste your history text here to bring it to life..."
            className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
          />
        </div>

        <div className="mt-8">
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-1 bg-white dark:bg-gray-800 rounded-b-2xl shadow-lg p-6 md:p-8 min-h-[400px]">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
