"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { BarChart2, Users } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import Button from "@/components/ui/Button";

export default function FundOthersPage() {
  const router = useRouter();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("funding_pages")
          .select(`
            id,
            title,
            description,
            bitcoin_address,
            is_active,
            is_public,
            total_funding,
            contributor_count,
            created_at,
            updated_at
          `)
          .eq("is_public", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setPages(data || []);
      } catch (err: any) {
        console.error("Error loading public fundraisers:", err);
        setError(
          "We couldn't load public fundraisers right now. This could be due to a network issue, a temporary server problem, or a configuration error. Please try again, and if the problem persists, contact support."
        );
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center bg-white">
        <div className="mb-6">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <polygon points="30,40 20,10 50,30" fill="#FFD700" />
            <polygon points="90,40 100,10 70,30" fill="#FFD700" />
            <ellipse cx="60" cy="70" rx="40" ry="35" fill="#FFD700" stroke="#E0A800" strokeWidth="3"/>
            <ellipse cx="48" cy="70" rx="6" ry="8" fill="#333" />
            <ellipse cx="72" cy="70" rx="6" ry="8" fill="#333" />
            <polygon points="60,80 56,86 64,86" fill="#E57373" />
            <path d="M60 86 Q60 92 54 92" stroke="#333" strokeWidth="2" fill="none"/>
            <path d="M60 86 Q60 92 66 92" stroke="#333" strokeWidth="2" fill="none"/>
            <path d="M38 80 Q20 85 38 90" stroke="#333" strokeWidth="2" fill="none"/>
            <path d="M82 80 Q100 85 82 90" stroke="#333" strokeWidth="2" fill="none"/>
          </svg>
        </div>
        <div className="text-tiffany-600 text-2xl font-bold mb-2">Whoops! Something glitched.</div>
        <div className="text-gray-700 mb-4 text-lg">
          Our cat got a little too curious and tangled up the wires.<br />
          We're working on it! In the meantime, you can try again or learn more about us.
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
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">Find fundraisers and nonprofits</h1>
      <p className="text-center text-gray-500 mb-10">
        Discover public fundraisers, projects, and organizations on the platform.
      </p>
      {pages.length === 0 ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-gray-500 text-lg">No public fundraisers yet.</div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
              onClick={() => router.push(`/fund-us/${page.id}`)}
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">{page.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{page.description}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                <div className="flex items-center">
                  <BarChart2 className="w-4 h-4 mr-1" />
                  <span>{page.total_funding} sats</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{page.contributor_count} contributors</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 