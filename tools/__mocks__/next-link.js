const React = require('react');

module.exports = ({ href, children, ...props }) => {
  return React.createElement('a', { href, ...props }, children);
};


