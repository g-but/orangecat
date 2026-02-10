'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Flashlight, FlashlightOff, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  className?: string;
  acceptedFormats?: ('bitcoin' | 'lightning' | 'url' | 'text')[];
}

interface ScanResult {
  data: string;
  format: 'bitcoin' | 'lightning' | 'url' | 'text';
  confidence: number;
}

export function QRScanner({
  onScan,
  onClose,
  className,
  acceptedFormats = ['bitcoin', 'lightning', 'url', 'text'],
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopScanning = useCallback(() => {
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopScanning();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [stopScanning]);

  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR scanning
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Use a QR code scanning library here
      // For now, we'll simulate QR detection
      const result = await detectQRCode(imageData);

      if (result) {
        const scanResult = parseQRData(result);

        if (scanResult && acceptedFormats.includes(scanResult.format)) {
          stopScanning();
          onScan(scanResult.data);
        }
      }
    } catch {
      // Silently fail - QR detection may fail on many frames
    }
  }, [acceptedFormats, onScan, stopScanning]);

  const startScanning = useCallback(() => {
    if (!isScanning || scanning) {
      return;
    }

    setScanning(true);
    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 500); // Scan every 500ms
  }, [isScanning, scanning, scanQRCode]);

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this device');
        setHasCamera(false);
        return;
      }

      // Get camera constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Check for flash support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        setHasFlash(!!(capabilities && 'torch' in capabilities));

        setIsScanning(true);
        startScanning();
      }
    } catch (error) {
      logger.error(
        'Camera initialization failed',
        { error: error instanceof Error ? error.message : String(error) },
        'QRScanner'
      );

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Failed to access camera. Please try again.');
        }
      }

      setHasCamera(false);
    }
  }, [startScanning]);

  // Initialize camera and scanner
  useEffect(() => {
    initializeCamera();
    return cleanup;
  }, [initializeCamera, cleanup]);

  // Toggle flash
  const toggleFlash = async () => {
    if (!streamRef.current || !hasFlash) {
      return;
    }

    try {
      const track = streamRef.current.getVideoTracks()[0];
      // Use any[] to avoid conflict with browser's MediaTrackConstraintSet type
      await track.applyConstraints({
        advanced: [{ torch: !flashEnabled }] as any[],
      });
      setFlashEnabled(!flashEnabled);
    } catch {
      // Silently fail if torch is not supported
    }
  };

  // Handle file upload for QR scanning
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async e => {
      const imageUrl = e.target?.result as string;

      try {
        const result = await scanImageForQR(imageUrl);
        if (result) {
          const scanResult = parseQRData(result);
          if (scanResult && acceptedFormats.includes(scanResult.format)) {
            onScan(scanResult.data);
          }
        }
      } catch {
        setError('Failed to scan image. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Close scanner
  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <div
      className={cn('fixed inset-0 z-50 bg-black flex flex-col', 'safe-area-padding', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <h2 className="text-lg font-semibold">Scan QR Code</h2>
        <div className="flex items-center space-x-2">
          {hasFlash && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlash}
              className="text-white hover:bg-white/20 p-2"
            >
              {flashEnabled ? (
                <FlashlightOff className="w-5 h-5" />
              ) : (
                <Flashlight className="w-5 h-5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {hasCamera && isScanning ? (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scan frame */}
                <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                  {/* Corner indicators */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-orange-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-orange-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-orange-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-orange-500 rounded-br-lg"></div>

                  {/* Scanning line */}
                  {scanning && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-orange-500 animate-pulse">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-bounce"></div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <p className="text-white text-center mt-4 px-4">
                  Position the QR code within the frame
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white p-8">
            <AlertCircle className="w-16 h-16 mb-4 text-orange-500" />
            <h3 className="text-lg font-semibold mb-2">Camera Not Available</h3>
            <p className="text-center text-gray-300 mb-6">
              {error || 'Unable to access camera on this device'}
            </p>

            {/* File upload alternative */}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <div className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
                <Upload className="w-5 h-5" />
                <span>Upload Image</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom instructions */}
      <div className="bg-black/80 text-white p-4 text-center text-sm">
        <p>Supported formats: Bitcoin addresses, Lightning invoices</p>
        {hasCamera && (
          <p className="text-gray-400 mt-1">
            Make sure the QR code is well-lit and clearly visible
          </p>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

// Mock QR detection function (replace with actual QR library)
async function detectQRCode(_imageData: ImageData): Promise<string | null> {
  // This would use a library like qr-scanner or jsQR
  // For now, return null to simulate no QR found
  return null;
}

// Scan uploaded image for QR code
async function scanImageForQR(_imageUrl: string): Promise<string | null> {
  // This would process the uploaded image
  // For now, return null
  return null;
}

// Parse QR code data and determine format
function parseQRData(data: string): ScanResult | null {
  const cleanData = data.trim();

  // Bitcoin address patterns
  if (
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(cleanData) ||
    /^bc1[a-z0-9]{39,59}$/.test(cleanData)
  ) {
    return {
      data: cleanData,
      format: 'bitcoin',
      confidence: 0.9,
    };
  }

  // Lightning invoice
  if (/^ln[a-z0-9]+$/i.test(cleanData)) {
    return {
      data: cleanData,
      format: 'lightning',
      confidence: 0.9,
    };
  }

  // Bitcoin URI
  if (cleanData.startsWith('bitcoin:')) {
    return {
      data: cleanData,
      format: 'bitcoin',
      confidence: 0.8,
    };
  }

  // Lightning URI
  if (cleanData.startsWith('lightning:')) {
    return {
      data: cleanData,
      format: 'lightning',
      confidence: 0.8,
    };
  }

  // URL
  if (/^https?:\/\/.+/.test(cleanData)) {
    return {
      data: cleanData,
      format: 'url',
      confidence: 0.7,
    };
  }

  // Default to text
  return {
    data: cleanData,
    format: 'text',
    confidence: 0.5,
  };
}

// Hook for QR scanner availability
export function useQRScanner() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasCanvas = !!document.createElement('canvas').getContext;
      setIsAvailable(hasCamera && hasCanvas);
    };

    checkAvailability();
  }, []);

  return isAvailable;
}
