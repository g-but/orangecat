---
created_date: 2025-12-27
last_modified_date: 2025-12-27
last_modified_summary: Documentation for modular logo refactor
---

# OrangeCat Logo Refactor

## Overview

Refactored the OrangeCat logo to be modular, DRY, and feature a cute minimalist cat in a pirate hat.

## Design

The new logo features:
- **Cute cat face** with friendly eyes and smile
- **Pirate hat** with skull decoration (minimalist)
- **Bitcoin orange** (#FF6B00) as primary color
- **Minimalist design** - clean lines, simple shapes
- **Responsive sizing** - works at all sizes

## Architecture

### Modular Components

1. **`CatIcon.tsx`** - Standalone icon component
   - Reusable SVG icon
   - Configurable size and colors
   - Can be used independently

2. **`Logo.tsx`** - Logo component with text
   - Uses `CatIcon` internally
   - Includes "OrangeCat" text and tagline
   - Single source of truth for logo display

3. **`orange-cat-logo.svg`** - Static SVG file
   - Used for favicons and metadata
   - Matches the `CatIcon` design

### DRY Principles

- **Single source** - `CatIcon` is the only place the icon SVG is defined
- **Reusable** - `CatIcon` can be used anywhere (not just in Logo)
- **Consistent** - All logo instances use the same component

## Usage

### Basic Logo (with text)
```tsx
import Logo from '@/components/layout/Logo';

<Logo />
```

### Logo without text
```tsx
<Logo showText={false} />
```

### Custom size
```tsx
<Logo size="lg" />
```

### Standalone Icon
```tsx
import { CatIcon } from '@/components/layout/CatIcon';

<CatIcon size="md" />
```

### Custom colors
```tsx
<CatIcon 
  size="lg" 
  catColor="#FF6B00" 
  hatColor="#1A1A1A" 
/>
```

## Files

- `src/components/layout/CatIcon.tsx` - Icon component
- `src/components/layout/Logo.tsx` - Logo component
- `public/images/orange-cat-logo.svg` - Static SVG file

## Benefits

✅ **Modular** - Icon can be used independently  
✅ **DRY** - Single source of truth  
✅ **Maintainable** - Change once, updates everywhere  
✅ **Flexible** - Customizable size and colors  
✅ **Cute** - Minimalist cat in pirate hat design  



