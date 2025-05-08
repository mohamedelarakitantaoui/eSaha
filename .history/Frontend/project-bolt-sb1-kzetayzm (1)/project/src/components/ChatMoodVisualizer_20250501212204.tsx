// ChatMoodVisualizer.tsx
import React, { useEffect, useState } from 'react';
import { BarChart2, AlertCircle } from 'lucide-react';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface ChatMessage {
  _id: string;
  message: string;
  response: string;
  timestamp: string;
  session_id: string;
  sentiment?: {
    mood: string;
    score: number;
  };
}

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  mood_score: number;
  message_id?: string;
  session_id?: string;
  source: string;
}

interface ChatMoodVisualizerProps {
  sessionId: string;
}

const ChatMoodVisualizer: React.FC<ChatMoodVisualizerProps> = ({
  sessionId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not available');
        }

        // Fetch chat history for this session
        const sessionHistory = await API.chat.getSessionHistory(
          token,
          sessionId
        );

        // Fetch all mood entries
        const allMoodEntries = await API.mood.getMoodEntries(token, 'year');

        // Filter mood entries for this session
        const sessionMoodEntries = allMoodEntries.filter(
          (entry) =>
            entry.session_id === sessionId && entry.source === 'chat_message'
        );

        setMessages(sessionHistory);
        setMoodEntries(sessionMoodEntries);
      } catch (err) {
        console.error('Error fetching chat mood data:', err);
        setError('Failed to load mood data for this conversation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getToken, sessionId]);

  const getMoodEmoji = (mood: string): string => {
    const emojis: Record<string, string> = {
      very_happy: '😄',
      happy: '🙂',
      neutral: '😐',
      sad: '😔',
      very_sad: '😢',
      anxious: '😰',
      angry: '😠',
    };
    return emojis[mood] || '😐';
  };

  const getMoodColor = (score: number): string => {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 2) return 'bg-blue-100 text-blue-800';
    if (score >= -1) return 'bg-gray-100 text-gray-800';
    if (score >= -3) return 'bg-purple-100 text-purple-800';
    return 'bg-red-100 text-red-800';
  };

  // Match mood entries with messages
  const getMessageMood = (messageId: string): MoodEntry | undefined => {
    return moodEntries.find((entry) => entry.message_id === messageId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-3 rounded-lg text-red-700 text-sm">
        <AlertCircle className="inline-block mr-2" size={16} />
        {error}
      </div>
    );
  }

  // Calculate overall mood stats for this conversation
  const calculateMoodStats = () => {
    if (moodEntries.length === 0) return null;

    const totalScore = moodEntries.reduce(
      (sum, entry) => sum + entry.mood_score,
      0
    );
    const averageScore = totalScore / moodEntries.length;

    const moodCounts: Record<string, number> = {};
    let dominantMood = '';
    let maxCount = 0;

    moodEntries.forEach((entry) => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      if (moodCounts[entry.mood] > maxCount) {
        maxCount = moodCounts[entry.mood];
        dominantMood = entry.mood;
      }
    });

    return {
      averageScore,
      dominantMood,
      entries: moodEntries.length,
    };
  };

  const moodStats = calculateMoodStats();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800 flex items-center">
          <BarChart2 size={18} className="text-indigo-600 mr-2" />
          Conversation Mood Analysis
        </h3>
        {moodStats && (
          <div className="text-sm bg-indigo-50 px-3 py-1 rounded-full text-indigo-700">
            {getMoodEmoji(moodStats.dominantMood)} Overall:{' '}
            {moodStats.averageScore.toFixed(1)}
          </div>
        )}
      </div>

      {moodEntries.length === 0 ? (
        <div className="text-center py-3 text-gray-500 text-sm">
          No mood data available for this conversation
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            This conversation generated {moodEntries.length} mood data points
            with an average mood score of {moodStats?.averageScore.toFixed(1)}.
            The dominant mood was {moodStats?.dominantMood.replace('_', ' ')}.
          </p>

          <div className="space-y-2 mt-3">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Mood Flow
            </div>
            <div className="flex items-center h-10 overflow-x-auto">
              {moodEntries.map((entry, index) => (
                <div
                  key={index}
                  className="h-full flex-shrink-0"
                  style={{
                    width: `${Math.max(100 / moodEntries.length, 10)}%`,
                    maxWidth: '40px',
                    background:
                      entry.mood_score > 3
                        ? '#10B981'
                        : entry.mood_score > 0
                        ? '#3B82F6'
                        : entry.mood_score > -3
                        ? '#9333EA'
                        : '#EF4444',
                    opacity: 0.7 + (0.3 * Math.abs(entry.mood_score)) / 5,
                  }}
                  title={`${entry.mood.replace('_', ' ')} (${
                    entry.mood_score
                  })`}
                ></div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">
              Mood Distribution
            </div>
            <div className="flex justify-around">
              {(
                [
                  'very_happy',
                  'happy',
                  'neutral',
                  'sad',
                  'very_sad',
                  'anxious',
                  'angry',
                ] as const
              ).map((mood) => {
                const count = moodEntries.filter((e) => e.mood === mood).length;
                const percentage = Math.round(
                  (count / moodEntries.length) * 100
                );
                return (
                  <div key={mood} className="text-center">
                    <div className="text-lg">{getMoodEmoji(mood)}</div>
                    <div className="text-xs text-gray-600">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMoodVisualizer;
