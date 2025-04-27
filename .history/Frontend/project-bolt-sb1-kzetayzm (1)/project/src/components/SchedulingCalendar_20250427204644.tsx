// SchedulingCalendar.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Users,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  start_time: string; // HH:MM format
  end_time?: string; // HH:MM format
  type: 'therapy' | 'check_in' | 'support_group' | 'other';
  location?: string;
  reminder_time?: number; // minutes before appointment
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAppointment: boolean;
  appointments: Appointment[];
}

const AppointmentForm: React.FC<{
  appointment?: Appointment;
  onSave: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  onCancel: () => void;
}> = ({ appointment, onSave, onCancel }) => {
  const [title, setTitle] = useState(appointment?.title || '');
  const [description, setDescription] = useState(
    appointment?.description || ''
  );
  const [date, setDate] = useState(
    appointment?.date
      ? new Date(appointment.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    appointment?.start_time || '09:00'
  );
  const [endTime, setEndTime] = useState(appointment?.end_time || '10:00');
  const [type, setType] = useState<
    'therapy' | 'check_in' | 'support_group' | 'other'
  >(appointment?.type || 'check_in');
  const [location, setLocation] = useState(appointment?.location || '');
  const [reminderTime, setReminderTime] = useState(
    appointment?.reminder_time?.toString() || '30'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      title,
      description,
      date,
      start_time: startTime,
      end_time: endTime || undefined,
      type,
      location: location || undefined,
      reminder_time: reminderTime ? parseInt(reminderTime, 10) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              error={errors.startTime}
              required
            />

            <Input
              label="End Time (optional)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Appointment Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="check_in">Check-in</option>
            <option value="therapy">Therapy Session</option>
            <option value="support_group">Support Group</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Input
          label="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Office, video call, etc."
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Reminder (minutes before)
          </label>
          <select
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="0">No reminder</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="1440">1 day</option>
          </select>
        </div>
      </div>

      <div className="pt-4 flex space-x-3">
        <Button type="submit" className="flex-1">
          Save Appointment
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

const AppointmentCard: React.FC<{
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}> = ({ appointment, onEdit, onDelete, onToggleStatus }) => {
  // Format the date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get icon for appointment type
  const getAppointmentIcon = () => {
    switch (appointment.type) {
      case 'therapy':
        return <Calendar className="text-indigo-600" size={18} />;
      case 'check_in':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'support_group':
        return <Users className="text-blue-600" size={18} />;
      default:
        return <Calendar className="text-gray-600" size={18} />;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 ${
        appointment.status === 'cancelled' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          {getAppointmentIcon()}
          <div className="ml-2">
            <h3 className="font-medium text-gray-800">
              {appointment.title}
              {appointment.status === 'cancelled' && (
                <span className="ml-2 text-xs text-red-600 font-normal">
                  (Cancelled)
                </span>
              )}
              {appointment.status === 'completed' && (
                <span className="ml-2 text-xs text-green-600 font-normal">
                  (Completed)
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-500">
              {formatDate(appointment.date)} • {appointment.start_time}
              {appointment.end_time && ` - ${appointment.end_time}`}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onToggleStatus}
            className={`text-sm ${
              appointment.status === 'completed'
                ? 'text-gray-400 hover:text-gray-600'
                : 'text-green-500 hover:text-green-700'
            }`}
            title={
              appointment.status === 'completed'
                ? 'Mark as not completed'
                : 'Mark as completed'
            }
          >
            <CheckCircle size={18} />
          </button>

          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-600"
            title="Edit appointment"
          >
            <Calendar size={18} />
          </button>

          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600"
            title="Delete appointment"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {appointment.description && (
        <p className="text-gray-600 text-sm mt-2 mb-2">
          {appointment.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {appointment.type && (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            {appointment.type.replace('_', ' ')}
          </span>
        )}

        {appointment.location && (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            {appointment.location}
          </span>
        )}

        {appointment.reminder_time !== undefined &&
          appointment.reminder_time > 0 && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full flex items-center">
              <Clock size={12} className="mr-1" />
              Reminder:{' '}
              {appointment.reminder_time >= 60
                ? `${Math.floor(appointment.reminder_time / 60)} hour${
                    appointment.reminder_time >= 120 ? 's' : ''
                  }`
                : `${appointment.reminder_time} min`}
            </span>
          )}
      </div>
    </div>
  );
};

const SchedulingCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  // Load appointments when component mounts
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update calendar days when current date or appointments change
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, appointments, generateCalendarDays]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await API.appointments.getAllAppointments(token);
      setAppointments(response);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');

      // Fallback to mock data for demo purposes
      setAppointments([
        {
          id: '1',
          title: 'Therapy Session with Dr. Johnson',
          description: 'Regular weekly therapy session',
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15)
            .toISOString()
            .split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          type: 'therapy',
          location: 'Memorial Medical Building, Room 302',
          reminder_time: 60,
          status: 'scheduled',
        },
        {
          id: '2',
          title: 'Weekly Check-in',
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20)
            .toISOString()
            .split('T')[0],
          start_time: '15:30',
          type: 'check_in',
          reminder_time: 30,
          status: 'scheduled',
        },
        {
          id: '3',
          title: 'Anxiety Support Group',
          description: 'Group therapy for anxiety management',
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25)
            .toISOString()
            .split('T')[0],
          start_time: '18:00',
          end_time: '19:30',
          type: 'support_group',
          location: 'Community Center',
          reminder_time: 60,
          status: 'scheduled',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfCalendar = new Date(firstDayOfMonth);

    // Move to the previous Sunday (or stay if it's already Sunday)
    const day = firstDayOfMonth.getDay();
    if (day !== 0) {
      firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - day);
    }

    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calculate the last day to show in the calendar
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    const daysToAdd = 6 - lastDayOfMonth.getDay();
    if (daysToAdd > 0) {
      lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + daysToAdd);
    }

    // Generate the days array
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay: Date = new Date(firstDayOfCalendar);

    while (currentDay <= lastDayOfCalendar) {
      const currentDateString = currentDay.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(
        (appointment) => appointment.date === currentDateString
      );

      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.getTime() === today.getTime(),
        hasAppointment: dayAppointments.length > 0,
        appointments: dayAppointments,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    setCalendarDays(days);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);

    // If the day already has appointments, don't immediately open the form
    if (!day.hasAppointment) {
      setIsAddingAppointment(true);
    } else {
      setIsAddingAppointment(false);
    }
  };

  const handleAddAppointment = () => {
    setIsAddingAppointment(true);
    setEditingAppointmentId(null);
  };

  const handleSaveAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'status'>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      if (editingAppointmentId) {
        // Update existing appointment
        const updatedAppointment = await API.appointments.updateAppointment(
          token,
          editingAppointmentId,
          appointmentData
        );

        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === editingAppointmentId
              ? updatedAppointment
              : appointment
          )
        );

        setEditingAppointmentId(null);
      } else {
        // Create new appointment
        const newAppointment = await API.appointments.createAppointment(
          token,
          appointmentData
        );

        setAppointments((prevAppointments) => [
          ...prevAppointments,
          newAppointment,
        ]);
      }

      setIsAddingAppointment(false);
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('Failed to save appointment');

      // Fallback for demo purposes
      const mockId = `temp_${Date.now()}`;

      if (editingAppointmentId) {
        // Update existing appointment locally
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === editingAppointmentId
              ? {
                  ...appointmentData,
                  id: editingAppointmentId,
                  status: 'scheduled',
                }
              : appointment
          )
        );

        setEditingAppointmentId(null);
      } else {
        // Add new appointment locally
        setAppointments((prevAppointments) => [
          ...prevAppointments,
          { ...appointmentData, id: mockId, status: 'scheduled' },
        ]);
      }

      setIsAddingAppointment(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAppointment = (appointmentId: string) => {
    setEditingAppointmentId(appointmentId);
    setIsAddingAppointment(true);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      await API.appointments.deleteAppointment(token, appointmentId);

      setAppointments((prevAppointments) =>
        prevAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        )
      );
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment');

      // Fallback for demo purposes
      setAppointments((prevAppointments) =>
        prevAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAppointmentStatus = async (appointmentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Find the current appointment
      const appointment = appointments.find((a) => a.id === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Toggle between scheduled and completed
      const newStatus =
        appointment.status === 'completed' ? 'scheduled' : 'completed';

      const updatedAppointment = await API.appointments.updateAppointmentStatus(
        token,
        appointmentId,
        newStatus
      );

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId ? updatedAppointment : appointment
        )
      );
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status');

      // Fallback for demo purposes
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) => {
          if (appointment.id === appointmentId) {
            return {
              ...appointment,
              status:
                appointment.status === 'completed' ? 'scheduled' : 'completed',
            };
          }
          return appointment;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedDateAppointments = () => {
    if (!selectedDate) return [];

    const dateString = selectedDate.toISOString().split('T')[0];
    return appointments.filter(
      (appointment) => appointment.date === dateString
    );
  };

  const renderDaysOfWeek = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCalendarDays = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-12 p-1 border rounded-lg cursor-pointer 
              ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} 
              ${day.isToday ? 'border-indigo-500' : 'border-gray-200'}
              ${
                selectedDate && day.date.getTime() === selectedDate.getTime()
                  ? 'ring-2 ring-indigo-500'
                  : ''
              }
              hover:bg-gray-50 transition-colors
            `}
            onClick={() => handleDateClick(day)}
          >
            <div className="text-right text-sm font-medium mb-1">
              {day.date.getDate()}
            </div>

            {day.hasAppointment && (
              <div className="flex justify-center">
                <div
                  className={`
                  h-1.5 w-1.5 rounded-full 
                  ${
                    day.appointments.some((a) => a.type === 'therapy')
                      ? 'bg-indigo-600'
                      : day.appointments.some((a) => a.type === 'check_in')
                      ? 'bg-green-600'
                      : 'bg-blue-600'
                  }
                `}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Get the appointment being edited, if any
  const editingAppointment = editingAppointmentId
    ? appointments.find(
        (appointment) => appointment.id === editingAppointmentId
      )
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Appointments</h2>
          <p className="text-gray-600 text-sm">
            Schedule and manage your appointments
          </p>
        </div>

        <Button
          onClick={handleAddAppointment}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add Appointment</span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={goToPreviousMonth}
              className="text-white hover:text-indigo-200 focus:outline-none"
            >
              <ChevronLeft size={20} />
            </button>

            <h3 className="text-lg font-medium">
              {currentDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>

            <button
              onClick={goToNextMonth}
              className="text-white hover:text-indigo-200 focus:outline-none"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-4">
          {renderDaysOfWeek()}
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {!isAddingAppointment && (
              <Button
                onClick={handleAddAppointment}
                className="flex items-center gap-2 text-sm py-1.5"
              >
                <Plus size={16} />
                <span>Add to This Day</span>
              </Button>
            )}
          </div>

          {isAddingAppointment ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">
                  {editingAppointmentId
                    ? 'Edit Appointment'
                    : 'New Appointment'}
                </h4>
                <button
                  onClick={() => {
                    setIsAddingAppointment(false);
                    setEditingAppointmentId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <AppointmentForm
                appointment={editingAppointment}
                onSave={handleSaveAppointment}
                onCancel={() => {
                  setIsAddingAppointment(false);
                  setEditingAppointmentId(null);
                }}
              />
            </div>
          ) : (
            <>
              {getSelectedDateAppointments().length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No appointments scheduled for this day.
                </div>
              ) : (
                <div className="space-y-3">
                  {getSelectedDateAppointments().map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={() => handleEditAppointment(appointment.id)}
                      onDelete={() => handleDeleteAppointment(appointment.id)}
                      onToggleStatus={() =>
                        handleToggleAppointmentStatus(appointment.id)
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Upcoming Appointments */}
      {!selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Upcoming Appointments
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : appointments.filter((a) => a.status === 'scheduled').length ===
            0 ? (
            <div className="text-center py-6 text-gray-500">
              No upcoming appointments scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .filter((a) => a.status === 'scheduled')
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .slice(0, 5)
                .map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={() => handleEditAppointment(appointment.id)}
                    onDelete={() => handleDeleteAppointment(appointment.id)}
                    onToggleStatus={() =>
                      handleToggleAppointmentStatus(appointment.id)
                    }
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;
