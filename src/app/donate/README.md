# Donate Feature

This directory contains the implementation of the Bitcoin donation feature for Palfare.

## Directory Structure

```
donate/
├── page.tsx           # Main donation page component
├── layout.tsx         # Layout wrapper for donation pages
├── [walletAddress]/   # Dynamic routes for specific wallet addresses
└── README.md          # This documentation file
```

## Components

### page.tsx
The main donation page that displays:
- Profile header
- Wallet address and QR code
- Transaction history
- Trust indicators

### layout.tsx
Layout wrapper that provides consistent styling and structure for donation pages.

### [walletAddress]/
Dynamic routes for specific wallet addresses, allowing for direct linking to donation pages.

## Environment Variables

The following environment variables are required:

```env
NEXT_PUBLIC_BITCOIN_ADDRESS=your_bitcoin_address_here
```

## Implementation Details

The donation page uses:
- Next.js 14 for routing and server-side rendering
- Framer Motion for animations
- QRCode.react for QR code generation
- Tailwind CSS for styling

## Security Considerations

- Bitcoin addresses are validated before display
- QR codes are generated client-side
- No sensitive data is stored in the application
- All transactions are read-only

## Development

To run the donation feature locally:
1. Set up environment variables
2. Run `npm run dev`
3. Visit `/donate` route

## Testing

The feature includes:
- Wallet address validation
- QR code generation
- Copy to clipboard functionality
- Responsive design testing

## Deployment

The feature is automatically deployed through Vercel when merged to main. 