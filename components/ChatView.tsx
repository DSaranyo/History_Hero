
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HISTORICAL_FIGURES } from '../constants';
import { HistoricalFigure, ChatMessage } from '../types';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { Send, User, Bot } from 'lucide-react';

const API_KEY = process.env.API_KEY;

export const ChatView: React.FC = () => {
    const [selectedFigure, setSelectedFigure] = useState<HistoricalFigure>(HISTORICAL_FIGURES[0]);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const startChat = useCallback(() => {
        if (!API_KEY) {
            console.error("API Key not found");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: selectedFigure.prompt,
                temperature: 0.7,
                maxOutputTokens: 2000,
            }
        });
        setChatSession(newChat);
        setMessages([]);
    }, [selectedFigure]);

    useEffect(() => {
        startChat();
    }, [selectedFigure, startChat]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatSession) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const responseStream = await chatSession.sendMessageStream({ message: userInput });
            
            let aiResponseText = '';
            setMessages(prev => [...prev, { sender: 'ai', text: '...' }]); 

            for await (const chunk of responseStream) {
                const c = chunk as GenerateContentResponse;
                aiResponseText += c.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { sender: 'ai', text: aiResponseText };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "I seem to be lost in time... please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[70vh] gap-6 animate-fade-in">
            <div className="md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 pr-4 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Choose a Figure</h3>
                <div className="space-y-2">
                    {HISTORICAL_FIGURES.map(figure => (
                        <button
                            key={figure.name}
                            onClick={() => setSelectedFigure(figure)}
                            className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${selectedFigure.name === figure.name ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                        >
                            <img src={figure.imageUrl} alt={figure.name} className="w-10 h-10 rounded-full mr-3"/>
                            <span className="font-medium">{figure.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <img src={selectedFigure.imageUrl} alt={selectedFigure.name} className="w-12 h-12 rounded-full mr-4"/>
                    <div>
                        <h2 className="text-xl font-bold">{selectedFigure.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ask me anything about my life and times.</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><Bot size={20}/></div>}
                            <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"><User size={20}/></div>}
                        </div>
                    ))}
                    {isLoading && messages[messages.length-1].sender === 'user' && (
                       <div className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><Bot size={20}/></div>
                            <div className="max-w-md p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                       </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={`Message ${selectedFigure.name}...`}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400">
                        <Send />
                    </button>
                </form>
            </div>
        </div>
    );
};
