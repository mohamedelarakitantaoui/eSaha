import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Plus, Calendar, Search } from 'lucide-react';
import useAuth from '../contexts/useAuth';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  mood: 'happy' | 'neutral' | 'sad' | 'anxious';
}

const MoodEmoji = ({ mood }: { mood: JournalEntry['mood'] }) => {
  const emojis = {
    happy: '😊',
    neutral: '😐',
    sad: '😔',
    anxious: '😰',
  };
  return <span className="text-xl">{emojis[mood]}</span>;
};

const JournalPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Mock journal entries
  const [entries] = useState<JournalEntry[]>([
    {
      id: '1',
      title: 'First day of therapy',
      content:
        'Today I had my first therapy session. It was a bit scary at first but I felt much better afterward...',
      date: new Date(2025, 3, 15), // April 15, 2025
      mood: 'neutral',
    },
    {
      id: '2',
      title: 'Made progress today',
      content:
        'I practiced the breathing techniques my therapist recommended and they really helped with my anxiety...',
      date: new Date(2025, 3, 18), // April 18, 2025
      mood: 'happy',
    },
    {
      id: '3',
      title: 'Difficult day at work',
      content:
        'Had a stressful meeting that triggered my anxiety. I tried using the grounding techniques but...',
      date: new Date(2025, 3, 20), // April 20, 2025
      mood: 'anxious',
    },
  ]);

  // Filter entries based on search
  const filteredEntries = entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-full p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Journal</h1>

          <Button className="flex items-center gap-2">
            <Plus size={16} />
            <span>New Entry</span>
          </Button>
        </div>

        {/* Search and filter bar */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="secondary" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Filter by Date</span>
          </Button>
        </div>

        {/* Journal entries list */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No journal entries found.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-800">
                    {entry.title}
                  </h3>
                  <MoodEmoji mood={entry.mood} />
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {entry.content}
                </p>
                <div className="text-sm text-gray-500">
                  {entry.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JournalPage;
