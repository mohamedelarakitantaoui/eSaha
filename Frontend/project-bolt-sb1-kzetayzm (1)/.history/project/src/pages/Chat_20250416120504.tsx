import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAuth from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use useCallback to define fetchChatHistory so it can be used as a dependency
  const fetchChatHistory = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        return;
      }

      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching chat history: ${response.statusText}`);
      }

      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  }, [getToken]);

  // Fetch chat history when component mounts
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchChatHistory();
  }, [user, navigate, fetchChatHistory]);

  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setIsLoading(true);

      // Get the token
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setIsLoading(false);
        return;
      }

      // First, update UI optimistically
      const userMessage = {
        _id: Date.now().toString(),
        user_id: user?.id,
        message: message,
        response: '',
        subject: 'General',
        timestamp: new Date().toISOString(),
        pending: true, // Mark as pending
      };

      setChatHistory((prev) => [...prev, userMessage]);
      setMessage('');

      // Send request to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          subject: 'General',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error sending message: ${errorText}`);
      }

      const data = await response.json();

      // Update the chat history with the response
      setChatHistory((prev) => {
        const updated = [...prev];
        // Remove the pending message
        const pendingIndex = updated.findIndex(
          (item) => item._id === userMessage._id
        );
        if (pendingIndex !== -1) {
          updated.splice(pendingIndex, 1);
        }
        // Add the confirmed message from server
        return [
          ...updated,
          {
            _id: userMessage._id,
            user_id: user?.id,
            message: message,
            response: data.response,
            subject: 'General',
            timestamp: new Date().toISOString(),
          },
        ];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the pending message on error
      setChatHistory((prev) => prev.filter((item) => !item.pending));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">Mental Health Chat</h1>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div key={chat._id} className="space-y-2">
              <div className="flex items-end justify-end">
                <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-xs">
                  {chat.message}
                </div>
              </div>

              {chat.response && (
                <div className="flex items-end">
                  <div className="bg-gray-300 rounded-lg py-2 px-4 max-w-xs">
                    {chat.response}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-end">
            <div className="bg-gray-300 rounded-lg py-2 px-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 shadow-inner">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={isLoading || !message.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
