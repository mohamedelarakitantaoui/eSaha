import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, ChevronDown } from 'lucide-react';
import { SupportQuestionCard } from './SupportQuestionCard';
import { Button } from './Button';
// Make sure to export the component properly

import useAuth from '../contexts/useAuth';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Example support questions
  const supportQuestions = [
    "I'm feeling overwhelmed, what should I do?",
    'Can you help me with breathing exercises?',
  ];

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setShowWelcome(false);
    setIsLoading(true);

    try {
      // Here you would integrate with your chat API
      // For now, simulate a response after a delay
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Thank you for sharing. I understand you said: "${text.trim()}". How can I help you further with this?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleSupportQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {showWelcome ? (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Hi there, {user?.email?.split('@')[0] || 'Friend'}
              </h1>
              <p className="mt-2 text-gray-600">How can I support you today?</p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {supportQuestions.map((question, index) => (
                <SupportQuestionCard
                  key={index}
                  question={question}
                  onClick={() => handleSupportQuestionClick(question)}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p>{message.text}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'user'
                        ? 'text-indigo-200'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 bg-white"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your thoughts or questions..."
              className="w-full py-3 px-4 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Paperclip size={20} />
            </button>
          </div>

          <div className="flex-shrink-0">
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-3 flex items-center gap-2"
            >
              <span>Send</span>
              <Send size={16} />
            </Button>
          </div>
        </div>

        {/* Optional Mode Selector */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="text-sm flex items-center gap-1 text-gray-500 hover:text-indigo-600"
          >
            <span>Daily Support</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};

// Only export as default, don't create a named export
export default ChatInterface;
