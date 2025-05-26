"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageLayout, PageHeader, PageSection } from "@/components/layout/PageLayout";
import { UserCircle2, Users, Search, Filter } from "lucide-react";
import supabase from "@/services/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  // Consider adding bitcoin_address if you want to filter by it or display it
}

export default function FundOthersPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, bio") // Corrected select string
          // Example: To only show profiles that have a bitcoin address set
          // .not("bitcoin_address", "is", null) 
          .order("username", { ascending: true }); 

        if (error) throw error;
        setProfiles(data || []);
      } catch (err: any) {
        console.error("Error loading public profiles:", err);
        setError(
          "We couldn\'t load profiles right now. This could be due to a network issue, a temporary server problem, or a configuration error. Please try again, and if the problem persists, contact support."
        );
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tiffany-500"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center text-center">
          <div className="mb-6">
            <UserCircle2 className="w-20 h-20 text-tiffany-500" /> 
          </div>
          <div className="text-tiffany-600 text-2xl font-bold mb-2">Whoops! Something glitched.</div>
          <div className="text-gray-700 mb-4 text-lg">
            Our cat got a little too curious and tangled up the wires.<br />
            We&apos;re working on it! In the meantime, you can try again or learn more about us.
          </div>
          <div className="flex gap-4 mb-6 justify-center">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" href="/about">
              Learn More About Us
            </Button>
          </div>
          <div className="mt-2 text-base text-gray-400 max-w-md">
            If this keeps happening, please check your internet connection or contact our support team.<br />
            <span className="block mt-4">We care about your experience and are here to help!</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Find and Fund Profiles"
        description="Discover public fundraisers, projects, and organizations on the platform."
      />

      <PageSection>
        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Users className="w-16 h-16 text-gray-400 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">Be Part of Our Community!</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-md">
              It seems a bit quiet here right now... No public profiles are currently listed. 
              Why not set up your own to connect, or learn more about how OrangeCat works?
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button href="/profile" size="lg">
                Create Your Profile
              </Button>
              <Button href="/about" variant="outline" size="lg">
                Learn More About Us
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Discover Profiles</h2>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                  onClick={() => router.push(`/profile/${profile.username || profile.id}`)}
                >
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-tiffany-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-6 h-6 text-tiffany-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{profile.display_name || profile.username || 'Anonymous User'}</h3>
                        {profile.username && profile.display_name && (
                          <p className="text-sm text-gray-500">@{profile.username}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">{profile.bio || 'No bio available.'}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-tiffany-600 hover:text-tiffany-700 font-medium">
                      View Profile
                    </span>
                    <span className="text-tiffany-600">→</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageSection>

      <PageSection background="tiffany">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Want to Be Discovered?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Create your own profile and funding page to connect with supporters worldwide. 
            Show your projects, share your story, and receive Bitcoin donations from the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/profile" size="lg">
              Create Your Profile
            </Button>
            <Button href="/fund-yourself" variant="outline" size="lg">
              Start Fundraising
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
} 