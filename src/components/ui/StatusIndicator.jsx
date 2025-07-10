import React from 'react';
import { Wifi, WifiOff, Database, User, Settings } from 'lucide-react';

const StatusIndicator = ({ 
  type, 
  status, 
  label, 
  details,
  onAction,
  showDetails = false,
  className = '' 
}) => {
  const getIcon = () => {
    switch(type) {
      case 'firebase': return <Database size={16} />;
      case 'api': return status === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />;
      case 'user': return <User size={16} />;
      default: return null;
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'connected':
      case 'active':
      case 'valid': return 'bg-green-500';
      case 'connecting':
      case 'loading': return 'bg-blue-500 animate-pulse';
      case 'error':
      case 'invalid':
      case 'missing': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getContainerColor = () => {
    switch(status) {
      case 'connected':
      case 'active':
      case 'valid': return 'bg-green-50 border-green-200 text-green-700';
      case 'connecting':
      case 'loading': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'error':
      case 'invalid':
      case 'missing': return 'bg-red-50 border-red-200 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getContainerColor()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          {getIcon()}
          <span className="text-sm font-medium">{label}</span>
        </div>
        
        {onAction && (
          <button
            onClick={onAction}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Settings size={14} />
          </button>
        )}
      </div>
      
      {showDetails && details && (
        <div className="mt-2 text-xs space-y-1">
          {Array.isArray(details) ? (
            details.map((detail, index) => (
              <div key={index} className="flex justify-between">
                <span>{detail.label}:</span>
                <span className="font-medium">{detail.value}</span>
              </div>
            ))
          ) : (
            <p>{details}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
