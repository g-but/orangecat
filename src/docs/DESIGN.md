# OrangCat Design System

## Color Palette

### Primary Colors
- **Tiffany Blue** (`#0ABAB5`)
  - Primary brand color
  - Used for main CTAs, important elements, and brand identity
  - Light variant: `#E6F7F7` (10% opacity)
  - Dark variant: `#089B96` (for hover states)

### Secondary Colors
- **Orange** (`#FF6B35`)
  - Accent color for Bitcoin-related elements
  - Used sparingly for emphasis and Bitcoin-specific features
  - Light variant: `#FFF0EB` (10% opacity)
  - Dark variant: `#E65A2F` (for hover states)

### Neutral Colors
- **Gray Scale**
  - `#1A1A1A` (Text)
  - `#4A4A4A` (Secondary Text)
  - `#8A8A8A` (Tertiary Text)
  - `#E5E5E5` (Borders)
  - `#F5F5F5` (Background)
  - `#FFFFFF` (White)

## Typography

### Font Family
- **Primary**: Inter
  - Clean, modern, and highly readable
  - Used for all body text and UI elements

### Font Sizes
- **Headings**
  - H1: 48px (3rem)
  - H2: 36px (2.25rem)
  - H3: 24px (1.5rem)
  - H4: 20px (1.25rem)
  - H5: 18px (1.125rem)
  - H6: 16px (1rem)

- **Body**
  - Large: 18px (1.125rem)
  - Regular: 16px (1rem)
  - Small: 14px (0.875rem)
  - Extra Small: 12px (0.75rem)

## Spacing

### Base Unit
- 4px (0.25rem)

### Spacing Scale
- 4px (0.25rem)
- 8px (0.5rem)
- 12px (0.75rem)
- 16px (1rem)
- 24px (1.5rem)
- 32px (2rem)
- 48px (3rem)
- 64px (4rem)
- 96px (6rem)

## Components

### Buttons
- **Primary Button**
  - Background: Tiffany Blue
  - Text: White
  - Padding: 12px 24px
  - Border Radius: 8px
  - Hover: Dark Tiffany Blue

- **Secondary Button**
  - Background: White
  - Text: Tiffany Blue
  - Border: 1px solid Tiffany Blue
  - Padding: 12px 24px
  - Border Radius: 8px
  - Hover: Light Tiffany Blue background

### Cards
- Background: White
- Border Radius: 12px
- Shadow: 0 4px 6px rgba(0, 0, 0, 0.05)
- Padding: 24px
- Border: 1px solid #E5E5E5

### Inputs
- Height: 40px
- Border Radius: 8px
- Border: 1px solid #E5E5E5
- Focus: 2px solid Tiffany Blue
- Padding: 0 12px

## Layout

### Grid System
- 12-column grid
- Max width: 1280px
- Gutter width: 24px
- Breakpoints:
  - Mobile: 0-640px
  - Tablet: 641-1024px
  - Desktop: 1025px+

### Container
- Max width: 1280px
- Padding: 0 24px
- Margin: 0 auto

## Motion

### Transitions
- Default duration: 0.3s
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

### Animations
- Fade in: 0.3s
- Slide in: 0.3s
- Scale: 0.2s

## Accessibility

### Color Contrast
- Text on background: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Minimum 3:1

### Focus States
- Visible outline: 2px solid Tiffany Blue
- Offset: 2px from element

## Content Guidelines

### Voice and Tone
- Professional yet approachable
- Clear and concise
- Focus on funding and transparency
- Avoid donation terminology
- Use simple, non-technical language

### Terminology
- Use "funding" instead of "donations"
- Use "projects" instead of "creators"
- Use "supporters" instead of "donors"
- Use "transparency score" consistently
- Use "Bitcoin funding" instead of "Bitcoin donations"

## Best Practices

### User Flow
- Guide users gently through the experience
- One primary CTA per section
- Progressive disclosure of information
- Clear hierarchy of actions

### Visual Hierarchy
- Use size, color, and spacing to establish importance
- Maintain consistent spacing between sections
- Use white space effectively
- Limit use of accent colors

### Responsive Design
- Mobile-first approach
- Fluid typography
- Flexible layouts
- Touch-friendly targets (minimum 44px)

## Implementation

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'tiffany': {
          DEFAULT: '#0ABAB5',
          light: '#E6F7F7',
          dark: '#089B96',
        },
        'orange': {
          DEFAULT: '#FF6B35',
          light: '#FFF0EB',
          dark: '#E65A2F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### Component Structure
- Atomic design principles
- Reusable components
- Consistent naming conventions
- Clear prop interfaces 