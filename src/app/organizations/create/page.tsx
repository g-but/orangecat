'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase/core/client';
import { EntityForm } from '@/components/create/EntityForm';
import { organizationConfig } from '@/config/entity-configs';
import { OrganizationFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { user, session } = useAuth();

  // Show auth prompt if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto pt-20">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to create an organization.
            </p>
            <Button
              onClick={() => router.push('/auth?mode=login&redirect=/organizations/create')}
            >
              Sign In to Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleSuccess = (data: OrganizationFormData & { id: string }) => {
    // Redirect to the new organization
    router.push(`/organizations/${data.slug}`);
  };

  const handleSubmit = async (data: OrganizationFormData) => {
    if (!user || !session) {
      throw new Error('You must be logged in to create an organization');
    }

    // Transform form data to match database schema
    const dbData = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      website_url: data.website_url || null,
      treasury_address: data.treasury_address || null,
      profile_id: session.user.id,
      type: data.type,
      governance_model: data.governance_model,
      is_public: true,
      requires_approval: false,
    };

    const { data: orgData, error } = await supabase
      .from('organizations')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('An organization with this slug already exists');
      }
      throw new Error(error.message || 'Failed to create organization');
    }

    return { ...orgData, ...data };
  };

  return (
    <EntityForm
      config={organizationConfig}
      onSuccess={handleSuccess}
      onSubmit={handleSubmit}
    />
  );
}













