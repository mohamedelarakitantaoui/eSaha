import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Plus, MessageSquare, Clock, Edit, Trash } from 'lucide-react';
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
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
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

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this chat session?')) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }

      // Since deleteSession doesn't exist in the API, we can simulate deletion
      // by removing it from local state and optionally implement an API call
      // that might be available for deletion.

      // Option 1: If there's a specific deleteSession API endpoint:
      // await API.chat.deleteSession(token, sessionId);

      // Option 2: If you can use a general delete API endpoint:
      await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update the local state to remove the deleted session
      setSessions(
        sessions.filter((session) => session.session_id !== sessionId)
      );
    } catch (error) {
      console.error('Failed to delete session:', error);
      setError('Could not delete the session. Please try again.');
    }
  };

  const handleEditTitle = (
    sessionId: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setEditSessionId(sessionId);
    setEditTitle(currentTitle);
  };

  const handleSaveTitle = async (sessionId: string, e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }

      await API.chat.updateSessionTitle(token, sessionId, editTitle);

      // Update the sessions list with the new title
      setSessions(
        sessions.map((session) =>
          session.session_id === sessionId
            ? { ...session, title: editTitle }
            : session
        )
      );

      setEditSessionId(null);
    } catch (error) {
      console.error('Failed to update session title:', error);
      setError('Could not update the session title. Please try again.');
    }
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
    } catch {
      // Using underscore to indicate we're intentionally not using this parameter
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
                  <div className="flex-1">
                    {editSessionId === session.session_id ? (
                      <form
                        onSubmit={(e) => handleSaveTitle(session.session_id, e)}
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            className="text-xs py-1 px-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Save
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-800">
                          {session.title || 'Untitled Session'}
                        </h3>
                        <button
                          onClick={(e) =>
                            handleEditTitle(
                              session.session_id,
                              session.title,
                              e
                            )
                          }
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) =>
                        handleDeleteSession(session.session_id, e)
                      }
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash size={18} />
                    </button>
                    <div className="text-indigo-600">
                      <MessageSquare size={20} />
                    </div>
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
