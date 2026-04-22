/**
 * Multi-Factor Authentication (MFA) Operations
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { AuthError } from '../types';

export type MFAFactorType = 'totp';

export async function getMFAFactors() {
  try {
    logger.auth('Getting MFA factors');

    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      logger.auth('Failed to get MFA factors', { error: error.message });
      return { factors: null, error: error as AuthError };
    }

    const totpFactors = data?.totp || [];
    const verifiedFactors = totpFactors.filter(f => f.status === 'verified');

    logger.auth('MFA factors retrieved', {
      totalFactors: totpFactors.length,
      verifiedFactors: verifiedFactors.length,
    });

    return {
      factors: totpFactors,
      verifiedFactors,
      hasMFA: verifiedFactors.length > 0,
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error getting MFA factors', { error: authError.message }, 'Auth');
    return { factors: null, verifiedFactors: [], hasMFA: false, error: authError };
  }
}

export async function enrollMFA() {
  try {
    logger.auth('Starting MFA enrollment');

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'OrangeCat Authenticator',
    });

    if (error) {
      logger.auth('MFA enrollment failed', { error: error.message });
      return { data: null, error: error as AuthError };
    }

    logger.auth('MFA enrollment started', { factorId: data?.id });

    return {
      data: {
        id: data.id,
        type: data.type,
        totpUri: data.totp?.uri || '',
        secret: data.totp?.secret || '',
        qrCode: data.totp?.qr_code || '',
      },
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error during MFA enrollment', { error: authError.message }, 'Auth');
    return { data: null, error: authError };
  }
}

export async function verifyMFAEnrollment(factorId: string, code: string) {
  try {
    logger.auth('Verifying MFA enrollment', { factorId });

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      logger.auth('MFA challenge creation failed', { error: challengeError.message });
      return { success: false, error: challengeError as AuthError };
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      logger.auth('MFA verification failed', { error: error.message });
      return { success: false, error: error as AuthError };
    }

    logger.auth('MFA enrollment verified successfully', { factorId });
    return { success: true, data, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error verifying MFA', { error: authError.message }, 'Auth');
    return { success: false, error: authError };
  }
}

export async function unenrollMFA(factorId: string) {
  try {
    logger.auth('Unenrolling MFA factor', { factorId });

    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      logger.auth('MFA unenrollment failed', { error: error.message });
      return { success: false, error: error as AuthError };
    }

    logger.auth('MFA factor removed successfully', { factorId });
    return { success: true, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error unenrolling MFA', { error: authError.message }, 'Auth');
    return { success: false, error: authError };
  }
}

export async function getMFAAssuranceLevel() {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      logger.auth('Failed to get MFA assurance level', { error: error.message });
      return { data: null, error: error as AuthError };
    }

    logger.auth('MFA assurance level retrieved', {
      currentLevel: data?.currentLevel,
      nextLevel: data?.nextLevel,
    });

    return {
      data: {
        currentLevel: data?.currentLevel,
        nextLevel: data?.nextLevel,
        currentAuthenticationMethods: data?.currentAuthenticationMethods || [],
      },
      error: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error getting MFA assurance level',
      { error: authError.message },
      'Auth'
    );
    return { data: null, error: authError };
  }
}

export async function verifyMFALogin(factorId: string, code: string) {
  try {
    logger.auth('Verifying MFA for login', { factorId });

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      logger.auth('MFA login challenge failed', { error: challengeError.message });
      return { success: false, error: challengeError as AuthError };
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      logger.auth('MFA login verification failed', { error: error.message });
      return { success: false, error: error as AuthError };
    }

    logger.auth('MFA login verified successfully');
    return { success: true, data, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error(
      'Unexpected error during MFA login verification',
      { error: authError.message },
      'Auth'
    );
    return { success: false, error: authError };
  }
}
