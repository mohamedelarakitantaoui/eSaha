import { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { Logo } from '../components/Logo';
import type { Message } from '../types';
import { supabase } from '../lib/supabase';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Load user profile and messages on component mount
  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Subscribe to real-time messages
          const subscription = supabase
            .channel('public:messages')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages' },
              (payload) => {
                const newMsg = payload.new as Message;
                if (
                  newMsg.senderId === user.id ||
                  newMsg.recipientId === user.id
                ) {
                  setMessages((prev) => [...prev, newMsg]);
                }
              }
            )
            .subscribe();

          // Fetch message history
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`senderId.eq.${user.id},recipientId.eq.${user.id}`)
            .order('timestamp', { ascending: true });

          if (error) throw error;

          setMessages(data || []);

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageData = {
      senderId: user.id,
      recipientId: 'user2', // Replace with actual recipient ID
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      // Insert message into Supabase
      const { error } = await supabase.from('messages').insert(messageData);

      if (error) throw error;

      // Clear input field
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  const currentUserId = user?.id;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <Logo />
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {user?.user_metadata?.full_name || 'User'}
              </div>
              <div className="text-sm text-gray-500">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Jane Smith</div>
              <div className="text-sm text-gray-500">Active now</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === currentUserId
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                  message.senderId === currentUserId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-900'
                }`}
              >
                <p>{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === currentUserId
                      ? 'text-indigo-200'
                      : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
