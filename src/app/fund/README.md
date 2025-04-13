# Bitcoin Funding

This directory contains the implementation of the Bitcoin donation feature for OrangeCat.

## Features

- Bitcoin address validation
- Transaction tracking
- Balance monitoring
- QR code generation

## Implementation

### Address Validation
- Validates Bitcoin address format
- Supports legacy and SegWit addresses
- Handles URI format

### Transaction Tracking
- Monitors incoming transactions
- Updates balance in real-time
- Provides transaction history

### QR Code Generation
- Generates donation QR codes
- Supports URI format
- Includes amount and message

## Security

- No private keys stored
- Read-only access to blockchain
- Secure API integration
- Data validation

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