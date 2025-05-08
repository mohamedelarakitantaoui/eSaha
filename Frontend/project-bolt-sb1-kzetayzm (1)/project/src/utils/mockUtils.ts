import { TimeSlot, SpecialistAvailability } from '../services/api';

// Mock data for specialist availability
const mockSpecialistAvailability: Record<string, SpecialistAvailability[]> = {
  // Aure Veyssière
  '1': [
    {
      id: '101',
      specialist_id: '1',
      day_of_week: 1, // Monday
      start_time: '09:00',
      end_time: '12:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: '102',
      specialist_id: '1',
      day_of_week: 3, // Wednesday
      start_time: '14:00',
      end_time: '17:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ],
  // Imane Boukhare - UPDATED to include Monday (1) and all weekdays
  '2': [
    {
      id: '201',
      specialist_id: '2',
      day_of_week: 1, // Monday
      start_time: '10:00',
      end_time: '15:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: '202',
      specialist_id: '2',
      day_of_week: 2, // Tuesday
      start_time: '10:00',
      end_time: '15:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: '203',
      specialist_id: '2',
      day_of_week: 3, // Wednesday
      start_time: '13:00',
      end_time: '18:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: '204',
      specialist_id: '2',
      day_of_week: 4, // Thursday
      start_time: '13:00',
      end_time: '18:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: '205',
      specialist_id: '2',
      day_of_week: 5, // Friday
      start_time: '10:00',
      end_time: '15:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ],
  // Mohamed Ghali Guissi
  '3': [
    {
      id: '301',
      specialist_id: '3',
      day_of_week: 1,
      start_time: '13:00',
      end_time: '16:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: '302',
      specialist_id: '3',
      day_of_week: 5,
      start_time: '09:00',
      end_time: '12:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ],
  // Prof. Jallal Toufiq (Thursday afternoons only)
  '4': [
    {
      id: '401',
      specialist_id: '4',
      day_of_week: 4,
      start_time: '14:00',
      end_time: '17:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ],
  // Dr. El Jarrafi (Monday afternoons only)
  '5': [
    {
      id: '501',
      specialist_id: '5',
      day_of_week: 1,
      start_time: '13:00',
      end_time: '17:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ],
};

/**
 * Get available dates for a specialist in a given month
 */
export const getAvailableDatesForMonth = (
  specialistId: string,
  year: number,
  month: number
): string[] => {
  const availableDays =
    mockSpecialistAvailability[specialistId]?.map((a) => a.day_of_week) || [];

  if (availableDays.length === 0) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const availableDates: string[] = [];

  // Loop through each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    // Check if this day of week is in the available days
    if (availableDays.includes(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      // Format as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      availableDates.push(formattedDate);
    }
  }

  // Don't include past dates
  const today = new Date();
  return availableDates.filter((date) => new Date(date) >= today);
};

/**
 * Get available time slots for a specialist on a specific date
 * UPDATED to always return time slots regardless of date
 */
export const getAvailableTimeSlotsForDate = (
  specialistId: string,
  dateString: string
): TimeSlot[] => {
  // Get the day of week (0-6) from the date string
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();

  // Find availability records for this day of week
  const availabilityForDay =
    mockSpecialistAvailability[specialistId]?.filter(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    ) || [];

  // If no availability records found, create a default one to ensure time slots are available
  if (availabilityForDay.length === 0) {
    // For testing purposes - ensure every date has at least some time slots
    // In a real app, we would remove this and only show actual availability
    availabilityForDay.push({
      id: `default-${specialistId}-${dayOfWeek}`,
      specialist_id: specialistId,
      day_of_week: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
      created_at: '',
      updated_at: '',
    });
  }

  const timeSlots: TimeSlot[] = [];

  // For each availability block, generate 30-minute slots
  availabilityForDay.forEach((availability) => {
    const [startHour, startMinute] = availability.start_time
      .split(':')
      .map(Number);
    const [endHour, endMinute] = availability.end_time.split(':').map(Number);

    const currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generate 30-minute slots
    while (currentTime < endTime) {
      const startTimeString = `${currentTime
        .getHours()
        .toString()
        .padStart(2, '0')}:${currentTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      // Add 30 minutes for end time
      const slotEndTime = new Date(currentTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

      const endTimeString = `${slotEndTime
        .getHours()
        .toString()
        .padStart(2, '0')}:${slotEndTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      // Only add future time slots if date is today
      const now = new Date();
      if (
        date.getDate() !== now.getDate() ||
        date.getMonth() !== now.getMonth() ||
        date.getFullYear() !== now.getFullYear() ||
        currentTime > now
      ) {
        timeSlots.push({
          id: `${dateString}-${startTimeString}`,
          specialist_id: specialistId,
          date: dateString,
          start_time: startTimeString,
          end_time: endTimeString,
          is_available: true,
        });
      }

      // Increment by 30 minutes
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
  });

  return timeSlots;
};

/**
 * Mock API call to get available dates
 */
export const mockGetAvailableDates = async (
  specialistId: string,
  year: number,
  month: number
): Promise<string[]> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getAvailableDatesForMonth(specialistId, year, month);
};

/**
 * Mock API call to get available time slots
 */
export const mockGetAvailableTimeSlots = async (
  specialistId: string,
  dateString: string
): Promise<TimeSlot[]> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getAvailableTimeSlotsForDate(specialistId, dateString);
};
