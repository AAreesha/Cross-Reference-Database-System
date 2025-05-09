import React from 'react';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="relative h-16 w-16">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute h-3 w-3 rounded-full bg-indigo-600"
            style={{
              top: `${50 - 40 * Math.cos(2 * Math.PI * i / 8)}%`,
              left: `${50 - 40 * Math.sin(2 * Math.PI * i / 8)}%`,
              opacity: 0.2 + (i / 10),
              animation: `dot-spin 1.5s linear infinite ${i * 0.15}s`
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes dot-spin {
          0% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.5);
          }
          40% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
