export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}