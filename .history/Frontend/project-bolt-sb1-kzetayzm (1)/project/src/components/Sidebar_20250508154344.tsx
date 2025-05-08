import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import {
  Users,
  Book,
  Calendar,
  MessageSquare,
  AlertCircle,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { clearAuthState } from '../utils/AuthUtils';

interface SidebarProps {
  userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userName = 'Guest' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      name: 'Find a Specialist',
      icon: <Users size={20} />,
      path: '/specialists',
      priority: true,
    },
    {
      name: 'My Journal',
      icon: <Book size={20} />,
      path: '/journal',
    },
    {
      name: 'Appointments',
      icon: <Calendar size={20} />,
      path: '/appointments',
    },
    {
      name: 'AI Chat',
      icon: <MessageSquare size={20} />,
      path: '/chat',
    },
    {
      name: 'Request Help',
      icon: <AlertCircle size={20} />,
      path: '/emergency-contacts',
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      path: '/settings',
    },
  ];

  const handleLogout = async () => {
    try {
      await clearAuthState();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <aside className="bg-white shadow-md flex flex-col h-full w-64 py-6 px-4">
      {/* Logo */}
      <div className="px-4 mb-8">
        <Logo />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              item.priority
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : isActive(item.path)
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {React.cloneElement(item.icon, {
              className: item.priority
                ? 'text-white'
                : isActive(item.path)
                ? 'text-indigo-600'
                : 'text-gray-500',
            })}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer relative"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="bg-indigo-100 rounded-full p-2">
            <User size={24} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{userName}</p>
          </div>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute bottom-full left-0 right-0 bg-white shadow-md rounded-lg z-10 mb-1">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
