'use client';

import { motion } from 'framer-motion';
import { Bitcoin, Zap, Shield, Globe, Eye, Settings, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Bitcoin,
    title: 'Bitcoin First',
    description: 'We believe in Bitcoin as the future of money and are committed to building tools that make it accessible to everyone.',
  },
  {
    icon: Zap,
    title: 'Simplicity',
    description: 'We keep things simple. No unnecessary complexity, no hidden fees, just straightforward Bitcoin donations.',
  },
  {
    icon: Shield,
    title: 'Privacy',
    description: 'Your privacy matters. We don\'t require accounts or personal information to use our service.',
  },
  {
    icon: Globe,
    title: 'Global',
    description: 'Bitcoin knows no borders. We\'re building tools that work for everyone, everywhere.',
  },
];

const steps = [
  {
    icon: Settings,
    title: 'Create Your Page',
    description: 'Set up your donation page in minutes. Customize your message, add your Bitcoin address, and choose how you want to engage with your community.',
  },
  {
    icon: Eye,
    title: 'Transparent Transactions',
    description: 'All Bitcoin transactions are public by nature. We make it easy to view and engage with your transaction history, building trust through transparency.',
  },
  {
    icon: Bitcoin,
    title: 'Engage & Build Trust',
    description: 'Comment on incoming and outgoing transactions, explain where funds are going, and interact with your donors. This open dialogue creates a transparent and trustworthy donation ecosystem.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-20">
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h1 className="mb-4">About OrangeCat</h1>
            <p className="text-xl text-slate-600">
              Making Bitcoin donations simple and accessible for everyone
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
            <p className="text-slate-600 mb-4">
              OrangeCat was created with a simple mission: to make accepting Bitcoin donations as easy as possible. 
              We believe that Bitcoin is the future of money, and we want to help creators, organizations, and 
              individuals around the world accept Bitcoin donations without any hassle.
            </p>
            <p className="text-slate-600">
              Our platform is designed to be simple, secure, and accessible to everyone. No accounts required, 
              no hidden fees, just straightforward Bitcoin donations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-6">Why Choose OrangeCat?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-tiffany-500">Simple Setup</h3>
                <p className="text-slate-600">
                  Create your donation page in minutes with our intuitive interface.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-tiffany-500">Transparent</h3>
                <p className="text-slate-600">
                  All transactions are recorded on the Bitcoin blockchain for complete transparency.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-tiffany-500">Secure</h3>
                <p className="text-slate-600">
                  Your funds are secured by the Bitcoin network, the most secure financial network in the world.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-tiffany-500">Global</h3>
                <p className="text-slate-600">
                  Accept donations from anywhere in the world, 24/7, with instant settlement.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 