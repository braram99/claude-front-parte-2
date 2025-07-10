// src/components/ui/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  gradient = false,
  border = false,
  shadow = 'md',
  padding = 'lg',
  ...props 
}) => {
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg', 
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6',
    xl: 'p-8'
  };

  const baseClasses = 'bg-white rounded-xl';
  const gradientClass = gradient ? 'bg-gradient-to-br from-blue-50 to-indigo-100' : '';
  const borderClass = border ? 'border border-gray-200' : '';
  
  const classes = `${baseClasses} ${gradientClass} ${borderClass} ${shadows[shadow]} ${paddings[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
