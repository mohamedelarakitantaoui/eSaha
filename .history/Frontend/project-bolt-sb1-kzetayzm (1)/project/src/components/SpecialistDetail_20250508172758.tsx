import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
} from 'lucide-react';
import API, { Specialist, TimeSlot } from '../services/api';
import useAuth from '../contexts/useAuth';

interface SpecialistDetailProps {
  specialistId: string;
  onBack: () => void;
}

const SpecialistDetail: React.FC<SpecialistDetailProps> = ({
  specialistId,
  onBack,
}) => {
  const { accessToken } = useAuth();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For appointment booking
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch available dates for the selected month - using useCallback to memoize
  const fetchAvailableDates = useCallback(
    async (id: string) => {
      if (!accessToken) return;

      try {
        const dates = await API.specialists.getAvailableDates(
          accessToken,
          id,
          selectedYear,
          selectedMonth
        );

        setAvailableDates(dates);
        // Reset selected date and time slot when dates change
        setSelectedDate('');
        setSelectedTimeSlot(null);
      } catch (err) {
        console.error('Failed to fetch available dates:', err);
        setError('Failed to load available dates. Please try again.');
      }
    },
    [accessToken, selectedMonth, selectedYear]
  );

  // Fetch specialist details
  useEffect(() => {
    const fetchSpecialistDetails = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);
        setError(null);

        // In production, this would use the API
        // const data = await API.specialists.getSpecialistById(accessToken, specialistId);

        // For now, use the mock data from the main page
        const mockSpecialists = [
          {
            id: '1',
            name: 'Aure Veyssière',
            title: 'Assistant Professor / Counselor',
            specialties: [
              'Counseling',
              'Academic Support',
              'Stress Management',
            ],
            description:
              'Experienced counselor specializing in helping students navigate academic challenges and personal growth.',
            availability: 'Available',
            nextAvailable: 'Today, 2:00 PM',
            rating: 4.9,
            reviews: 78,
            price: 'Free for students',
            location: 'Building 6, room 108',
            phone: '+212 5355-62000 ext. 3108',
            email: 'a.veyssiere@aui.ma',
            website: 'https://www.aui.ma/counseling',
            imageUrl: '/api/placeholder/300/300',
          },
          {
            id: '2',
            name: 'Imane Boukhare',
            title: 'Full-time Counselor',
            specialties: ['Anxiety', 'Depression', 'Student Wellness'],
            description:
              'Dedicated counselor focused on supporting students through personal challenges and promoting mental wellbeing.',
            availability: 'Available',
            nextAvailable: 'Today, 4:00 PM',
            rating: 4.8,
            reviews: 65,
            price: 'Free for students',
            location: 'Building 8b, room 203',
            phone: '+212 5355-62000 ext. 2203',
            email: 'i.boukhare@aui.ma',
            website: 'https://www.aui.ma/counseling',
            imageUrl: '/api/placeholder/300/300',
          },
          {
            id: '3',
            name: 'Mohamed Ghali Guissi',
            title: 'Full-time Counselor',
            specialties: [
              'Career Guidance',
              'Life Transitions',
              'Personal Development',
            ],
            description:
              'Experienced counselor dedicated to helping students navigate life transitions and achieve personal growth.',
            availability: 'Busy',
            nextAvailable: 'Tomorrow, 10:00 AM',
            rating: 4.7,
            reviews: 82,
            price: 'Free for students',
            location: 'Building 8b, room 309',
            phone: '+212 5355-62000 ext. 2309',
            email: 'm.guissi@aui.ma',
            website: 'https://www.aui.ma/counseling',
            imageUrl: '/api/placeholder/300/300',
          },
          {
            id: '4',
            name: 'Prof. Jallal Toufiq',
            title: 'Part-time Psychiatrist',
            specialties: [
              'Psychiatric Assessment',
              'Medication Management',
              'Mental Health',
            ],
            description:
              'Experienced psychiatrist providing specialized mental health support for students with complex needs. Available on campus Thursday afternoons.',
            availability: 'Limited',
            nextAvailable: 'Thursday afternoon',
            rating: 4.9,
            reviews: 54,
            price: 'Free for students',
            location: 'Building 6, room 108',
            phone: '+212 5355-62000 ext. 3108',
            email: 'j.toufiq@aui.ma',
            website: 'https://www.aui.ma/health-center',
            imageUrl: '/api/placeholder/300/300',
          },
          {
            id: '5',
            name: 'Dr. El Jarrafi',
            title: 'Part-time Psychiatrist',
            specialties: [
              'Clinical Psychiatry',
              'Crisis Intervention',
              'Mental Health Support',
            ],
            description:
              'Licensed psychiatrist offering expert mental health care and support for students facing psychological challenges. Available on campus Monday afternoons.',
            availability: 'Limited',
            nextAvailable: 'Monday afternoon',
            location: 'Building 26, Health center',
            phone: '+212 5355-62000 ext. 2601',
            email: 'el.jarrafi@aui.ma',
            website: 'https://www.aui.ma/health-center',
            rating: 4.8,
            reviews: 46,
            price: 'Free for students',
            imageUrl: '/api/placeholder/300/300',
          },
        ];

        const foundSpecialist =
          mockSpecialists.find((s) => s.id === specialistId) || null;
        setSpecialist(foundSpecialist);

        // If we found a specialist, fetch their available dates
        if (foundSpecialist) {
          fetchAvailableDates(foundSpecialist.id);
        }
      } catch (err) {
        console.error('Failed to fetch specialist details:', err);
        setError('Failed to load specialist details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialistDetails();
  }, [accessToken, specialistId, fetchAvailableDates]);

  // Fetch available time slots for the selected date
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!accessToken || !selectedDate || !specialist) return;

      try {
        const slots = await API.specialists.getAvailableTimeSlots(
          accessToken,
          specialist.id,
          selectedDate
        );

        setAvailableTimeSlots(slots);
        setSelectedTimeSlot(null);
      } catch (err) {
        console.error('Failed to fetch time slots:', err);
        setError('Failed to load available time slots. Please try again.');
      }
    };

    fetchTimeSlots();
  }, [accessToken, selectedDate, specialist]);

  // Handle month change
  const handleMonthChange = (increment: number) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);

    if (specialist) {
      // Fetch available dates for the new month
      API.specialists
        .getAvailableDates(accessToken || '', specialist.id, newYear, newMonth)
        .then((dates) => {
          setAvailableDates(dates);
          setSelectedDate('');
          setSelectedTimeSlot(null);
        });
    }
  };

  // Book appointment
  const handleBookAppointment = async () => {
    if (!accessToken || !specialist || !selectedDate || !selectedTimeSlot)
      return;

    setBookingInProgress(true);
    setBookingError(null);

    try {
      const appointmentData = {
        specialist_id: specialist.id,
        date: selectedDate,
        start_time: selectedTimeSlot.start_time,
        end_time: selectedTimeSlot.end_time,
        title: `Appointment with ${specialist.name}`,
        type: 'therapy' as const,
        reminder_time: 60, // 1 hour reminder
      };

      await API.appointments.bookAppointment(accessToken, appointmentData);
      setBookingSuccess(true);

      // Reset selected date and time after successful booking
      setTimeout(() => {
        setSelectedDate('');
        setSelectedTimeSlot(null);
        setBookingSuccess(false);

        // Refresh available dates and times
        fetchAvailableDates(specialist.id);
      }, 3000);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setBookingError('Failed to book appointment. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Format month name
  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('en-US', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !specialist) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Counselors
        </button>

        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p className="font-medium">{error || 'Specialist not found'}</p>
          <button
            className="mt-2 text-blue-600 hover:text-blue-800"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 mb-6"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back to Counselors
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Specialist info section */}
          <div className="md:w-2/3 p-6">
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 h-20 w-20 rounded-full overflow-hidden bg-gray-200 mr-4">
                <img
                  src={specialist.imageUrl}
                  alt={specialist.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold">{specialist.name}</h1>
                <p className="text-gray-600">{specialist.title}</p>

                <div className="flex items-center mt-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1 font-medium">{specialist.rating}</span>
                  <span className="ml-1 text-gray-500 text-sm">
                    ({specialist.reviews} reviews)
                  </span>

                  <span
                    className={`ml-4 px-2 py-1 text-xs rounded-full ${
                      specialist.availability === 'Available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {specialist.availability}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {specialist.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                >
                  {specialty}
                </span>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-gray-700">{specialist.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {specialist.location && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">{specialist.location}</p>
                  </div>
                </div>
              )}

              {specialist.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">{specialist.phone}</p>
                  </div>
                </div>
              )}

              {specialist.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">{specialist.email}</p>
                  </div>
                </div>
              )}

              {specialist.website && (
                <div className="flex items-start">
                  <Globe className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a
                      href={specialist.website}
                      className="text-indigo-600 hover:text-indigo-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit website
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg mb-6">
              <h3 className="font-medium mb-1">Price</h3>
              <p className="text-indigo-700 font-semibold">
                {specialist.price}
              </p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Contact Options</h2>
              <div className="flex flex-wrap gap-3">
                {specialist.email && (
                  <a
                    href={`mailto:${specialist.email}`}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                  </a>
                )}

                {specialist.phone && (
                  <a
                    href={`tel:${specialist.phone.replace(/\s+/g, '')}`}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call
                  </a>
                )}

                <button
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    // Would typically open a chat interface
                    alert('Chat functionality would open here');
                  }}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat
                </button>
              </div>
            </div>
          </div>

          {/* Booking section */}
          <div className="md:w-1/3 bg-gray-50 p-6 border-l">
            <h2 className="text-xl font-semibold mb-4">Book an Appointment</h2>

            {/* Month selector */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="font-medium">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>

              <button
                onClick={() => handleMonthChange(1)}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="Next month"
              >
                <ChevronLeft className="h-5 w-5 transform rotate-180" />
              </button>
            </div>

            {/* Available dates */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Available Dates
              </h3>

              {availableDates.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No available dates for this month.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableDates.map((date) => {
                    const formattedDate = new Date(date).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    );

                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-2 rounded-md text-center text-sm ${
                          selectedDate === date
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 hover:border-indigo-500'
                        }`}
                      >
                        {formattedDate}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available time slots */}
            {selectedDate && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Available Times for{' '}
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>

                {availableTimeSlots.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No available time slots for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-2 rounded-md text-center text-sm ${
                          selectedTimeSlot?.id === slot.id
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 hover:border-indigo-500'
                        }`}
                      >
                        {slot.start_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Book button */}
            <button
              onClick={handleBookAppointment}
              disabled={!selectedTimeSlot || bookingInProgress}
              className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center ${
                selectedTimeSlot && !bookingInProgress
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {bookingInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </>
              )}
            </button>

            {/* Booking status messages */}
            {bookingSuccess && (
              <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                Appointment booked successfully! You will receive a confirmation
                email shortly.
              </div>
            )}

            {bookingError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                {bookingError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDetail;
