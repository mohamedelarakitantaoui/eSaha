import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  // Remove unused Calendar import
  BarChart3,
  LineChart,
  Download,
  PlusCircle,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface MoodEntry {
  id: string;
  date: string; // ISO date string
  mood:
    | 'very_happy'
    | 'happy'
    | 'neutral'
    | 'sad'
    | 'very_sad'
    | 'anxious'
    | 'angry';
  mood_score: number; // -5 to 5 scale
  factors: string[];
  notes?: string;
  source: 'manual' | 'chat_message' | 'check_in';
}

interface MoodFormProps {
  onSave: (entry: Omit<MoodEntry, 'id' | 'source'>) => void;
  onCancel: () => void;
}

// Updated to match the API interface with additional optional frontend-specific fields
interface MoodInsights {
  averageMoodScore: number;
  recentTrend?: 'improving' | 'declining' | 'stable';
  mostCommonMood?: string;
  moodDistribution: Record<string, number>;
  topFactors: Array<{ factor: string; count: number }>;
  factorAnalysis: {
    positive: Array<{ factor: string; score: number }>;
    negative: Array<{ factor: string; score: number }>;
  };
  recommendations: string[];
}

const moodLabels: Record<string, string> = {
  very_happy: 'Very Happy',
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
  very_sad: 'Very Sad',
  anxious: 'Anxious',
  angry: 'Angry',
};

const moodEmojis: Record<string, string> = {
  very_happy: '😄',
  happy: '🙂',
  neutral: '😐',
  sad: '😔',
  very_sad: '😢',
  anxious: '😰',
  angry: '😠',
};

const moodScores: Record<string, number> = {
  very_happy: 5,
  happy: 3,
  neutral: 0,
  sad: -3,
  very_sad: -5,
  anxious: -2,
  angry: -4,
};

const commonFactors = [
  'Good Sleep',
  'Poor Sleep',
  'Exercise',
  'Healthy Eating',
  'Work Stress',
  'Family',
  'Friends',
  'Social Event',
  'Alone Time',
  'Weather',
  'Physical Health',
  'Meditation',
  'Therapy Session',
  'Medication',
  'Conflict',
  'Success',
];

