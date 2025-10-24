'use client';

import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import UnifiedProfileLayout from '@/components/profile/UnifiedProfileLayout';
import ModernProfileEditor from '@/components/profile/ModernProfileEditor';
import TransparencyScore from '@/components/ui/TransparencyScore';
import Loading from '@/components/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const { profile, isLoading, error, isOwnProfile, mode, setMode, handleSave, refetch } =
    useUnifiedProfile({
      username: 'me', // Always load current user's profile
      autoFetch: true,
    });

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center bg-red-50">
            <CardTitle className="text-red-600 flex items-center gap-2 justify-center">
              <AlertCircle className="w-5 h-5" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/auth')} variant="outline">
                Sign In
              </Button>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Unable to load your profile. Please try signing in again.</p>
            <Button onClick={() => router.push('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Main profile view - always visible */}
      <UnifiedProfileLayout
        profile={profile}
        isOwnProfile={isOwnProfile}
        mode="view"
        onSave={handleSave}
        onModeChange={setMode}
      />

      {/* Edit modal - shows as overlay when editing */}
      {mode === 'edit' && isOwnProfile && user?.id && (
        <ModernProfileEditor
          profile={profile}
          userId={user.id}
          userEmail={user.email}
          onSave={handleSave}
          onCancel={() => setMode('view')}
        />
      )}
    </>
  );
}
