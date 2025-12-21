'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { getRouteContext } from '@/config/routes';
import {
  Home,
  Users,
  Rocket,
  Settings,
  User as UserIcon,
  MessageSquare,
  Compass,
  BookOpen,
  Globe,
  Wallet,
  Package,
  Briefcase,
  Heart,
  Banknote,
  CircleDot,
  Building,
  FileText,
  Info,
  HelpCircle,
  Shield,
  MapPin,
  Search,
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Star,
  Calendar,
  Mail,
  BarChart3,
  CreditCard,
  Zap,
  Coins,
  Landmark,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualLoaderProps {
  className?: string;
  pathname?: string; // Optional pathname prop for cases where usePathname() isn't available
}

/**
 * Contextual Loader Component
 *
 * Shows relevant information about what users can do on the page they're navigating to,
 * instead of a generic loading spinner. This improves UX by keeping users informed
 * and engaged during page transitions.
 */
export function ContextualLoader({ className, pathname: propPathname }: ContextualLoaderProps) {
  // Try to get pathname from hook, fallback to prop or '/'
  const hookPathname = usePathname();
  const pathname = propPathname || hookPathname || '/';
  const routeContext = getRouteContext(pathname);

  // Get contextual content based on the route
  const getContextualContent = (pathname: string) => {
    // Dashboard and Home
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
      return {
        icon: Home,
        title: "Your Dashboard",
        subtitle: "Your personal command center",
        actions: [
          { icon: TrendingUp, text: "Track your activity and progress" },
          { icon: MessageSquare, text: "Connect with your network" },
          { icon: Plus, text: "Create new projects or services" },
          { icon: BarChart3, text: "View analytics and insights" },
        ],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    }

    // Profile pages
    if (pathname.startsWith('/profiles') || pathname.startsWith('/dashboard/info')) {
      return {
        icon: UserIcon,
        title: "Your Profile",
        subtitle: "Show the world who you are",
        actions: [
          { icon: UserIcon, text: "Update your personal information" },
          { icon: MapPin, text: "Set your location and availability" },
          { icon: FileText, text: "Share your story and expertise" },
          { icon: Star, text: "Highlight your achievements" },
        ],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      };
    }

    // Timeline
    if (pathname.startsWith('/timeline')) {
      return {
        icon: BookOpen,
        title: "Timeline",
        subtitle: "Stay updated with your network",
        actions: [
          { icon: Plus, text: "Share your latest updates" },
          { icon: MessageSquare, text: "Engage with posts and discussions" },
          { icon: Users, text: "Discover new connections" },
          { icon: Heart, text: "Support causes you care about" },
        ],
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }

    // Discover/Community
    if (pathname.startsWith('/discover') || pathname.startsWith('/community')) {
      return {
        icon: Compass,
        title: "Discover",
        subtitle: "Find projects and people",
        actions: [
          { icon: Search, text: "Search for projects and people" },
          { icon: Users, text: "Connect with like-minded individuals" },
          { icon: Target, text: "Find opportunities and collaborations" },
          { icon: Star, text: "Explore trending initiatives" },
        ],
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      };
    }

    // Projects
    if (pathname.startsWith('/dashboard/projects') || pathname.startsWith('/projects')) {
      return {
        icon: Rocket,
        title: "Projects",
        subtitle: "Bring your ideas to life",
        actions: [
          { icon: Plus, text: "Start a new crowdfunding campaign" },
          { icon: Target, text: "Set goals and track progress" },
          { icon: Users, text: "Build your supporter community" },
          { icon: DollarSign, text: "Manage funds and rewards" },
        ],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      };
    }

    // Services
    if (pathname.startsWith('/dashboard/services')) {
      return {
        icon: Briefcase,
        title: "Services",
        subtitle: "Offer your expertise",
        actions: [
          { icon: Plus, text: "List your skills and services" },
          { icon: DollarSign, text: "Set competitive pricing" },
          { icon: Calendar, text: "Manage your availability" },
          { icon: Star, text: "Build your reputation" },
        ],
        color: "text-teal-600",
        bgColor: "bg-teal-50",
      };
    }

    // Causes
    if (pathname.startsWith('/dashboard/causes')) {
      return {
        icon: Heart,
        title: "Causes",
        subtitle: "Support what matters to you",
        actions: [
          { icon: Heart, text: "Find causes you care about" },
          { icon: DollarSign, text: "Make donations that count" },
          { icon: Users, text: "Join community initiatives" },
          { icon: Target, text: "Track your impact" },
        ],
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      };
    }

    // Wallets
    if (pathname.startsWith('/dashboard/wallets')) {
      return {
        icon: Wallet,
        title: "Bitcoin Wallets",
        subtitle: "Manage your digital assets",
        actions: [
          { icon: Coins, text: "View your Bitcoin balance" },
          { icon: CreditCard, text: "Send and receive payments" },
          { icon: Landmark, text: "Connect external wallets" },
          { icon: BarChart3, text: "Track your portfolio value" },
        ],
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      };
    }

    // Assets
    if (pathname.startsWith('/assets')) {
      return {
        icon: Package,
        title: "Assets",
        subtitle: "Manage your valuable possessions",
        actions: [
          { icon: Plus, text: "Add new assets for collateral" },
          { icon: DollarSign, text: "Get valuations and loans" },
          { icon: Shield, text: "Secure your investments" },
          { icon: BarChart3, text: "Track asset performance" },
        ],
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      };
    }

    // Loans
    if (pathname.startsWith('/loans')) {
      return {
        icon: Banknote,
        title: "Peer-to-Peer Lending",
        subtitle: "Borrow and lend Bitcoin",
        actions: [
          { icon: DollarSign, text: "Apply for loans against assets" },
          { icon: TrendingUp, text: "Earn interest by lending" },
          { icon: CheckCircle, text: "Track repayment progress" },
          { icon: Shield, text: "Secure, decentralized finance" },
        ],
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
      };
    }

    // Organizations
    if (pathname.startsWith('/organizations')) {
      return {
        icon: Building,
        title: "Organizations",
        subtitle: "Build communities and governance",
        actions: [
          { icon: Plus, text: "Create new organizations" },
          { icon: Users, text: "Manage team members" },
          { icon: Target, text: "Set collective goals" },
          { icon: CheckCircle, text: "Vote on decisions" },
        ],
        color: "text-slate-600",
        bgColor: "bg-slate-50",
      };
    }

    // Messages
    if (pathname.startsWith('/messages')) {
      return {
        icon: MessageSquare,
        title: "Messages",
        subtitle: "Connect and collaborate",
        actions: [
          { icon: Mail, text: "Start new conversations" },
          { icon: Users, text: "Join group discussions" },
          { icon: Zap, text: "Get instant notifications" },
          { icon: Shield, text: "Secure, private messaging" },
        ],
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      };
    }

    // Settings
    if (pathname.startsWith('/settings')) {
      return {
        icon: Settings,
        title: "Settings",
        subtitle: "Customize your experience",
        actions: [
          { icon: UserIcon, text: "Update your profile" },
          { icon: Shield, text: "Manage privacy and security" },
          { icon: Bell, text: "Configure notifications" },
          { icon: Zap, text: "Optimize performance" },
        ],
        color: "text-gray-600",
        bgColor: "bg-gray-50",
      };
    }

    // About/Blog/Docs (universal pages)
    if (pathname.startsWith('/about')) {
      return {
        icon: Info,
        title: "About Orange Cat",
        subtitle: "Learn about our mission",
        actions: [
          { icon: BookOpen, text: "Read our story and values" },
          { icon: Users, text: "Meet the team behind the vision" },
          { icon: Target, text: "Understand our goals" },
          { icon: Heart, text: "See how we're making an impact" },
        ],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    }

    if (pathname.startsWith('/blog')) {
      return {
        icon: FileText,
        title: "Blog",
        subtitle: "Stay informed and inspired",
        actions: [
          { icon: BookOpen, text: "Read latest articles and updates" },
          { icon: TrendingUp, text: "Learn about Bitcoin and finance" },
          { icon: Users, text: "Discover community stories" },
          { icon: Lightbulb, text: "Get inspired by new ideas" },
        ],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      };
    }

    if (pathname.startsWith('/docs')) {
      return {
        icon: BookOpen,
        title: "Documentation",
        subtitle: "Everything you need to know",
        actions: [
          { icon: Search, text: "Find answers to your questions" },
          { icon: BookOpen, text: "Read detailed guides" },
          { icon: Zap, text: "Get started quickly" },
          { icon: HelpCircle, text: "Access API documentation" },
        ],
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }

    // Default fallback
    return {
      icon: Zap,
      title: "Loading...",
      subtitle: "Preparing your experience",
      actions: [
        { icon: Zap, text: "Optimizing your experience" },
        { icon: CheckCircle, text: "Loading personalized content" },
        { icon: Shield, text: "Ensuring security and privacy" },
      ],
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    };
  };

  const content = getContextualContent(pathname);
  const IconComponent = content.icon;

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-8",
      className
    )}>
      <div className={cn(
        "max-w-md w-full rounded-2xl p-8 text-center",
        content.bgColor
      )}>
        {/* Icon with subtle animation */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            content.color.replace('text-', 'bg-').replace('-600', '-100')
          )}>
            <IconComponent className={cn("w-8 h-8", content.color)} />
          </div>
        </div>

        {/* Title and subtitle */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content.title}
        </h2>
        <p className="text-gray-600 mb-8">
          {content.subtitle}
        </p>

        {/* Action list */}
        <div className="space-y-4 text-left">
          {content.actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm"
              >
                <ActionIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", content.color)} />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {action.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"
                 style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"
                 style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"
                 style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Preparing your personalized experience...
        </p>
      </div>
    </div>
  );
}

// Add missing icons that might not be imported
const Lightbulb = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);















