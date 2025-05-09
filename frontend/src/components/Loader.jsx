import React from 'react';

const Loader= () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">Searching databases...</p>
    </div>
  );
};

export default Loader;
