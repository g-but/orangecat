'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import { Cat, Sparkles, Mail, Users, Clock, Bell } from 'lucide-react';

export default function CatDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
      return;
    }
  }, [user, hydrated, isLoading, router]);

  const handleSubscribe = async () => {
    if (!email.trim()) {
      return;
    }

    try {
      // Here you would integrate with your email service
      // For now, just simulate success
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          ← Back to Dashboard
        </Link>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-tiffany-100 rounded-full mb-4">
            <Cat className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Cat</h1>
          <p className="text-xl text-gray-600">Your AI Business Partner</p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <Card className="max-w-4xl mx-auto mb-8 border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50/50 to-tiffany-50/50">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            We're building an AI assistant that learns your personality, handles customer interactions,
            and helps grow your personal economy. Your cat will be your digital twin - charming,
            knowledgeable, and always available.
          </p>

          {!subscribed ? (
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email for updates"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Button
                  onClick={handleSubscribe}
                  disabled={!email.trim()}
                  className="bg-gradient-to-r from-orange-600 to-orange-700"
                >
                  Notify Me
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-green-600 font-medium">
              ✅ Thanks! We'll notify you when My Cat is ready.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Preview */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What Your Cat Will Do</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Customer Service */}
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Customer Service</CardTitle>
              </div>
              <CardDescription>
                Handle customer inquiries, answer questions about your products/services,
                and provide personalized recommendations.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Scheduling */}
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Smart Scheduling</CardTitle>
              </div>
              <CardDescription>
                Book appointments, manage your calendar, and coordinate service delivery
                with your unique availability preferences.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Communication */}
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Personal Communication</CardTitle>
              </div>
              <CardDescription>
                Send personalized messages, follow-ups, and updates in your voice and style.
                Your cat learns your communication preferences.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Notifications */}
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Smart Notifications</CardTitle>
              </div>
              <CardDescription>
                Alert you to important opportunities, manage urgent customer requests,
                and keep you informed about your business.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Learning */}
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Continuous Learning</CardTitle>
              </div>
              <CardDescription>
                Gets better over time by learning from your interactions, customer feedback,
                and your business preferences.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Privacy */}
          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Cat className="w-5 h-5 text-red-600" />
                </div>
                <CardTitle className="text-lg">Your Rules, Your Cat</CardTitle>
              </div>
              <CardDescription>
                Completely customizable - you control what your cat can say, what topics to avoid,
                and how it represents your business.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Example Conversation */}
      <Card className="max-w-4xl mx-auto mt-12">
        <CardHeader>
          <CardTitle className="text-xl">Example: How Your Cat Might Help</CardTitle>
          <CardDescription>A preview of customer interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Customer</p>
                <p className="text-gray-700">Hi! I'm interested in your massage therapy services. Do you do Swedish massages?</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Cat className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Your Cat</p>
                <p className="text-gray-700">
                  Absolutely! Swedish massage is one of my favorite techniques. It's perfect for relaxation and stress relief.
                  I typically do 60-minute sessions for 15,000 sats. Would you like me to check my availability for next week?
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Customer</p>
                <p className="text-gray-700">That sounds perfect! I have some back pain too - do you handle that?</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Cat className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Your Cat</p>
                <p className="text-gray-700">
                  I can definitely help with back pain! I combine Swedish techniques with some targeted deep tissue work
                  to address specific areas of tension. However, I should mention that I'm not a medical professional,
                  so if you have chronic pain, it might be good to consult a doctor first. Would you like me to book a
                  consultation session where we can discuss your specific needs?
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            <em>* This is a conceptual example. Your cat will be trained on your specific services, personality, and preferences.</em>
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center mt-12">
        <Card className="max-w-md mx-auto border-orange-200 bg-gradient-to-br from-orange-50 to-tiffany-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Your Cat?</h3>
            <p className="text-gray-600 mb-4">Be among the first to get your AI business partner.</p>
            {!subscribed ? (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Button
                  onClick={handleSubscribe}
                  disabled={!email.trim()}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700"
                >
                  Get Early Access
                </Button>
              </div>
            ) : (
              <div className="text-green-600 font-medium py-4">
                🎉 You're on the list! We'll be in touch soon.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
