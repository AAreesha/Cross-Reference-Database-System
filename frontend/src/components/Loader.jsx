// src/components/Loader.jsx
import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-32">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500 animate-spin"></div>

        {/* Small dots inside */}
        {[...Array(8)].map((_, index) => {
          const angle = (index * 360) / 8;
          const radius = 40; // circle radius
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <div
              key={index}
              className="absolute w-3 h-3 bg-purple-600 rounded-full"
              style={{
                top: `calc(50% + ${y / 2}px - 6px)`,
                left: `calc(50% + ${x / 2}px - 6px)`,
              }}
            ></div>
          );
        })}
      </div>
    </div>
  );
};

export default Loader;
