// Mock for @/components/ui/input
import React from 'react';

export const Input = ({ value, onChange, placeholder, className, type, ...props }) => {
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

export default Input;