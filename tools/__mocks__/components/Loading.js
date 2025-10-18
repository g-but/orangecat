const React = require('react');

const Loading = ({ message = 'Loading...', fullScreen = false, size = 'medium', overlay = false, className = '' }) => {
  return React.createElement('div', {
    'data-testid': 'loading-component',
    className: fullScreen ? 'min-h-screen flex items-center justify-center' : 'flex items-center justify-center'
  }, message);
};

Loading.displayName = 'Loading';

module.exports = Loading;
module.exports.default = Loading;
