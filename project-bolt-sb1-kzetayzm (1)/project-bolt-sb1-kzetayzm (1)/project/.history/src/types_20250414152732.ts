export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

// In your types.ts file (or wherever you define your types):
export interface Message {
  id?: string;
  senderId: string;
  recipientId: string; // Add this property
  content: string;
  timestamp: string;
}
