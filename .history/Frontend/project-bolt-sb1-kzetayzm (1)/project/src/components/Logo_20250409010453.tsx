import { MessageSquare } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <MessageSquare className="w-8 h-8 text-indigo-600" />
      <span className="text-2xl font-bold text-gray-900">eSaha</span>
    </div>
  );
}
