// Re-export components for easy imports
export { Sidebar } from './Sidebar';
export { Logo } from './Logo';
export { Button } from './Button';
export { Input } from './Input';
export { SupportQuestionCard } from './SupportQuestionCard';
export { DashboardLayout } from './DashboardLayout';

// Import the default export of ChatInterface and re-export it
import ChatInterface from './ChatInterface';
export { ChatInterface };
