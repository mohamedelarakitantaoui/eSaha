import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img src="/esaha-logo.svg" alt="eSaha" />
      <span className="text-indigo-600 font-semibold text-xl">eSaha</span>
    </div>
  );
};
