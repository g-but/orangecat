'use client';

export const dynamic = 'force-dynamic';

import { categories } from '@/config/categories';
import Link from 'next/link';
import { Palette, Code, GraduationCap, Building2, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const iconMap = {
  Palette,
  Code,
  GraduationCap,
  Building2,
  Heart,
};

export default function CategoriesPage() {
  const { session } = useAuth();
  const router = useRouter();

  const handleCreatePage = () => {
    if (session) {
      router.push('/projects/create');
    } else {
      router.push('/auth?mode=register');
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Find Your Community</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you&apos;re a creator, builder, educator, or organization, OrangeCat helps you
            receive Bitcoin funding transparently.
          </p>
        </div>

        <div className="grid gap-12">
          {categories.map(category => {
            const Icon = iconMap[category.icon as keyof typeof iconMap] || ArrowRight;
            if (!Icon) {
              return null;
            }
            return (
              <div key={category.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-tiffany-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-tiffany-500" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-semibold text-gray-900">{category.name}</h2>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {category.groups.map(group => (
                    <Link
                      key={group.id}
                      href={`/browse?category=${category.id}&group=${group.id}`}
                      className="block p-6 bg-gray-50 rounded-lg hover:bg-tiffany-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-tiffany-500 transition-colors" />
                      </div>
                      <p className="text-gray-600 text-sm">{group.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={handleCreatePage}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-tiffany-600 hover:bg-tiffany-700 transition-colors"
          >
            {session ? 'Create Your Funding Page' : 'Get Started'}
          </button>
          {!session && (
            <p className="mt-4 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth?mode=login" className="text-tiffany-600 hover:text-tiffany-700">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
