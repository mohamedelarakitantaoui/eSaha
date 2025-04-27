import React, { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Button } from './Button';
import { PlusCircle, Calendar } from 'lucide-react';
import useAuth from '../contexts/useAuth';

interface MoodEntry {
  id: string;
  date: Date;
  mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
  factors: string[];
  notes: string;
}

const moodLabels = {
  very_happy: 'Very Happy',
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
  very_sad: 'Very Sad',
};

const moodEmojis = {
  very_happy: '😄',
  happy: '🙂',
  neutral: '😐',
  sad: '😔',
  very_sad: '😢',
};

const MoodTrackerPage: React.FC = () => {
  // We'll use user data for display purposes later
  useAuth(); // Keeping the hook but not destructuring unused variables

  // Mock mood data for the current month
  const [moodData] = useState<MoodEntry[]>([
    {
      id: '1',
      date: new Date(2025, 3, 15),
      mood: 'happy',
      factors: ['Good Sleep', 'Exercise'],
      notes: 'Felt energetic after morning walk',
    },
    {
      id: '2',
      date: new Date(2025, 3, 16),
      mood: 'neutral',
      factors: ['Work Stress', 'Good Food'],
      notes: 'Busy day at work but had a nice dinner',
    },
    {
      id: '3',
      date: new Date(2025, 3, 17),
      mood: 'sad',
      factors: ['Poor Sleep', 'Conflict'],
      notes: "Argument with friend, didn't sleep well",
    },
    {
      id: '4',
      date: new Date(2025, 3, 18),
      mood: 'very_happy',
      factors: ['Social Connection', 'Outdoors'],
      notes: 'Great day with friends at the park',
    },
    {
      id: '5',
      date: new Date(2025, 3, 19),
      mood: 'happy',
      factors: ['Accomplishment', 'Exercise'],
      notes: 'Completed a project and had a good workout',
    },
    {
      id: '6',
      date: new Date(2025, 3, 20),
      mood: 'neutral',
      factors: ['Work Stress'],
      notes: 'Average day, nothing special',
    },
    {
      id: '7',
      date: new Date(2025, 3, 21),
      mood: 'very_sad',
      factors: ['Poor Sleep', 'Health Issues'],
      notes: 'Not feeling well, headache all day',
    },
  ]);

  // Function to calculate mood distribution
  const calculateMoodDistribution = () => {
    const distribution: Record<string, number> = {
      very_happy: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
      very_sad: 0,
    };

    moodData.forEach((entry) => {
      distribution[entry.mood]++;
    });

    return distribution;
  };

  const moodDistribution = calculateMoodDistribution();

  // Get dates for the calendar display
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();

  return (
    <DashboardLayout>
      <div className="h-full p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Mood Tracker</h1>

          <Button className="flex items-center gap-2">
            <PlusCircle size={16} />
            <span>Log Today's Mood</span>
          </Button>
        </div>

        {/* Monthly overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">
              {currentMonth} {currentYear} Overview
            </h2>
            <button className="text-indigo-600 flex items-center gap-1 text-sm">
              <Calendar size={16} />
              <span>Change Month</span>
            </button>
          </div>

          {/* Mood distribution */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              Mood Distribution
            </h3>
            <div className="flex items-end space-x-6">
              {Object.entries(moodDistribution).map(([mood, count]) => {
                const percentage = (count / moodData.length) * 100;
                return (
                  <div key={mood} className="flex flex-col items-center">
                    <div className="text-2xl mb-2">
                      {moodEmojis[mood as keyof typeof moodEmojis]}
                    </div>
                    <div
                      className="bg-indigo-100 w-12 rounded-t-lg flex items-end justify-center"
                      style={{ height: `${Math.max(percentage, 5)}px` }}
                    >
                      <span className="text-xs font-medium text-indigo-800">
                        {count}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {moodLabels[mood as keyof typeof moodLabels]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mood entries */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Recent Entries
          </h2>
          <div className="space-y-4">
            {moodData
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500 text-sm">
                      {entry.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                      <span className="text-sm font-medium">
                        {moodLabels[entry.mood]}
                      </span>
                    </div>
                  </div>

                  {entry.factors.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">Factors:</div>
                      <div className="flex flex-wrap gap-2">
                        {entry.factors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.notes && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Notes:</div>
                      <p className="text-sm text-gray-700">{entry.notes}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MoodTrackerPage;
