import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';

const NetworkStatus: React.FC = () => {
  const { isOnline, isOffline } = useNetwork();

  return (
    <div className="relative">
      {isOnline ? (
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
      ) : (
        <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg"></div>
      )}
    </div>
  );
};

export default NetworkStatus;