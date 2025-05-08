// EnhancedMoodTrackerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface MoodEntry {
  id: string;
  date: string;
  mood:
    | 'very_happy'
    | 'happy'
    | 'neutral'
    | 'sad'
    | 'very_sad'
    | 'anxious'
    | 'angry';
  mood_score: number;
  factors: string[];
  notes?: string;
  source: 'manual' | 'chat_message';
  message_id?: string;
  session_id?: string;
  created_at: string;
}

interface ChatSession {
  _id: string;
  session_id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

interface MoodInsights {
  averageMoodScore: number;
  recentTrend?: 'improving' | 'declining' | 'stable';
  moodDistribution: Record<string, number>;
  topFactors: Array<{ factor: string; count: number }>;
  factorAnalysis: {
    positive: Array<{ factor: string; score: number }>;
    negative: Array<{ factor: string; score: number }>;
  };
  recommendations: string[];
}

const EnhancedMoodTrackerDashboard: React.FC = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [chatBasedMoods, setChatBasedMoods] = useState<MoodEntry[]>([]);
  const [manualMoods, setManualMoods] = useState<MoodEntry[]>([]);
  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>(
    'month'
  );
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Use useCallback to fetch all required data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Fetch all data in parallel for better performance
      const [entriesResponse, insightsResponse, chatsResponse] =
        await Promise.all([
          API.mood.getMoodEntries(token, timeRange),
          API.mood.getMoodInsights(token, timeRange),
          API.chat.getSessions(token),
        ]);

      setMoodEntries(entriesResponse);
      setInsights(insightsResponse);
      setRecentChats(chatsResponse);

      // Separate chat-based vs manual mood entries
      const chatEntries = entriesResponse.filter(
        (entry) => entry.source === 'chat_message'
      );
      const manualEntries = entriesResponse.filter(
        (entry) => entry.source === 'manual'
      );

      setChatBasedMoods(chatEntries);
      setManualMoods(manualEntries);
    } catch (err) {
      console.error('Error fetching mood data:', err);
      setError('Failed to load mood data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper functions
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

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getMoodColor = (score: number): string => {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 2) return 'bg-blue-100 text-blue-800';
    if (score >= -1) return 'bg-gray-100 text-gray-800';
    if (score >= -3) return 'bg-purple-100 text-purple-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = () => {
    if (!insights) return <Minus size={24} className="text-gray-500" />;

    if (insights.recentTrend === 'improving') {
      return <TrendingUp size={24} className="text-green-500" />;
    } else if (insights.recentTrend === 'declining') {
      return <TrendingDown size={24} className="text-red-500" />;
    } else {
      return <Minus size={24} className="text-gray-500" />;
    }
  };

  const handleViewChatSession = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700">
        <AlertCircle className="inline-block mr-2" size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Mood Insights</h2>
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            className={`px-3 py-1 text-sm ${
              timeRange === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              timeRange === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              timeRange === 'year'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Mood Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Mood Card */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="text-sm text-gray-500">Average Mood</div>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-gray-800">
              {insights?.averageMoodScore.toFixed(1) || '0.0'}
            </span>
            <span className="text-xl ml-2">
              {Number(insights?.averageMoodScore || 0) > 0
                ? '🙂'
                : Number(insights?.averageMoodScore || 0) < 0
                ? '😔'
                : '😐'}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-600">Scale: -5 to +5</div>
        </div>

        {/* Chat-based vs Manual Entry Card */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="text-sm text-gray-500">Mood Data Sources</div>
          <div className="mt-2 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {chatBasedMoods.length}
              </div>
              <div className="text-xs text-gray-600">From Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {manualMoods.length}
              </div>
              <div className="text-xs text-gray-600">Manual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {moodEntries.length}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {moodEntries.length > 0
              ? `${Math.round(
                  (chatBasedMoods.length / moodEntries.length) * 100
                )}% from conversations`
              : 'No mood data yet'}
          </div>
        </div>

        {/* Mood Trend Card */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="text-sm text-gray-500">Recent Trend</div>
          <div className="mt-2 flex items-center">
            {getTrendIcon()}
            <span className="ml-2 text-lg font-medium text-gray-800">
              {insights?.recentTrend === 'improving'
                ? 'Improving'
                : insights?.recentTrend === 'declining'
                ? 'Declining'
                : 'Stable'}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Based on recent entries
          </div>
        </div>
      </div>

      {/* Chat-Based Mood Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            Chats & Mood Correlation
          </h3>
          <Link
            to="/chat"
            className="text-indigo-600 text-sm flex items-center"
          >
            View All Chats <ChevronRight size={16} />
          </Link>
        </div>

        {chatBasedMoods.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No chat-based mood data available yet. Your mood is automatically
            analyzed during conversations.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-2">
              Recent conversations that affected your mood:
            </div>

            {chatBasedMoods.slice(0, 5).map((entry) => {
              // Find the associated chat session
              const chatSession = recentChats.find(
                (chat) => chat.session_id === entry.session_id
              );

              return (
                <div
                  key={entry.id}
                  className="flex items-start border-l-4 pl-4 py-2"
                  style={{
                    borderColor:
                      entry.mood_score > 3
                        ? '#10B981'
                        : entry.mood_score > 0
                        ? '#3B82F6'
                        : entry.mood_score > -3
                        ? '#9333EA'
                        : '#EF4444',
                  }}
                >
                  <div className="mr-3 text-2xl">
                    {getMoodEmoji(entry.mood)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {chatSession?.title || 'Chat conversation'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(entry.date)} • Mood:{' '}
                      {entry.mood.replace('_', ' ')}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getMoodColor(
                          entry.mood_score
                        )}`}
                      >
                        Score: {entry.mood_score}
                      </span>
                    </div>
                  </div>
                  {chatSession && (
                    <Button
                      variant="secondary"
                      className="flex items-center text-xs"
                      onClick={() =>
                        handleViewChatSession(chatSession.session_id)
                      }
                    >
                      <MessageSquare size={14} className="mr-1" />
                      View Chat
                    </Button>
                  )}
                </div>
              );
            })}

            {chatBasedMoods.length > 5 && (
              <div className="text-center mt-4">
                <Link
                  to="/mood"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  View all {chatBasedMoods.length} chat-based mood entries
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-indigo-800 mb-3">
            Personalized Insights
          </h3>

          <ul className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <div className="bg-indigo-100 rounded-full p-1 mr-2 mt-0.5">
                  <AlertCircle size={14} className="text-indigo-600" />
                </div>
                <span className="text-indigo-700">{recommendation}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => navigate('/mood/log')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center"
            >
              <BarChart2 size={16} className="mr-2" />
              Log Your Mood Now
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => navigate('/mood/log')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
        >
          Log Mood Manually
        </Button>

        <Button
          onClick={() => navigate('/chat/new')}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3"
        >
          Talk to Generate Mood Data
        </Button>
      </div>
    </div>
  );
};

export default EnhancedMoodTrackerDashboard;
