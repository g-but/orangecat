import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Briefcase, Code, Users, Zap, Heart, Globe, Coffee, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers at BitBaum - Join Our Bitcoin Mission',
  description: 'Work with us to build the future of Bitcoin commerce. Join BitBaum and help create platforms that empower communities worldwide.',
};

export default function CareersPage() {
  const openPositions = [
    {
      title: 'Senior Bitcoin Developer',
      department: 'Engineering',
      location: 'Remote / Switzerland',
      type: 'Full-time',
      description: 'Build Bitcoin-native applications and smart contracts. Experience with Lightning Network preferred.',
    },
    {
      title: 'Community Manager',
      department: 'Operations',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help grow and nurture our Bitcoin creator and supporter communities worldwide.',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote / Switzerland',
      type: 'Full-time',
      description: 'Design intuitive interfaces for Bitcoin commerce and community platforms.',
    },
    {
      title: 'DevRel Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build developer tools, documentation, and community around our Bitcoin platforms.',
    },
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Bitcoin First',
      description: 'We build everything with Bitcoin at its core, creating transparent and censorship-resistant platforms.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Driven',
      description: 'Our success depends on the communities we serve. We listen, learn, and build together.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Always Day 1',
      description: 'We maintain an entrepreneurial mindset, staying agile and innovative in everything we do.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Impact',
      description: 'Our work empowers creators, communities, and individuals worldwide to thrive economically.',
    },
  ];

  const perks = [
    '100% Remote Work',
    'Competitive Bitcoin Compensation',
    'Health & Dental Coverage',
    'Unlimited PTO',
    'Learning & Development Budget',
    'Bitcoin Conference Attendance',
    'Home Office Stipend',
    'Flexible Hours',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-8">
              <Briefcase className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              Join <span className="text-orange-600">BitBaum</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Help us build the future of Bitcoin commerce. Work on platforms that empower
              communities, creators, and individuals worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why BitBaum?</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            We're not just building software – we're creating the infrastructure for a more
            transparent, community-driven economy powered by Bitcoin. Every role at BitBaum
            contributes to this mission.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {values.map((value, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                {value.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600 text-sm">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Open Positions</h2>

          {openPositions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openPositions.map((position, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{position.title}</h3>
                      <p className="text-orange-600 font-medium text-sm">{position.department}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {position.type}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{position.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{position.location}</span>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Positions Right Now</h3>
              <p className="text-gray-600 mb-6">
                We're always growing! Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Send Your Resume
              </button>
            </div>
          )}
        </div>

        {/* Perks & Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why Work With Us?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {perks.map((perk, index) => (
              <div key={index} className="flex items-center p-4 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-sm font-bold">✓</span>
                </div>
                <span className="text-gray-900 font-medium text-sm">{perk}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-6">
              We believe in compensating our team fairly with competitive salaries,
              Bitcoin bonuses, and benefits that support work-life balance.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Join Our Mission?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether we have an open position or not, we'd love to hear from talented individuals
            who share our passion for Bitcoin and community building.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
              View Open Positions
            </button>
            <button className="px-8 py-4 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium">
              Send Your Resume
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            We are an equal opportunity employer and value diversity at our company.
            We do not discriminate on the basis of race, religion, color, national origin,
            gender, sexual orientation, age, marital status, veteran status, or disability status.
          </p>
        </div>
      </div>
    </div>
  );
}



