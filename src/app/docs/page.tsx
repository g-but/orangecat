import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bot,
  Coins,
  Shield,
  Zap,
  Users,
  Database,
  Code2,
  Lock,
  Globe,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | OrangeCat',
  description:
    'Platform documentation for OrangeCat — how the AI economic agent works, entity types, payments, and security.',
};

const ENTITY_TYPES = [
  { name: 'Product', description: 'Physical or digital goods for sale' },
  { name: 'Service', description: 'Professional services or consultations' },
  { name: 'Project', description: 'Milestone-based funding with accountability' },
  { name: 'Cause', description: 'Outright giving — no strings attached' },
  { name: 'Research', description: 'Decentralized science funding and collaboration' },
  { name: 'Wishlist', description: 'Gift registries and want lists' },
  { name: 'Loan', description: 'Peer-to-peer lending with custom terms' },
  { name: 'Investment', description: 'Equity or revenue-share investing' },
  { name: 'Asset', description: 'Real estate, collateral, and rentable assets' },
  { name: 'Event', description: 'Time-bound coordination and ticketing' },
  { name: 'Group', description: 'Organizations with shared treasury and governance' },
  { name: 'Circle', description: 'Lighter-weight communities and interest groups' },
  { name: 'AI Assistant', description: 'Autonomous AI economic actors' },
  { name: 'Document', description: 'Structured context for the Cat' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-tiffany-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Platform Documentation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            How OrangeCat works — the AI agent, entity system, payments, and security.
          </p>
        </div>

        {/* The Cat */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-purple-100">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Your Cat — AI Economic Agent</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Every user and group has a <strong>Cat</strong> — a personal AI agent that understands
              your context and acts on your behalf. The Cat can create entities, draft content, search
              for opportunities, send messages, and coordinate economic activity in plain language.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The Cat reads your authorized data — your own entities, public profiles you interact
              with, and conversations you start. It proposes actions and waits for your confirmation
              before executing them. You stay in control; the Cat handles complexity.
            </p>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-800 font-medium mb-2">Example Cat commands:</p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>&ldquo;Create a project for my open-source library with a 0.1 BTC goal&rdquo;</li>
                <li>&ldquo;Find investors interested in renewable energy&rdquo;</li>
                <li>&ldquo;Draft a consulting service listing at my usual rate&rdquo;</li>
                <li>&ldquo;Send a message to the group about this week&apos;s proposal&rdquo;</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Entity System */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-orange-100">
              <Coins className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Entity System</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-600 leading-relaxed mb-5">
              Everything on OrangeCat is an <strong>entity</strong> — a structured unit of economic
              or governance activity. Entities give the Cat a rich world model to read and operate on.
              There are 14 entity types covering the full economic spectrum:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ENTITY_TYPES.map(entity => (
                <div key={entity.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-tiffany-500 mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{entity.name}</span>
                    <p className="text-gray-500 text-xs mt-0.5">{entity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payments */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Payments</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Bitcoin and Lightning Network are the native and preferred payment rails. OrangeCat
              supports Lightning addresses (e.g.{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">yourname@orangecat.ch</code>
              ) for instant, near-zero-fee payments. On-chain Bitcoin is also supported.
            </p>
            <p className="text-gray-600 leading-relaxed">
              OrangeCat is not Bitcoin-only. Any payment method — Twint, PayPal, Venmo, Monero, bank
              transfers — can be listed as a receiving option. Users choose the method that works for
              them. Meet counterparties where they are.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="font-medium text-orange-900 text-sm">No platform fees</p>
                <p className="text-orange-700 text-xs mt-1">
                  Payments go directly between parties
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="font-medium text-blue-900 text-sm">Non-custodial</p>
                <p className="text-blue-700 text-xs mt-1">OrangeCat never holds your funds</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="font-medium text-green-900 text-sm">Any currency</p>
                <p className="text-green-700 text-xs mt-1">Bitcoin, Lightning, fiat, and more</p>
              </div>
            </div>
          </div>
        </section>

        {/* Identity & Privacy */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-green-100">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Identity & Privacy</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              OrangeCat is <strong>pseudonymous by default</strong>. You can participate fully —
              sell, fund, lend, invest, govern — under any identity you choose. Real-name
              verification is opt-in, never required.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Row-Level Security</p>
                  <p className="text-gray-600 text-sm">
                    All database queries are enforced at the database level — one user cannot access
                    another&apos;s private data, even if there is an application bug.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Visibility control</p>
                  <p className="text-gray-600 text-sm">
                    Each entity has a visibility setting: public, followers-only, or private. Your
                    profile information is also configurable.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Authentication</p>
                  <p className="text-gray-600 text-sm">
                    Handled by Supabase Auth with industry-standard practices. Passwords are hashed
                    and never stored in plaintext.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Groups & Governance */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Groups & Governance</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              <strong>Groups</strong> are organizations on OrangeCat with a shared identity,
              treasury, and governance. Members can have different roles, propose and vote on
              decisions, manage shared funds, and run economic activities collectively. Think DAOs,
              cooperatives, clubs, or any collective that needs to coordinate.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Every group has its own Cat — a group AI agent that coordinates on behalf of the
              collective, same as individual Cats work for users.
            </p>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-gray-100">
              <Code2 className="h-5 w-5 text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Technology Stack</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Frontend</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-tiffany-500" />
                    Next.js 15 (App Router)
                  </li>
                  <li className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-tiffany-500" />
                    TypeScript 5.8
                  </li>
                  <li className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-tiffany-500" />
                    Tailwind CSS 3
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Backend</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-tiffany-500" />
                    Supabase (PostgreSQL + Auth + RLS)
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-tiffany-500" />
                    Row-Level Security on all tables
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Lightning Network + BTCPay
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-10">
          <div className="bg-tiffany-50 border border-tiffany-100 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Ready to get started?</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Create an account, set up your profile and payment methods, then ask your Cat to help
              you launch your first entity.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 bg-tiffany-500 hover:bg-tiffany-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                View FAQ
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
