'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { Bell, BrainCircuit, ChevronRight, KeyRound, Lock } from 'lucide-react';
import EntityListShell from '@/components/entity/EntityListShell';
import { ROUTES } from '@/config/routes';
import { useSettingsForm } from './useSettingsForm';
import { SettingsEmailSection } from './SettingsEmailSection';
import { SettingsPasswordSection } from './SettingsPasswordSection';
import { SettingsSecuritySection } from './SettingsSecuritySection';
import { SettingsDangerSection } from './SettingsDangerSection';
import { SettingsDataSection } from './SettingsDataSection';
import { SettingsModals } from './SettingsModals';

const SETTINGS_SUB_PAGES: Array<{
  href: string;
  icon: typeof Bell;
  label: string;
  description: string;
}> = [
  {
    href: ROUTES.SETTINGS_NOTIFICATIONS,
    icon: Bell,
    label: 'Notifications',
    description: 'Pick which emails you receive and how often you get the digest.',
  },
  {
    href: ROUTES.SETTINGS_AI,
    icon: BrainCircuit,
    label: 'AI assistants',
    description: 'Bring-your-own-key models, defaults, and routing.',
  },
  {
    href: ROUTES.SETTINGS_INTEGRATIONS,
    icon: KeyRound,
    label: 'Integrations',
    description: 'Integration keys + webhook endpoints for external services.',
  },
];

export default function SettingsPage() {
  const { user, isLoading } = useRequireAuth();
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
    <>
      <EntityListShell
        title="Account Settings"
        description="Manage your email, password, and security"
      >
        <div className="bg-surface-base rounded-lg border border-subtle overflow-hidden">
          <div className="flex items-center gap-4 border-b border-subtle px-4 py-5 sm:px-8 sm:py-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-fg-secondary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-fg-primary">
                Account &amp; Security
              </h2>
              <p className="mt-0.5 text-sm text-fg-secondary">
                Manage your login credentials and account security
              </p>
            </div>
          </div>

          <div className="space-y-10 p-4 sm:p-8">
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
            <SettingsDataSection />

            <SettingsDangerSection isDeleting={isDeleting} onDelete={handleDeleteAccount} />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-subtle bg-surface-base">
          <div className="border-b border-subtle px-4 py-3">
            <h2 className="text-sm font-medium text-fg-primary">More settings</h2>
            <p className="mt-0.5 text-xs text-fg-secondary">
              Configuration that lives outside the account-and-security card above.
            </p>
          </div>
          <ul className="divide-y divide-border-subtle">
            {SETTINGS_SUB_PAGES.map(page => {
              const Icon = page.icon;
              return (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="flex items-center gap-3 p-4 hover:bg-surface-raised/30"
                  >
                    <Icon className="h-5 w-5 text-fg-secondary" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-fg-primary">{page.label}</div>
                      <p className="mt-0.5 text-xs text-fg-secondary">{page.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-fg-secondary" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </EntityListShell>

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
    </>
  );
}
