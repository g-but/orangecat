'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PlayCircle, Radio, Video, Mic2, Share2, Users, Clock } from 'lucide-react';
import ProfileShare from '@/components/sharing/ProfileShare';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ChannelComingSoonPage() {
  const { user, profile } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [email, setEmail] = useState(profile?.email || '');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-teal-50/40">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
            <PlayCircle className="w-8 h-8" />
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Stream anything. Get paid directly.
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Share videos, audio, and live sessions. Build your audience, accept Bitcoin payments,
            and keep your creative freedom. We respect rights and make support simple.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-semibold">Video uploads</div>
                  <div className="text-sm text-gray-600">Share long-form and shorts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Mic2 className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-semibold">Audio & podcasts</div>
                  <div className="text-sm text-gray-600">Episodes, clips, and more</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-semibold">Live streaming</div>
                  <div className="text-sm text-gray-600">Connect with your audience</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rights & Safety */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rights & Safety</h3>
            <p className="text-sm text-gray-700">
              Use original or licensed content, or ensure your use is transformative under fair use.
              We respect artists and owners: we will offer clear licensing metadata, an easy
              takedown process, and fair dispute handling. Our goal is to make direct creator
              support easy while protecting rights holders.
            </p>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="border-orange-200 bg-white/90">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold text-gray-900">Be the first to try it</h3>
                <p className="text-sm text-gray-600">
                  Invite friends, build your audience, and get notified when we launch.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pr-28 w-72 max-w-full"
                    />
                    <Button
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3"
                      disabled={submitting || !email}
                      onClick={async () => {
                        try {
                          setSubmitting(true);
                          const res = await fetch('/api/waitlist', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email,
                              source: 'channel_page',
                              referrer: document.referrer,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            throw new Error(data.error || 'Failed to subscribe');
                          }
                          toast.success('We will notify you when Channel goes live');
                          setEmail(profile?.email || '');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed to subscribe');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Notify me
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                <Link href={ROUTES.DASHBOARD.PEOPLE}>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" /> Discover People
                  </Button>
                </Link>
                <div className="relative">
                  <Button
                    onClick={() => setShowShare(!showShare)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share My Profile
                  </Button>
                  {showShare && (
                    <div className="absolute right-0 mt-2 z-50">
                      <ProfileShare
                        username={profile?.username || user?.id || ''}
                        profileName={profile?.name || profile?.username || 'My Profile'}
                        profileBio={profile?.bio || undefined}
                        onClose={() => setShowShare(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Phase 1 — Uploads',
              desc: 'Upload videos and audio, with shareable links, Bitcoin tipping, and basic analytics.',
            },
            {
              title: 'Phase 2 — Live',
              desc: 'Live streaming with basic chat and replays.',
            },
            {
              title: 'Phase 3 — Monetize',
              desc: 'Paywalled content, subscriptions, revenue splits, creator tools.',
            },
          ].map((item, _idx) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
