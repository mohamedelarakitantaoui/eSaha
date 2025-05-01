// src/components/Logo.tsx

// BEFORE:
import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      {/* Reduce the size of the logo container */}
      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md">
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

// AFTER (replace with this):
import React from 'react';
import { Link } from 'react-router-dom';

export const Logo: React.FC = () => {
  return (
    <Link to="/dashboard" className="flex items-center">
      {/* Reduce the size of the logo container */}
      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md">
        <img
          src="/esaha-logo.svg"
          alt="eSaha"
          className="w-full h-full object-contain"
        />
      </div>
      <span className="ml-2 text-indigo-600 font-semibold">eSaha</span>
    </Link>
  );
};
