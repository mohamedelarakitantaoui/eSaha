import React from 'react';

interface SupportQuestionCardProps {
  question: string;
  onClick: () => void;
}

export const SupportQuestionCard: React.FC<SupportQuestionCardProps> = ({
  question,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-md bg-white text-left border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <p className="text-gray-800 font-medium">{question}</p>
      <div className="flex justify-end mt-2">
        <span className="text-sm text-indigo-600">Ask this &rarr;</span>
      </div>
    </button>
  );
};
