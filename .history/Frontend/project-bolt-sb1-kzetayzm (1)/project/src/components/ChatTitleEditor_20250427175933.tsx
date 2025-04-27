// ChatTitleEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

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
  const [title, setTitle] = useState(initialTitle || 'New Chat');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    if (title.trim() === '') {
      setTitle(initialTitle || 'New Chat');
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Call API to update session title
      await API.chat.updateSessionTitle(token, sessionId, title);
      onTitleChange(title);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating chat title:', error);
      // Keep the UI in edit mode so the user can try again
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    setTitle(initialTitle || 'New Chat');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    } else if (e.key === 'Escape') {
      handleCancelClick();
    }
  };

  // If not editing, just show the title with an edit button
  if (!isEditing) {
    return (
      <div className="flex items-center">
        <h2 className="text-md font-medium text-gray-700 mr-2">{title}</h2>
        <button
          onClick={handleEditClick}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
          aria-label="Edit title"
        >
          <PencilIcon size={16} />
        </button>
      </div>
    );
  }

  // If editing, show the input field with save and cancel buttons
  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-b border-indigo-400 bg-transparent text-md font-medium text-gray-700 focus:outline-none focus:border-indigo-600 px-1"
        placeholder="Enter chat title"
        disabled={isSaving}
      />
      <button
        onClick={handleSaveClick}
        className="text-green-500 hover:text-green-600 transition-colors"
        disabled={isSaving}
        aria-label="Save title"
      >
        <CheckIcon size={16} />
      </button>
      <button
        onClick={handleCancelClick}
        className="text-red-500 hover:text-red-600 transition-colors"
        disabled={isSaving}
        aria-label="Cancel editing"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
};

export default ChatTitleEditor;
