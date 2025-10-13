const React = require('react');

const Hero = () => {
  return React.createElement('section', {
    'data-testid': 'hero-component'
  },
    React.createElement('h1', null, 'The Bitcoin Yellow Pages'),
    React.createElement('p', null, 'Connect with Bitcoin creators and supporters')
  );
};

Hero.displayName = 'Hero';

module.exports = Hero;
module.exports.default = Hero;
