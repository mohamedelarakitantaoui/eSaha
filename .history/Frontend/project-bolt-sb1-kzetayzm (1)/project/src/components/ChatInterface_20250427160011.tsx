import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, ChevronDown, X, MessageSquare } from 'lucide-react';
import { SupportQuestionCard } from './SupportQuestionCard';
import { Button } from './Button';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
  sessionId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
  sessionId,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);
  // Store the session ID (for conversation continuity)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    sessionId
  );
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, getToken } = useAuth();

  // Example support questions
  const supportQuestions = [
    "I'm feeling overwhelmed, what should I do?",
    'Can you help me with breathing exercises?',
    'How can I manage my anxiety at work?',
    'I need help improving my sleep quality',
  ];

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Create a new session ID if one doesn't exist
  useEffect(() => {
    if (!currentSessionId) {
      // Generate a unique session ID
      const newSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      console.log('Created new session ID:', newSessionId);
      setCurrentSessionId(newSessionId);
    }
  }, [currentSessionId]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    setIsError(false);
    setErrorMessage('');

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
      // Get token for authentication
      const token = await getToken();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Log to aid debugging
      console.log('Sending message:', text.trim());
      console.log('Using session ID:', currentSessionId);

      // Call API to send message and get response, including session ID
      const response = await API.chat.sendMessage(
        token,
        text.trim(),
        'General',
        currentSessionId
      );
      console.log('Received response:', response);

      // Add bot response to messages
      const botMessage: Message = {
        id: response._id || Date.now().toString(),
        sender: 'bot',
        text: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsError(true);
      setErrorMessage(
        'Sorry, I encountered an error processing your message. Please try again later.'
      );

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an error processing your message. Please try again later.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
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

  const handleStartNewSession = () => {
    // Generate a new session ID
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setShowWelcome(true);
    console.log('Started new session with ID:', newSessionId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Session Status Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">
            {messages.length > 0 ? 'Active Session' : 'New Session'}
          </span>
        </div>
        <Button
          variant="secondary"
          className="text-xs py-1 px-2 flex items-center gap-1"
          onClick={handleStartNewSession}
        >
          <X size={14} />
          <span>Start New</span>
        </Button>
      </div>

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

        {/* Session status indicator */}
        <div className="mt-2 flex justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isError ? 'bg-red-500' : 'bg-green-500'
              }`}
            ></span>
            {currentSessionId
              ? 'Conversation memory active'
              : 'Starting new conversation'}
          </div>
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

export default ChatInterface;
