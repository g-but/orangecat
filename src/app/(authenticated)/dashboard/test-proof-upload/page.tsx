/**
 * Test page for ProofUploadForm component
 * This is a temporary page for testing the proof upload functionality
 * DELETE THIS FILE after testing
 */

'use client';

import React from 'react';
import { ProofUploadForm } from '@/components/wishlist/ProofUploadForm';

export default function TestProofUploadPage() {
  const handleSuccess = (proof: unknown) => {
    // eslint-disable-next-line no-console -- Test page uses console for debugging
    console.log('Proof uploaded successfully:', proof);
    alert('Proof uploaded successfully! Check console for details.');
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Test Proof Upload Form</h1>
      <p className="text-muted-foreground mb-6">
        This is a test page for the ProofUploadForm component. Select a proof type and try uploading
        an image.
      </p>

      <ProofUploadForm
        wishlistItemId="test-item-123"
        onSuccess={handleSuccess}
        onCancel={() => alert('Cancelled')}
      />
    </div>
  );
}
