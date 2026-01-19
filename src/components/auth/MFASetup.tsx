'use client';

/**
 * MFA Setup Component
 *
 * Guides users through setting up TOTP-based two-factor authentication.
 * Displays QR code for authenticator apps and handles verification.
 *
 * @module auth/MFASetup
 */

import React, { useState, useCallback } from 'react';
import { Shield, Smartphone, Copy, Check, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import {
  enrollMFA,
  verifyMFAEnrollment,
  getMFAFactors,
  unenrollMFA,
} from '@/services/supabase/auth';

interface MFASetupProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
}

interface EnrollmentData {
  id: string;
  totpUri: string;
  secret: string;
  qrCode: string;
}

type SetupStep = 'start' | 'scan' | 'verify' | 'complete';

export function MFASetup({ onSetupComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<SetupStep>('start');
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Start MFA enrollment
  const handleStartEnrollment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: enrollError } = await enrollMFA();

      if (enrollError || !data) {
        setError(enrollError?.message || 'Failed to start MFA enrollment');
        return;
      }

      setEnrollmentData(data);
      setStep('scan');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify the TOTP code
  const handleVerify = useCallback(async () => {
    if (!enrollmentData || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { success, error: verifyError } = await verifyMFAEnrollment(
        enrollmentData.id,
        verificationCode
      );

      if (verifyError || !success) {
        setError(verifyError?.message || 'Invalid verification code. Please try again.');
        return;
      }

      setStep('complete');
      onSetupComplete?.();
    } catch {
      setError('An unexpected error occurred during verification');
    } finally {
      setLoading(false);
    }
  }, [enrollmentData, verificationCode, onSetupComplete]);

  // Copy secret to clipboard
  const handleCopySecret = useCallback(() => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  }, [enrollmentData?.secret]);

  // Handle verification code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'start':
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-tiffany-light rounded-full">
                <Shield className="h-12 w-12 text-tiffany" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Secure Your Account</h3>
              <p className="text-sm text-gray-600">
                Two-factor authentication adds an extra layer of security to your account. You'll
                need to enter a code from your authenticator app each time you sign in.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Install an authenticator app</p>
                  <p className="text-xs text-gray-600">
                    We recommend Google Authenticator, Authy, or 1Password.
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleStartEnrollment} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Set Up Two-Factor Authentication
                </>
              )}
            </Button>
          </div>
        );

      case 'scan':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
              <p className="text-sm text-gray-600">
                Open your authenticator app and scan this QR code to add your account.
              </p>
            </div>

            {/* QR Code */}
            {enrollmentData?.qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img
                    src={enrollmentData.qrCode}
                    alt="QR Code for authenticator app"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* Manual entry option */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">
                Can't scan? Enter this code manually:
              </p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                <code className="flex-1 text-xs font-mono text-gray-700 break-all">
                  {enrollmentData?.secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {secretCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              Continue
            </Button>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Verify Setup</h3>
              <p className="text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app to verify the setup.
              </p>
            </div>

            {/* Code input */}
            <div className="space-y-2">
              <label
                htmlFor="verification-code"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany focus:border-tiffany"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('scan')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Two-Factor Authentication Enabled
              </h3>
              <p className="text-sm text-gray-600">
                Your account is now protected with two-factor authentication. You'll need to enter a
                code from your authenticator app each time you sign in.
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Make sure to save your recovery codes. You'll need them
                if you lose access to your authenticator app.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-tiffany" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Protect your account with an authenticator app</CardDescription>
      </CardHeader>
      <CardContent>
        {error && step !== 'verify' && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {renderStepContent()}
      </CardContent>
      {onCancel && step !== 'complete' && (
        <CardFooter>
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Component to manage existing MFA settings (view status, disable)
 */
export function MFAStatus({
  onEnableClick,
  onDisableComplete,
}: {
  onEnableClick?: () => void;
  onDisableComplete?: () => void;
}) {
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load MFA factors on mount
  React.useEffect(() => {
    const loadFactors = async () => {
      try {
        const { verifiedFactors, error: factorsError } = await getMFAFactors();
        if (!factorsError && verifiedFactors) {
          setFactors(verifiedFactors);
        }
      } catch {
        setError('Failed to load MFA status');
      } finally {
        setLoading(false);
      }
    };

    loadFactors();
  }, []);

  const handleDisable = async (factorId: string) => {
    setDisabling(true);
    setError(null);

    try {
      const { success, error: disableError } = await unenrollMFA(factorId);

      if (disableError || !success) {
        setError(disableError?.message || 'Failed to disable MFA');
        return;
      }

      setFactors(prev => prev.filter(f => f.id !== factorId));
      onDisableComplete?.();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasMFA = factors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${hasMFA ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Shield className={`h-5 w-5 ${hasMFA ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
            <p className="text-sm text-gray-600">{hasMFA ? 'Enabled' : 'Not enabled'}</p>
          </div>
        </div>
        {hasMFA ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDisable(factors[0].id)}
            disabled={disabling}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {disabling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onEnableClick}>
            Enable
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {hasMFA && (
        <p className="text-xs text-gray-500">
          Added on {new Date(factors[0].created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default MFASetup;
