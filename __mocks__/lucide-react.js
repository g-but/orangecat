// Jest mock for lucide-react icons
const React = require('react');

// Create a mock icon component that renders with proper test IDs
const createMockIcon = (name) => {
  const MockIcon = (props) => {
    return React.createElement('svg', {
      'data-testid': props['data-testid'] || `icon-${name.toLowerCase()}`,
      className: props.className,
      'aria-hidden': 'true',
      ...props
    });
  };
  
  MockIcon.displayName = name;
  MockIcon.name = name;
  
  return MockIcon;
};

// Export mocked icons
module.exports = {
  Mail: createMockIcon('Mail'),
  Lock: createMockIcon('Lock'),
  Bitcoin: createMockIcon('Bitcoin'),
  User: createMockIcon('User'),
  Search: createMockIcon('Search'),
  Key: createMockIcon('Key'),
  Eye: createMockIcon('Eye'),
  EyeOff: createMockIcon('EyeOff'),
  Plus: createMockIcon('Plus'),
  Minus: createMockIcon('Minus'),
  X: createMockIcon('X'),
  Check: createMockIcon('Check'),
  ChevronDown: createMockIcon('ChevronDown'),
  ChevronUp: createMockIcon('ChevronUp'),
  ChevronLeft: createMockIcon('ChevronLeft'),
  ChevronRight: createMockIcon('ChevronRight'),
  Star: createMockIcon('Star'),
  Heart: createMockIcon('Heart'),
  Share: createMockIcon('Share'),
  Copy: createMockIcon('Copy'),
  ExternalLink: createMockIcon('ExternalLink'),
  Download: createMockIcon('Download'),
  Upload: createMockIcon('Upload'),
  Edit: createMockIcon('Edit'),
  Trash: createMockIcon('Trash'),
  Settings: createMockIcon('Settings'),
  Menu: createMockIcon('Menu'),
  Home: createMockIcon('Home'),
  Users: createMockIcon('Users'),
  Building: createMockIcon('Building'),
  MapPin: createMockIcon('MapPin'),
  Globe: createMockIcon('Globe'),
  Twitter: createMockIcon('Twitter'),
  Github: createMockIcon('Github'),
  Code: createMockIcon('Code'),
  Zap: createMockIcon('Zap'),
  Shield: createMockIcon('Shield'),
  GitBranch: createMockIcon('GitBranch')
}; 