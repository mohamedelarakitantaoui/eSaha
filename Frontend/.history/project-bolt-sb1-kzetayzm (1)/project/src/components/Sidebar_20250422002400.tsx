import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import {
  MessageSquare,
  Book,
  BarChart2,
  Tool,
  HelpCircle,
  Settings,
  User,
  Plus,
  Crown,
} from 'lucide-react';

interface SidebarProps {
  userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userName = 'Guest' }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Chat Sessions', icon: <MessageSquare size={20} />, path: '/chat' },
    { name: 'My Journal', icon: <Book size={20} />, path: '/journal' },
    { name: 'Mood Tracker', icon: <BarChart2 size={20} />, path: '/mood' },
    { name: 'Coping Tools', icon: <Tool size={20} />, path: '/tools' },
    { name: 'Help', icon: <HelpCircle size={20} />, path: '/help' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <aside className="bg-white shadow-md flex flex-col h-full w-64 py-6 px-4">
      {/* Logo */}
      <div className="px-4 mb-8">
        <Logo />
      </div>

      {/* New Session Button */}
      <div className="px-4 mb-6">
        <Link
          to="/chat/new"
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Session</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {React.cloneElement(item.icon, {
              className: isActive(item.path)
                ? 'text-indigo-600'
                : 'text-gray-500',
            })}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="bg-indigo-100 rounded-full p-2">
            <User size={24} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{userName}</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 w-full mt-3 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
          <Crown size={16} />
          <span>Upgrade to Premium</span>
        </button>
      </div>
    </aside>
  );
};
