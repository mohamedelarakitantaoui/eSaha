import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { ChatInterface } from '../components';
import useAuth from '../contexts/useAuth';
import API from '../services/api';
import { ChatMessage } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewSession = location.pathname === '/chat/new';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If it's a new session, clear messages and generate a new session ID
    if (isNewSession) {
      console.log('Creating new chat session...');
      setInitialMessages([]);
      const newSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      console.log('Generated new session ID:', newSessionId);
      setSessionId(newSessionId);
      setIsLoading(false);
      return;
    }

    const fetchChatHistory = async () => {
      try {
        const token = await getToken();
        if (!token) {
          console.error('No authentication token available');
          setIsLoading(false);
          return;
        }

        // Use your API service to fetch chat history
        console.log('Fetching chat history...');
        const data = await API.chat.getHistory(token);
        console.log('Received chat history:', data);

        // Get the session ID from the first message if available
        if (data.length > 0 && data[0].session_id) {
          console.log('Found session ID in chat history:', data[0].session_id);
          setSessionId(data[0].session_id);
        } else {
          // Generate a new session ID if none found
          const newSessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;
          console.log('Created new session ID:', newSessionId);
          setSessionId(newSessionId);
        }

        // Transform the data to match our Message interface
        const formattedMessages = data.flatMap((chat: ChatMessage) => {
          const messages: Message[] = [];

          // Make sure timestamp is properly handled
          const timestamp =
            typeof chat.timestamp === 'string'
              ? new Date(chat.timestamp)
              : new Date();

          // Add user message
          messages.push({
            id: `${chat._id}-user`,
            sender: 'user',
            text: chat.message,
            timestamp: timestamp,
          });

          // Add bot response if it exists
          if (chat.response) {
            messages.push({
              id: `${chat._id}-bot`,
              sender: 'bot',
              text: chat.response,
              timestamp: timestamp,
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
  }, [user, navigate, getToken, isNewSession, location.pathname]);

  // Add a debugging function you can call from the browser console
  useEffect(() => {
    // @ts-ignore - Making this available in the global window object for debugging
    window.debugChatSession = async () => {
      try {
        const token = await getToken();
        if (!token) {
          console.error('No token available');
          return;
        }

        console.log('Current session ID:', sessionId);

        // Try to get sessions if the API supports it
        try {
          const sessions = await API.chat.getSessions(token);
          console.log('Available sessions:', sessions);
        } catch (e) {
          console.log('Could not fetch sessions:', e);
        }

        // Basic status info
        return {
          sessionId,
          isNewSession,
          messagesCount: initialMessages.length,
          path: location.pathname,
        };
      } catch (e) {
        console.error('Debug error:', e);
        return { error: String(e) };
      }
    };

    return () => {
      // @ts-ignore - Clean up
      delete window.debugChatSession;
    };
  }, [sessionId, initialMessages, isNewSession, location.pathname, getToken]);

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
          <ChatInterface
            initialMessages={initialMessages}
            sessionId={sessionId}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
