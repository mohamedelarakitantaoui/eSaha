import { useState } from 'react';
import { Send, User } from 'lucide-react';
import { Logo } from '../components/Logo';
import type { Message } from '../types';

const SAMPLE_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: 'user1',
    content: 'Hey there! How are you?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    senderId: 'user2',
    content: "I'm doing great! Thanks for asking. How about you?",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: '3',
    senderId: 'user1',
    content: 'Pretty good! Just working on some new features.',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
  },
];

export function Chat() {
  const [messages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const currentUserId = 'user1'; // This would come from auth context in a real app

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // TODO: Implement message sending logic
    setNewMessage('');
  };

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
              <div className="font-medium text-gray-900">John Doe</div>
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
