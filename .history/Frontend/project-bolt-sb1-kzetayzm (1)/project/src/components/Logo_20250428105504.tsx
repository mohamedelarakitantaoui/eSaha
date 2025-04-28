import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      {/* Reduce the size of the logo container */}
      <div className="w-12 h-12">
        {' '}
        {/* Adjust these values to make it smaller */}
        <img
          src="/esaha-logo.svg"
          alt="eSaha"
          className="w-full h-full object-contain"
        />
      </div>
      <span className="ml-2 text-indigo-600 font-semibold">eSaha</span>
    </div>
  );
};
