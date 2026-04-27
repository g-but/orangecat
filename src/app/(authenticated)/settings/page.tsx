'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { ArrowLeft, Lock } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useSettingsForm } from './useSettingsForm';
import { SettingsEmailSection } from './SettingsEmailSection';
import { SettingsPasswordSection } from './SettingsPasswordSection';
import { SettingsSecuritySection } from './SettingsSecuritySection';
import { SettingsDangerSection } from './SettingsDangerSection';
import { SettingsModals } from './SettingsModals';

export default function SettingsPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const {
    formData,
    isSubmittingEmail,
    isSubmittingPassword,
    isDeleting,
    deleteAccountConfirm,
    setDeleteAccountConfirm,
    showPassword,
    setShowPassword,
    showMFASetup,
    setShowMFASetup,
    showRecoveryCodes,
    setShowRecoveryCodes,
    mfaStatusKey,
    refreshMFAStatus,
    handleInputChange,
    handleEmailUpdate,
    handlePasswordSubmit,
    handleDeleteAccount,
    executeDeleteAccount,
  } = useSettingsForm(user ?? null);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push(ROUTES.DASHBOARD.HOME)}
              className="mr-4 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your email, password, and security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-6">
            <div className="flex items-center text-white">
              <Lock className="w-8 h-8 mr-4" />
              <div>
                <h2 className="text-2xl font-semibold">Account & Security</h2>
                <p className="text-blue-100 text-base mt-1">
                  Manage your login credentials and account security
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-10">
            <SettingsEmailSection
              email={formData.email}
              isSubmitting={isSubmittingEmail}
              onChange={handleInputChange}
              onSubmit={handleEmailUpdate}
            />
            <SettingsPasswordSection
              newPassword={formData.newPassword}
              confirmPassword={formData.confirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isSubmitting={isSubmittingPassword}
              onChange={handleInputChange}
              onSubmit={handlePasswordSubmit}
            />
            <SettingsSecuritySection
              mfaStatusKey={mfaStatusKey}
              onEnableMFA={() => setShowMFASetup(true)}
              onViewRecoveryCodes={() => setShowRecoveryCodes(true)}
              onMFADisableComplete={refreshMFAStatus}
            />
            <SettingsDangerSection isDeleting={isDeleting} onDelete={handleDeleteAccount} />
          </div>
        </div>
      </div>

      <SettingsModals
        showMFASetup={showMFASetup}
        setShowMFASetup={setShowMFASetup}
        showRecoveryCodes={showRecoveryCodes}
        setShowRecoveryCodes={setShowRecoveryCodes}
        deleteAccountConfirm={deleteAccountConfirm}
        setDeleteAccountConfirm={setDeleteAccountConfirm}
        onMFASetupComplete={() => {
          setShowMFASetup(false);
          refreshMFAStatus();
          setShowRecoveryCodes(true);
        }}
        onDeleteConfirm={executeDeleteAccount}
      />
    </div>
  );
}
