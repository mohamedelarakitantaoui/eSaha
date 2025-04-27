import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Edit,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  notify_for?: ('crisis' | 'mood_decline' | 'missed_checkin')[];
}

interface EmergencyContactFormProps {
  contact?: EmergencyContact;
  onSave: (contact: Omit<EmergencyContact, 'id'>) => void;
  onCancel: () => void;
}

const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({
  contact,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(contact?.name || '');
  const [relationship, setRelationship] = useState(contact?.relationship || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [notifyCrisis, setNotifyCrisis] = useState(
    contact?.notify_for?.includes('crisis') || false
  );
  const [notifyMoodDecline, setNotifyMoodDecline] = useState(
    contact?.notify_for?.includes('mood_decline') || false
  );
  const [notifyMissedCheckin, setNotifyMissedCheckin] = useState(
    contact?.notify_for?.includes('missed_checkin') || false
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }

    if (!phone.trim() && !email.trim()) {
      newErrors.contact = 'Either phone or email is required';
    }

    if (
      phone.trim() &&
      !/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-()]/g, ''))
    ) {
      newErrors.phone = 'Invalid phone number';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const notify_for: ('crisis' | 'mood_decline' | 'missed_checkin')[] = [];
    if (notifyCrisis) notify_for.push('crisis');
    if (notifyMoodDecline) notify_for.push('mood_decline');
    if (notifyMissedCheckin) notify_for.push('missed_checkin');

    onSave({
      name,
      relationship,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notify_for,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
      />

      <Input
        label="Relationship"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
        placeholder="e.g. Parent, Friend, Therapist"
        error={errors.relationship}
        required
      />

      <Input
        label="Phone Number"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 (555) 123-4567"
        error={errors.phone || errors.contact}
      />

      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="contact@example.com"
        error={errors.email}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Notification Settings
        </label>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notify-crisis"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              checked={notifyCrisis}
              onChange={(e) => setNotifyCrisis(e.target.checked)}
            />
            <label
              htmlFor="notify-crisis"
              className="ml-2 text-sm text-gray-700"
            >
              Crisis alerts (when panic button is activated)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="notify-mood"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              checked={notifyMoodDecline}
              onChange={(e) => setNotifyMoodDecline(e.target.checked)}
            />
            <label htmlFor="notify-mood" className="ml-2 text-sm text-gray-700">
              Mood decline alerts (optional)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="notify-checkin"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              checked={notifyMissedCheckin}
              onChange={(e) => setNotifyMissedCheckin(e.target.checked)}
            />
            <label
              htmlFor="notify-checkin"
              className="ml-2 text-sm text-gray-700"
            >
              Missed check-in alerts (optional)
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4 flex space-x-3">
        <Button type="submit" className="flex-1">
          Save Contact
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

const EmergencyContactsManager: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not available');
        }

        const response = await API.emergency.getContacts(token);
        setContacts(response);
      } catch (err) {
        console.error('Error fetching emergency contacts:', err);
        setError('Failed to load emergency contacts');

        // Fallback to mock data for demo purposes
        setContacts([
          {
            id: '1',
            name: 'Jane Smith',
            relationship: 'Sister',
            phone: '555-123-4567',
            email: 'jane@example.com',
            notify_for: ['crisis', 'mood_decline'],
          },
          {
            id: '2',
            name: 'Dr. Michael Johnson',
            relationship: 'Therapist',
            phone: '555-987-6543',
            notify_for: ['crisis'],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [getToken]);

  const handleAddContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const newContact = await API.emergency.addContact(token, contact);
      setContacts((prevContacts) => [...prevContacts, newContact]);
      setIsAddingContact(false);
    } catch (err) {
      console.error('Error adding emergency contact:', err);
      setError('Failed to add emergency contact');

      // Fallback for demo purposes - add with a fake ID
      const mockId = `temp_${Date.now()}`;
      setContacts((prevContacts) => [
        ...prevContacts,
        { id: mockId, ...contact },
      ]);
      setIsAddingContact(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateContact = async (
    contactId: string,
    contactData: Omit<EmergencyContact, 'id'>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const updatedContact = await API.emergency.updateContact(
        token,
        contactId,
        contactData
      );
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactId ? { ...updatedContact } : contact
        )
      );
      setEditingContactId(null);
    } catch (err) {
      console.error('Error updating emergency contact:', err);
      setError('Failed to update emergency contact');

      // Fallback for demo purposes
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactId ? { id: contactId, ...contactData } : contact
        )
      );
      setEditingContactId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (
      !window.confirm('Are you sure you want to remove this emergency contact?')
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      await API.emergency.deleteContact(token, contactId);
      setContacts((prevContacts) =>
        prevContacts.filter((contact) => contact.id !== contactId)
      );
    } catch (err) {
      console.error('Error deleting emergency contact:', err);
      setError('Failed to delete emergency contact');

      // Fallback for demo purposes
      setContacts((prevContacts) =>
        prevContacts.filter((contact) => contact.id !== contactId)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContactCard = (contact: EmergencyContact) => {
    if (editingContactId === contact.id) {
      return (
        <div key={contact.id} className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Edit Contact
          </h3>
          <EmergencyContactForm
            contact={contact}
            onSave={(data) => handleUpdateContact(contact.id, data)}
            onCancel={() => setEditingContactId(null)}
          />
        </div>
      );
    }

    return (
      <div key={contact.id} className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-full p-2 mr-3">
              <User size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {contact.name}
              </h3>
              <p className="text-sm text-gray-600">{contact.relationship}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setEditingContactId(contact.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Edit contact"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => handleDeleteContact(contact.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Delete contact"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {contact.phone && (
            <div className="flex items-center text-sm">
              <Phone size={16} className="text-gray-400 mr-2" />
              <span className="text-gray-700">{contact.phone}</span>
            </div>
          )}

          {contact.email && (
            <div className="flex items-center text-sm">
              <Mail size={16} className="text-gray-400 mr-2" />
              <span className="text-gray-700">{contact.email}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Notifications:</p>
          <div className="flex flex-wrap gap-2">
            {contact.notify_for?.includes('crisis') && (
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                Crisis Alerts
              </span>
            )}

            {contact.notify_for?.includes('mood_decline') && (
              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                Mood Decline
              </span>
            )}

            {contact.notify_for?.includes('missed_checkin') && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                Missed Check-ins
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Emergency Contacts
          </h2>
          <p className="text-gray-600 text-sm">
            People who can help when you need support
          </p>
        </div>

        {!isAddingContact && (
          <Button onClick={() => setIsAddingContact(true)}>Add Contact</Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {isLoading && !isAddingContact && !editingContactId && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {isAddingContact && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Add New Contact
          </h3>
          <EmergencyContactForm
            onSave={handleAddContact}
            onCancel={() => setIsAddingContact(false)}
          />
        </div>
      )}

      {contacts.length === 0 && !isLoading && !isAddingContact ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-4">
            <Shield size={48} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Emergency Contacts
          </h3>
          <p className="text-gray-500 mb-6">
            Add trusted contacts who can help you during difficult times.
          </p>
          <Button onClick={() => setIsAddingContact(true)} className="mx-auto">
            Add First Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-4">{contacts.map(renderContactCard)}</div>
      )}
    </div>
  );
};

export default EmergencyContactsManager;
