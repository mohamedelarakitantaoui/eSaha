import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

// Define interface for session data
interface ChatSession {
  _id: string;
  user_id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview?: string;
}

const ChatSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSessions = async () => {
      try {
        setError(null);
        const token = await getToken();
        if (!token) {
          setError('Authentication error. Please log in again.');
          setIsLoading(false);
          return;
        }

        const sessionData = await API.chat.getSessions(token);
        console.log('Fetched sessions:', sessionData);
        setSessions(sessionData);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setError('Could not load your chat sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user, navigate, getToken]);

  const handleNewSession = () => {
    navigate('/chat/new');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Chat Sessions</h1>

          <Button
            className="flex items-center gap-2"
            onClick={handleNewSession}
          >
            <Plus size={16} />
            <span>New Session</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">
              You don't have any chat sessions yet.
            </p>
            <Button onClick={handleNewSession}>Start Your First Chat</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.session_id}
                to={`/chat/${session.session_id}`}
                className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      {session.title || 'Untitled Session'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {session.message_count}{' '}
                      {session.message_count === 1 ? 'message' : 'messages'}
                    </p>
                    {session.preview && (
                      <p className="text-gray-500 mt-2 text-sm line-clamp-2">
                        {session.preview}
                      </p>
                    )}
                  </div>
                  <div className="text-indigo-600">
                    <MessageSquare size={20} />
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-3">
                  <Clock size={12} className="mr-1" />
                  Last updated: {formatDate(session.updated_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatSessionsPage;
