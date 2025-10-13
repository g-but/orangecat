// Mock for @/components/ui/button
import React from 'react';

export const Button = ({ children, onClick, className, variant, size, isLoading, href, ...props }) => {
  if (href) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={isLoading}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;