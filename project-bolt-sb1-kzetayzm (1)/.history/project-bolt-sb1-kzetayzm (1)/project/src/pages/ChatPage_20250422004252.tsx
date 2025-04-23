import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { ChatInterface } from '../components';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

// Define the Message type
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchChatHistory = async () => {
      try {
        const token = await getToken();
        if (!token) {
          console.error('No authentication token available');
          return;
        }

        // Use your API service to fetch chat history
        const data = await API.chat.getHistory(token);

        // Transform the data to match our Message interface
        const formattedMessages = data.flatMap((chat: any) => {
          const messages: Message[] = [];

          // Add user message
          messages.push({
            id: `${chat._id}-user`,
            sender: 'user',
            text: chat.message,
            timestamp: new Date(chat.timestamp),
          });

          // Add bot response if it exists
          if (chat.response) {
            messages.push({
              id: `${chat._id}-bot`,
              sender: 'bot',
              text: chat.response,
              timestamp: new Date(chat.timestamp),
            });
          }

          return messages;
        });

        setInitialMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [user, navigate, getToken]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="h-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <ChatInterface initialMessages={initialMessages} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
