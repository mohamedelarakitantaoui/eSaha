export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id?: string;
  senderId: string;
  recipientId: string; // Add this property
  content: string;
  timestamp: string;
}