const MoodEntryForm: React.FC<MoodFormProps> = ({ onSave, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // Fixed the mood state declaration
  const [mood, setMood] =
    useState |
    'very_happy' |
    'happy' |
    'neutral' |
    'sad' |
    'very_sad' |
    'anxious' |
    ('angry' > 'neutral');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [customFactor, setCustomFactor] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save the mood entry
    onSave({
      date,
      mood,
      mood_score: moodScores[mood],
      factors: selectedFactors,
      notes: notes || undefined,
    });
  };

  const handleFactorToggle = (factor: string) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter((f) => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  const handleAddCustomFactor = () => {
    if (customFactor.trim() && !selectedFactors.includes(customFactor.trim())) {
      setSelectedFactors([...selectedFactors, customFactor.trim()]);
      setCustomFactor('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
        required
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          How are you feeling?
        </label>
        <div className="grid grid-cols-7 gap-2">
          {Object.entries(moodEmojis).map(([key, emoji]) => (
            <button
              key={key}
              type="button"
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg border ${
                  mood ===
                  (key as
                    | 'very_happy'
                    | 'happy'
                    | 'neutral'
                    | 'sad'
                    | 'very_sad'
                    | 'anxious'
                    | 'angry')
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() =>
                setMood(
                  key as
                    | 'very_happy'
                    | 'happy'
                    | 'neutral'
                    | 'sad'
                    | 'very_sad'
                    | 'anxious'
                    | 'angry'
                )
              }
            >
              <span className="text-2xl mb-1">{emoji}</span>
              <span className="text-xs text-gray-600">
                {moodLabels[key as keyof typeof moodLabels]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          What factors influenced your mood? (select all that apply)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {commonFactors.map((factor) => (
            <button
              key={factor}
              type="button"
              className={`
                text-left px-3 py-2 rounded-lg text-sm ${
                  selectedFactors.includes(factor)
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }
              `}
              onClick={() => handleFactorToggle(factor)}
            >
              {factor}
            </button>
          ))}
        </div>

        <div className="flex mt-2">
          <Input
            label=""
            placeholder="Add custom factor..."
            value={customFactor}
            onChange={(e) => setCustomFactor(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            className="ml-2 mt-5"
            onClick={handleAddCustomFactor}
            disabled={!customFactor.trim()}
          >
            Add
          </Button>
        </div>

        {selectedFactors.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 mb-1">Selected factors:</p>
            <div className="flex flex-wrap gap-2">
              {selectedFactors.map((factor) => (
                <span
                  key={factor}
                  className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs flex items-center"
                >
                  {factor}
                  <button
                    type="button"
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                    onClick={() => handleFactorToggle(factor)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional thoughts or reflections..."
          className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
        />
      </div>

      <div className="pt-4 flex space-x-3">
        <Button type="submit" className="flex-1">
          Save Mood Entry
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const MoodTrackerDashboard: React.FC = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>(
    'month'
  );
  const [chartView, setChartView] = useState<'line' | 'bar'>('line');
  const [moodInsights, setMoodInsights] = useState<MoodInsights | null>(null);
  const { getToken } = useAuth();

  // Mood Factors Card Component
  const MoodFactorsCard: React.FC<{ entry: MoodEntry }> = ({ entry }) => {
    if (!entry.factors || entry.factors.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
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
    );
  };

  // Use useCallback to memoize the fetchMoodData function
  const fetchMoodData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Fetch entries and insights in parallel
      const [entriesResponse, insightsResponse] = await Promise.all([
        API.mood.getMoodEntries(token, timeRange),
        API.mood.getMoodInsights(token, timeRange),
      ]);

      setMoodEntries(entriesResponse);

      // Add frontend-specific fields to insights data
      const enhancedInsights: MoodInsights = {
        ...insightsResponse,
        // Derive most common mood from distribution
        mostCommonMood:
          Object.entries(insightsResponse.moodDistribution)
            .sort((a, b) => b[1] - a[1])
            .map((entry) => entry[0])[0] || 'neutral',
        // Default recent trend to stable
        recentTrend: 'stable',
      };

      // Update recent trend based on recommendations if possible
      const trendRecommendation = insightsResponse.recommendations.find(
        (rec) => rec.includes('improving') || rec.includes('declined')
      );

      if (trendRecommendation) {
        if (trendRecommendation.includes('improving')) {
          enhancedInsights.recentTrend = 'improving';
        } else if (trendRecommendation.includes('declined')) {
          enhancedInsights.recentTrend = 'declining';
        }
      }

      setMoodInsights(enhancedInsights);
    } catch (err) {
      console.error('Error fetching mood data:', err);
      setError('Failed to load mood data');

      // Set mock data for demonstration
      const now = new Date();
      const mockEntries: MoodEntry[] = [];

      // Generate mock data based on time range
      let daysToGenerate = 30;
      if (timeRange === 'week') daysToGenerate = 7;
      if (timeRange === 'year') daysToGenerate = 30;

      for (let i = 0; i < daysToGenerate; i++) {
        const entryDate = new Date(now);
        entryDate.setDate(entryDate.getDate() - i);

        // Create some variations in mood
        const moodOptions = [
          'very_happy',
          'happy',
          'neutral',
          'sad',
          'very_sad',
          'anxious',
          'angry',
        ] as const;
        const randomMood =
          moodOptions[Math.floor(Math.random() * moodOptions.length)];

        // Random factors
        const randomFactors: string[] = [];
        const factorCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < factorCount; j++) {
          const factor =
            commonFactors[Math.floor(Math.random() * commonFactors.length)];
          if (!randomFactors.includes(factor)) {
            randomFactors.push(factor);
          }
        }

        mockEntries.push({
          id: `mock_${i}`,
          date: entryDate.toISOString().split('T')[0],
          mood: randomMood,
          mood_score: moodScores[randomMood],
          factors: randomFactors,
          notes: Math.random() > 0.7 ? 'Sample note for this entry' : undefined,
          source: Math.random() > 0.5 ? 'manual' : 'chat_message',
        });
      }

      setMoodEntries(mockEntries);

      // Mock insights
      const mockDistribution: Record<string, number> = {
        very_happy: 3,
        happy: 8,
        neutral: 4,
        sad: 2,
        very_sad: 1,
        anxious: 3,
        angry: 1,
      };

      // Mock insights with the updated interface
      setMoodInsights({
        averageMoodScore: 1.2,
        recentTrend: 'improving',
        mostCommonMood: 'happy',
        moodDistribution: mockDistribution,
        topFactors: [
          { factor: 'Exercise', count: 7 },
          { factor: 'Good Sleep', count: 6 },
          { factor: 'Work Stress', count: 5 },
        ],
        factorAnalysis: {
          positive: [
            { factor: 'Exercise', score: 2.5 },
            { factor: 'Good Sleep', score: 2.1 },
            { factor: 'Social Event', score: 1.8 },
          ],
          negative: [
            { factor: 'Work Stress', score: -2.1 },
            { factor: 'Poor Sleep', score: -1.8 },
            { factor: 'Conflict', score: -1.5 },
          ],
        },
        recommendations: [
          "Try to increase Exercise in your routine, as it's associated with your improved mood.",
          'Consider strategies to manage Work Stress, which appears to negatively affect your mood.',
          'Continue tracking your mood regularly to get more accurate insights.',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, getToken]); // Include required dependencies

  useEffect(() => {
    fetchMoodData();
  }, [fetchMoodData]); // Now fetchMoodData is stable and won't cause dependency issues

  const handleSaveMoodEntry = async (
    entryData: Omit<MoodEntry, 'id' | 'source'>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const newEntry = await API.mood.createMoodEntry(token, entryData);

      setMoodEntries((prevEntries) => {
        // Add the new entry and sort by date (newest first)
        const updated = [...prevEntries, newEntry];
        return updated.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      setIsAddingEntry(false);

      // Refresh insights
      fetchMoodData();
    } catch (err) {
      console.error('Error saving mood entry:', err);
      setError('Failed to save mood entry');

      // Fallback for demo purposes
      const mockId = `temp_${Date.now()}`;
      const mockEntry: MoodEntry = {
        ...entryData,
        id: mockId,
        source: 'manual',
      };

      setMoodEntries((prevEntries) => {
        // Add the mock entry and sort by date (newest first)
        const updated = [...prevEntries, mockEntry];
        return updated.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      setIsAddingEntry(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      // Create CSV content
      const csvHeader = ['Date', 'Mood', 'Score', 'Factors', 'Notes', 'Source'];
      const csvRows = moodEntries.map((entry) => [
        entry.date,
        moodLabels[entry.mood],
        entry.mood_score.toString(),
        entry.factors.join('; '),
        entry.notes || '',
        entry.source,
      ]);

      const csvContent = [
        csvHeader.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `mood_tracker_data_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!moodEntries.length) return [];

    // For line chart, we need one entry per date
    const dateMap = new Map<string, MoodEntry>();

    // Sort entries by date (oldest first) for consistent charting
    const sortedEntries = [...moodEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // If multiple entries exist for a date, use the latest one
    for (const entry of sortedEntries) {
      dateMap.set(entry.date, entry);
    }

    return Array.from(dateMap.values()).map((entry) => ({
      date: entry.date,
      value: entry.mood_score,
      mood: entry.mood,
    }));
  }, [moodEntries]);

  // Calculate mood distribution
  const moodDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      very_happy: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
      very_sad: 0,
      anxious: 0,
      angry: 0,
    };

    for (const entry of moodEntries) {
      distribution[entry.mood] += 1;
    }

    return distribution;
  }, [moodEntries]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderLineChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No mood data available for the selected time range.
        </div>
      );
    }

    const maxScore = Math.max(...chartData.map((d) => d.value), 5);
    const minScore = Math.min(...chartData.map((d) => d.value), -5);
    const range = maxScore - minScore;
    const height = 200;
    const width = chartData.length <= 7 ? 500 : chartData.length * 40;

    return (
      <div className="relative h-[250px] w-full overflow-x-auto">
        <div
          style={{ width: `${Math.max(100, width)}%`, height: `${height}px` }}
        >
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full w-10 flex flex-col justify-between text-xs text-gray-500">
            <div>+5</div>
            <div>0</div>
            <div>-5</div>
          </div>

          {/* Chart area */}
          <div className="absolute left-10 right-0 top-0 h-full">
            {/* Zero line */}
            <div
              className="absolute w-full h-px bg-gray-300"
              style={{
                top: `${(maxScore / (range === 0 ? 1 : range)) * height}px`,
              }}
            ></div>

            {/* Data points and lines */}
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${chartData.length - 1} 10`}
              preserveAspectRatio="none"
            >
              <polyline
                points={chartData
                  .map(
                    (d, i) =>
                      `${i}, ${5 - (d.value / (range === 0 ? 1 : range)) * 10}`
                  )
                  .join(' ')}
                fill="none"
                stroke="#6366F1"
                strokeWidth="0.1"
              />
            </svg>

            {/* Data points */}
            <div className="absolute inset-0">
              <div className="flex justify-between h-full">
                {chartData.map((point, index) => (
                  <div
                    key={index}
                    className="flex flex-col justify-center items-center h-full"
                  >
                    <div
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColorForMood(point.mood),
                        top: `${
                          ((maxScore - point.value) /
                            (range === 0 ? 1 : range)) *
                          height
                        }px`,
                      }}
                      title={`${formatDate(point.date)}: ${
                        moodLabels[point.mood as keyof typeof moodLabels]
                      } (${point.value})`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="absolute bottom-[-25px] w-full flex justify-between text-xs text-gray-500">
              {chartData.map((point, index) => (
                <div key={index}>{formatDate(point.date)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No mood data available for the selected time range.
        </div>
      );
    }

    return (
      <div className="mt-2 h-56 relative overflow-x-auto">
        <div className="flex items-end space-x-2 min-w-max px-8">
          {Object.entries(moodDistribution).map(([mood, count]) => {
            if (count === 0) return null;

            const moodKey = mood as keyof typeof moodLabels;
            const percentage = (count / moodEntries.length) * 100;

            return (
              <div key={mood} className="flex flex-col items-center">
                <div className="text-2xl mb-2">{moodEmojis[moodKey]}</div>
                <div
                  className="w-14 rounded-t-lg flex items-end justify-center transition-all duration-500"
                  style={{
                    height: `${Math.max(percentage * 2, 5)}px`,
                    backgroundColor: getColorForMood(moodKey),
                  }}
                >
                  <span className="text-xs font-medium text-white px-1 py-0.5">
                    {count}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {moodLabels[moodKey]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getColorForMood = (mood: string): string => {
    const colors: Record<string, string> = {
      very_happy: '#3B82F6', // blue
      happy: '#10B981', // green
      neutral: '#6B7280', // gray
      sad: '#9333EA', // purple
      very_sad: '#7C3AED', // violet
      anxious: '#FBBF24', // yellow
      angry: '#EF4444', // red
    };

    return colors[mood] || '#6B7280';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Mood Tracker</h2>
          <p className="text-gray-600 text-sm">
            Track and visualize your emotional wellbeing
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsAddingEntry(true)}>
            <PlusCircle size={16} className="mr-2" />
            Log Mood
          </Button>

          <Button variant="secondary" onClick={handleExportData}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {isAddingEntry ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Log Your Mood
          </h3>
          <MoodEntryForm
            onSave={handleSaveMoodEntry}
            onCancel={() => setIsAddingEntry(false)}
          />
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Average Mood Card */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="text-sm text-gray-500">Average Mood</div>
              <div className="mt-2 flex items-center">
                <span className="text-3xl font-bold text-gray-800">
                  {moodInsights?.averageMoodScore.toFixed(1) || '0.0'}
                </span>
                <span className="text-xl ml-2">
                  {Number(moodInsights?.averageMoodScore || 0) > 0
                    ? '🙂'
                    : Number(moodInsights?.averageMoodScore || 0) < 0
                    ? '😔'
                    : '😐'}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                On a scale from -5 to +5
              </div>
            </div>

            {/* Most Common Mood Card */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="text-sm text-gray-500">Most Common Mood</div>
              {moodInsights?.mostCommonMood ? (
                <div className="mt-2 flex items-center">
                  <span className="text-3xl">
                    {moodEmojis[
                      moodInsights.mostCommonMood as keyof typeof moodEmojis
                    ] || '😐'}
                  </span>
                  <span className="ml-2 text-lg font-medium text-gray-800">
                    {moodLabels[
                      moodInsights.mostCommonMood as keyof typeof moodLabels
                    ] || 'Neutral'}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-gray-500">No data available</div>
              )}
              <div className="mt-1 text-sm text-gray-600">
                {moodInsights?.moodDistribution?.[
                  moodInsights.mostCommonMood || 'neutral'
                ] || 0}{' '}
                entries
              </div>
            </div>

            {/* Recent Trend Card */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="text-sm text-gray-500">Recent Trend</div>
              {moodInsights?.recentTrend ? (
                <div className="mt-2 flex items-center">
                  <span className="text-2xl">
                    {moodInsights.recentTrend === 'improving'
                      ? '↗️'
                      : moodInsights.recentTrend === 'declining'
                      ? '↘️'
                      : '→'}
                  </span>
                  <span className="ml-2 text-lg font-medium text-gray-800">
                    {moodInsights.recentTrend === 'improving'
                      ? 'Improving'
                      : moodInsights.recentTrend === 'declining'
                      ? 'Declining'
                      : 'Stable'}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-gray-500">No data available</div>
              )}
              <div className="mt-1 text-sm text-gray-600">
                Based on recent entries
              </div>
            </div>
          </div>

          {/* Mood Chart */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                Your Mood Over Time
              </h3>

              <div className="flex items-center space-x-4">
                {/* Time range selector */}
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

                {/* Chart type toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    className={`px-3 py-1 text-sm flex items-center ${
                      chartView === 'line'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setChartView('line')}
                  >
                    <LineChart size={16} className="mr-1" />
                    Line
                  </button>
                  <button
                    className={`px-3 py-1 text-sm flex items-center ${
                      chartView === 'bar'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setChartView('bar')}
                  >
                    <BarChart3 size={16} className="mr-1" />
                    Distribution
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : moodEntries.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No mood data available. Start tracking your mood to see
                insights.
              </div>
            ) : (
              <div className="pt-4 pb-8">
                {chartView === 'line' ? renderLineChart() : renderBarChart()}
              </div>
            )}
          </div>

          {/* Insights Section */}
          {moodInsights && (
            <div className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Mood Insights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Positive Factors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Factors Associated With Better Mood
                  </h4>

                  {moodInsights.factorAnalysis.positive.length > 0 ? (
                    <div className="space-y-2">
                      {moodInsights.factorAnalysis.positive.map((item) => (
                        <div key={item.factor} className="flex items-center">
                          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.abs(item.score) * 20
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-700 min-w-20">
                            {item.factor}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Not enough data to identify positive factors yet.
                    </p>
                  )}
                </div>

                {/* Negative Factors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Factors Associated With Lower Mood
                  </h4>

                  {moodInsights.factorAnalysis.negative.length > 0 ? (
                    <div className="space-y-2">
                      {moodInsights.factorAnalysis.negative.map((item) => (
                        <div key={item.factor} className="flex items-center">
                          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.abs(item.score) * 20
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-700 min-w-20">
                            {item.factor}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Not enough data to identify negative factors yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Personalized Recommendations
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                  {moodInsights.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recent Entries */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Recent Mood Entries
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : moodEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No mood entries yet. Start by logging your mood.
              </div>
            ) : (
              <div className="space-y-4">
                {moodEntries
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 5)
                  .map((entry) => (
                    <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">
                            {moodEmojis[entry.mood]}
                          </span>
                          <div>
                            <div className="font-medium text-gray-800">
                              {moodLabels[entry.mood]}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(entry.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {entry.source === 'manual'
                            ? 'Logged manually'
                            : 'From chat'}
                        </div>
                      </div>

                      {/* Use the MoodFactorsCard component here instead of inline code */}
                      {entry.factors && entry.factors.length > 0 && (
                        <MoodFactorsCard entry={entry} />
                      )}

                      {entry.notes && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">
                            Notes:
                          </div>
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MoodTrackerDashboard;
