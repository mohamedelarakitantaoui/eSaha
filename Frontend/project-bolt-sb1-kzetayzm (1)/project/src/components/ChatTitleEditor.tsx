import React, { useState, useEffect } from 'react';
import { Edit, Check } from 'lucide-react';
import API from '../services/api';
import useAuth from '../contexts/useAuth';

interface ChatTitleEditorProps {
  sessionId: string;
  initialTitle: string;
  onTitleChange: (newTitle: string) => void;
}

const ChatTitleEditor: React.FC<ChatTitleEditorProps> = ({
  sessionId,
  initialTitle,
  onTitleChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tempTitle, setTempTitle] = useState(initialTitle);
  const { getToken } = useAuth();

  useEffect(() => {
    setTitle(initialTitle);
    setTempTitle(initialTitle);
  }, [initialTitle]);

  const handleEditClick = () => {
    setTempTitle(title);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        return;
      }

      await API.chat.updateSessionTitle(token, sessionId, tempTitle);
      setTitle(tempTitle);
      onTitleChange(tempTitle);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update session title:', error);
      // Revert to previous title
      setTempTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTempTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="text-indigo-600 hover:text-indigo-800"
          >
            <Check size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{title}</span>
          <button
            onClick={handleEditClick}
            className="text-gray-400 hover:text-indigo-600"
          >
            <Edit size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatTitleEditor;
