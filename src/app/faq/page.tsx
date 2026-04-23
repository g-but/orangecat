'use client';

import { useState } from 'react';
import { ChevronDown, Bot, Coins, Users, Shield, Zap, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

// Note: metadata export is ignored in client components; see layout for page metadata.
// For SEO this page relies on the root layout metadata defaults.

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FaqSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'About OrangeCat',
    icon: HelpCircle,
    color: 'text-tiffany-600',
    items: [
      {
        question: 'What is OrangeCat?',
        answer:
          'OrangeCat is your AI economic agent — a platform that lets any person, pseudonym, or organization participate in the full spectrum of economic activity: exchange goods and services, fund projects, lend money, invest, and govern together. Bitcoin and Lightning Network are the native payment rails, but any payment method is supported.',
      },
      {
        question: 'Who is OrangeCat for?',
        answer:
          'Anyone who wants to participate in economic activity without gatekeepers. Creators selling their work, researchers seeking funding, communities pooling resources, borrowers and lenders connecting directly, organizations making collective decisions — if you want to exchange value with anyone in the world, OrangeCat is for you.',
      },
      {
        question: 'Is OrangeCat free to use?',
        answer:
          'Creating a profile and using the platform is free. OrangeCat does not take a cut of Bitcoin or Lightning payments — you send and receive directly. Some premium Cat AI features may use credits. Check the pricing page for the latest details.',
      },
      {
        question: 'Do I need to use my real name?',
        answer:
          'No. OrangeCat is pseudonymous by default. You can participate fully — sell, fund, lend, invest — under any identity you choose. Real-name verification is opt-in only, never required.',
      },
    ],
  },
  {
    title: 'Your Cat (AI Agent)',
    icon: Bot,
    color: 'text-purple-600',
    items: [
      {
        question: 'What is "My Cat"?',
        answer:
          '"My Cat" is your personal AI economic agent. It understands your context — your projects, services, goals — and acts on your behalf. You can ask it to create projects, draft product listings, find investment opportunities, compose messages, and much more, all in plain language.',
      },
      {
        question: 'What can the Cat do for me?',
        answer: (
          <div>
            <p className="mb-2">Your Cat can:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your economic entities (projects, products, services, causes, loans, investments)</li>
              <li>Draft descriptions, milestones, and terms in your voice</li>
              <li>Search the platform to find relevant opportunities, backers, or collaborators</li>
              <li>Send messages and coordinate with others on your behalf</li>
              <li>Provide context-aware suggestions based on your goals</li>
              <li>Help you understand your funding progress and next steps</li>
            </ul>
          </div>
        ),
      },
      {
        question: 'How do I talk to my Cat?',
        answer:
          'Open the Cat panel from your dashboard (the chat icon in the bottom right). Just type naturally — "Create a project for my open-source library with a 0.1 BTC goal" or "Help me write a description for my consulting service." The Cat understands context and will walk you through anything it needs.',
      },
      {
        question: 'Is the Cat reading all my data?',
        answer:
          'The Cat only accesses data you have authorized it to see — your own entities, public profiles you interact with, and conversations you start. It does not access other users\' private data. You remain in control; the Cat proposes actions and waits for your confirmation before executing them.',
      },
    ],
  },
  {
    title: 'Economic Activity',
    icon: Coins,
    color: 'text-orange-600',
    items: [
      {
        question: 'What kinds of economic activity can I do on OrangeCat?',
        answer: (
          <div>
            <p className="mb-2">The full economic spectrum:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Exchange</strong> — Sell products (physical or digital) and services</li>
              <li><strong>Fund</strong> — Launch projects with milestone-based accountability, or causes for outright giving</li>
              <li><strong>Lend</strong> — Offer or take peer-to-peer loans with custom terms</li>
              <li><strong>Invest</strong> — Equity-style or revenue-share investing without intermediaries</li>
              <li><strong>Research</strong> — Decentralized science funding and collaboration</li>
              <li><strong>Govern</strong> — Form groups with shared treasuries and collective decision-making</li>
            </ul>
          </div>
        ),
      },
      {
        question: 'How do projects work?',
        answer:
          'Projects are milestone-based funding vehicles. You set a goal, define milestones, and backers fund you knowing exactly what their support will achieve. Funds are tracked transparently. You can post updates and supporters can follow your progress. The Cat can help you structure milestones and write compelling descriptions.',
      },
      {
        question: 'What is the difference between a project and a cause?',
        answer:
          'Projects have milestones and accountability — backers expect progress reports and deliverables. Causes are outright giving with no strings attached, suited for charitable or community support where the act of giving is the goal itself. Both can receive Bitcoin, Lightning, or other payment methods.',
      },
      {
        question: 'How do loans work?',
        answer:
          'Loans connect borrowers and lenders directly. You set the amount, interest rate (or zero for interest-free), repayment schedule, and any collateral terms. OrangeCat records the agreement and tracks repayments. There is no bank in the middle — the agreement is between the two parties.',
      },
    ],
  },
  {
    title: 'Payments & Bitcoin',
    icon: Zap,
    color: 'text-yellow-600',
    items: [
      {
        question: 'Do I need Bitcoin to use OrangeCat?',
        answer:
          'No. Bitcoin and Lightning are the native and preferred payment rails because they enable instant, global, permissionless transactions. But OrangeCat supports any payment method — Twint, PayPal, Venmo, bank transfers, and more. You can list whatever receiving options you have and let counterparties choose what works for them.',
      },
      {
        question: 'What is the Lightning Network?',
        answer:
          'The Lightning Network is a payment layer built on top of Bitcoin. It enables near-instant transactions with fees of a fraction of a cent — far cheaper and faster than on-chain Bitcoin. Think of it as Bitcoin\'s payment rails for everyday transactions. OrangeCat supports Lightning addresses (e.g. yourname@orangecat.ch) for easy receiving.',
      },
      {
        question: 'Does OrangeCat hold my Bitcoin?',
        answer:
          'No. OrangeCat never holds your funds. You add your own Bitcoin address or Lightning wallet address, and payments go directly to you. We record the transaction for transparency, but the money flows directly between sender and receiver without passing through OrangeCat.',
      },
      {
        question: 'What currencies are displayed?',
        answer:
          'You can choose your preferred display currency (CHF, USD, EUR, GBP, or Bitcoin/sats) in your profile settings. All amounts are stored in BTC internally for precision, then converted for display using live exchange rates. This means you always see amounts in the currency you understand best.',
      },
    ],
  },
  {
    title: 'Groups & Governance',
    icon: Users,
    color: 'text-blue-600',
    items: [
      {
        question: 'What are Groups?',
        answer:
          'Groups are organizations on OrangeCat with a shared identity, treasury, and governance. A group can have members with different roles, propose and vote on decisions, manage shared funds, and run economic activities collectively. Think DAOs, cooperatives, clubs, or any collective that needs to coordinate.',
      },
      {
        question: 'What is a Circle?',
        answer:
          'Circles are lighter-weight communities — less formal than groups, more suited for interest communities, study groups, or loose collaborations. Circles can share a space for discussion and coordination without the full governance machinery of a Group.',
      },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    color: 'text-green-600',
    items: [
      {
        question: 'Who can see my activity?',
        answer:
          'You control visibility. Each entity (project, product, service, etc.) has a visibility setting: public (anyone can see), followers-only, or private (only you). Your profile information is also configurable. Pseudonymous use means you can be fully public without revealing your real identity.',
      },
      {
        question: 'How is my data protected?',
        answer:
          'All data is stored in a PostgreSQL database with row-level security — meaning queries are enforced at the database level so one user cannot access another\'s private data. Authentication is handled by Supabase Auth with industry-standard practices. Passwords are hashed and never stored in plaintext.',
      },
      {
        question: 'Can I delete my account?',
        answer:
          'Yes. You can delete your account from Settings. Deletion removes your profile and private data. Public transaction records (for transparency and audit purposes) may be anonymized rather than deleted, as they form part of a shared ledger of economic activity.',
      },
    ],
  },
];

function FaqAccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 bg-white border-t border-gray-100">
          <div className="text-gray-600 leading-relaxed text-[15px]">{item.answer}</div>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen pt-20 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-tiffany-50 to-white border-b border-tiffany-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about OrangeCat — your AI economic agent.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {FAQ_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <section key={section.title}>
              <div className="flex items-center gap-3 mb-5">
                <div className={cn('p-2 rounded-lg bg-gray-100', section.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              </div>
              <div className="space-y-2">
                {section.items.map((item, i) => {
                  const key = `${section.title}-${i}`;
                  return (
                    <FaqAccordionItem
                      key={key}
                      item={item}
                      isOpen={!!openItems[key]}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Still have questions */}
        <div className="text-center bg-tiffany-50 border border-tiffany-100 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-4">
            Ask your Cat — open the chat panel in your dashboard and type your question.
            Or reach out directly.
          </p>
          <a
            href="mailto:hello@orangecat.ch"
            className="inline-flex items-center gap-2 bg-tiffany-500 hover:bg-tiffany-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
