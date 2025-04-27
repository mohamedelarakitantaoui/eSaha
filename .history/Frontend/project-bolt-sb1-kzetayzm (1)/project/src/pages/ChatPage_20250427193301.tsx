import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  const [error, setError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('New Chat');
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Check if we're creating a new session or loading an existing one
  const isNewSession = location.pathname === '/chat/new';
  const existingSessionId = params.sessionId;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const initializeChat = async () => {
      try {
        setError(null);
        const token = await getToken();
        if (!token) {
          console.error('No authentication token available');
          setError('Authentication error. Please log in again.');
          setIsLoading(false);
          return;
        }

        // If it's a new session, clear messages and create a new session
        if (isNewSession) {
          console.log('Creating new chat session...');
          setInitialMessages([]);

          // Generate a new unique session ID
          const newSessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;
          console.log('Generated new session ID:', newSessionId);

          try {
            // Register this session with the backend
            const sessionData = await API.chat.createSession(
              token,
              newSessionId,
              'New Chat'
            );
            console.log('Session created successfully:', sessionData);

            // Set the session ID in state
            setSessionId(newSessionId);
          } catch (error) {
            console.error('Error creating new session:', error);
            setError('Could not create a new session. Please try again.');
          } finally {
            setIsLoading(false);
          }
          return;
        }

        // If we have a session ID from the URL, load that session
        if (existingSessionId) {
          console.log('Loading existing session:', existingSessionId);
          try {
            // Get messages for this specific session
            const sessionMessages = await API.chat.getSessionHistory(
              token,
              existingSessionId
            );
            console.log('Received session messages:', sessionMessages);

            // Also fetch the session details to get the title
            try {
              const sessionDetails = await API.chat.getSessionDetails(
                token,
                existingSessionId
              );
              if (sessionDetails && sessionDetails.title) {
                setSessionTitle(sessionDetails.title);
              }
            } catch (error) {
              console.error('Error fetching session details:', error);
              // Not critical, continue with default title
            }

            // Transform to the Message interface format
            const formattedMessages = sessionMessages.flatMap(
              (chat: ChatMessage) => {
                const messages: Message[] = [];
                const timestamp = new Date(chat.timestamp);

                // Add user message
                messages.push({
                  id: `${chat._id}-user`,
                  sender: 'user',
                  text: chat.message,
                  timestamp,
                });

                // Add bot response if it exists
                if (chat.response) {
                  messages.push({
                    id: `${chat._id}-bot`,
                    sender: 'bot',
                    text: chat.response,
                    timestamp,
                  });
                }

                return messages;
              }
            );

            setInitialMessages(formattedMessages);
            setSessionId(existingSessionId);
          } catch (error) {
            console.error(`Error loading session ${existingSessionId}:`, error);
            setError('Could not load this chat session. Please try again.');
          } finally {
            setIsLoading(false);
          }
          return;
        }

        // If not a new session or existing session, fetch chat history to get the most recent session
        try {
          console.log('Fetching chat history to find recent session...');
          const data = await API.chat.getHistory(token);
          console.log('Received chat history:', data);

          // Find the most recent session ID
          if (data.length > 0) {
            // Group messages by session
            const sessions: Record<string, ChatMessage[]> = {};
            for (const msg of data) {
              if (msg.session_id) {
                if (!sessions[msg.session_id]) {
                  sessions[msg.session_id] = [];
                }
                sessions[msg.session_id].push(msg);
              }
            }

            // Find the most recent session
            let mostRecentSessionId: string | undefined;
            let mostRecentTimestamp = 0;

            for (const sid in sessions) {
              const sessionMessages = sessions[sid];
              const latestMessage = sessionMessages.reduce(
                (latest, current) => {
                  const currentTime = new Date(current.timestamp).getTime();
                  return currentTime > new Date(latest.timestamp).getTime()
                    ? current
                    : latest;
                },
                sessionMessages[0]
              );

              const msgTime = new Date(latestMessage.timestamp).getTime();
              if (msgTime > mostRecentTimestamp) {
                mostRecentTimestamp = msgTime;
                mostRecentSessionId = sid;
              }
            }

            if (mostRecentSessionId) {
              console.log('Found most recent session ID:', mostRecentSessionId);
              // Redirect to that session
              navigate(`/chat/${mostRecentSessionId}`);
              return;
            } else {
              console.log('No session ID found, redirecting to sessions list');
              navigate('/chat');
              return;
            }
          } else {
            console.log('No chat history found, redirecting to sessions list');
            navigate('/chat');
            return;
          }
        } catch (error) {
          console.error('Failed to fetch chat history:', error);
          setError('Could not load chat history. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [
    user,
    navigate,
    getToken,
    isNewSession,
    location.pathname,
    existingSessionId,
  ]);

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
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-red-50 p-6 rounded-lg max-w-md">
              <h3 className="text-red-800 font-medium text-lg mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
              <button
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                onClick={() => navigate('/chat')}
              >
                Go to Chat Sessions
              </button>
            </div>
          </div>
        ) : (
          <ChatInterface
            initialMessages={initialMessages}
            sessionId={sessionId}
            initialTitle={sessionTitle}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
