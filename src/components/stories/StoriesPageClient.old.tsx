'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Filter } from 'lucide-react';

// Define all story categories
const categories = [
  'All',
  'Artists & Creators',
  'Entrepreneurs',
  'Medical & Research',
  'Education',
  'Family Support',
  'Technology',
  'Community & Infrastructure',
  'Environmental',
] as const;

type Category = (typeof categories)[number];

// All detailed stories
const allStories = [
  {
    id: 'sarah-artist',
    category: 'Artists & Creators',
    emoji: '🎨',
    name: 'Sarah Martinez',
    role: 'Independent Artist',
    location: 'New York, USA',
    goal: '$2,000',
    raised: '$2,300',
    supporters: 23,
    timeline: '2 weeks',
    gradient: 'from-purple-50 to-pink-50',
    summary: 'Funded art supplies and studio rent to create new paintings',
    story: `As an independent artist in New York, I was struggling to afford basic art supplies and keep my studio space. I needed $2,000 to cover three months of rent and materials for my next exhibition.

Instead of begging on social media or dealing with traditional crowdfunding platforms that take 10% fees, I created an OrangeCat project. I shared my vision for a series of paintings about urban resilience and posted photos of my previous work.

Within days, fellow artists, art collectors, and supporters started sending Bitcoin directly to my wallet. I documented every purchase—canvases, paints, brushes, studio rent receipts. Supporters could see exactly where their money went.

The transparency built trust. People who donated small amounts early on sent more when they saw I was accountable. Some even visited the studio to see the work in progress.

In just 2 weeks, I exceeded my goal and completed 8 new paintings. Three sold at my exhibition, and I sent thank-you notes with photos to every supporter. No fees lost to a platform, no delays in receiving funds—just direct support from people who believed in my work.`,
    impact: [
      'Created 8 new paintings for exhibition',
      '3 paintings sold to collectors',
      'Secured studio space for 6 months',
      'Built a community of 23 supporters',
    ],
    testimonial:
      'OrangeCat let me show supporters exactly where every dollar went. The transparency built trust, and people who donated small amounts early sent more when they saw I was accountable.',
  },
  {
    id: 'marcus-entrepreneur',
    category: 'Entrepreneurs',
    emoji: '🚀',
    name: 'Marcus Kimani',
    role: 'Solar Energy Entrepreneur',
    location: 'Nairobi, Kenya',
    goal: '$8,000',
    raised: '$8,500',
    supporters: 34,
    timeline: '3 months',
    gradient: 'from-amber-50 to-orange-50',
    summary: 'Launched solar panel business bringing clean energy to rural homes',
    story: `I had a vision: bring affordable solar power to rural Kenyan homes still using kerosene lamps. But I needed $8,000 to purchase my first inventory of panels and installation equipment.

Traditional banks wouldn't lend to me without collateral. Local investors wanted equity I wasn't willing to give up. That's when I discovered OrangeCat.

I created a detailed business plan showing how solar panels would reduce energy costs for families by 70% while eliminating harmful kerosene fumes. I posted photos of the communities I'd serve and explained the environmental impact.

Because OrangeCat uses Bitcoin, I could receive support from anyone globally—no geographic restrictions. A retired engineer in Canada sent $500. A Bitcoin enthusiast in Singapore contributed $200. Local community members pooled together $50 each.

Every time I received a donation, I posted updates. When I bought the first batch of panels, I shared the invoice. During installations, I posted before/after photos and energy savings data. Families recorded video testimonials about how solar power changed their lives.

In 3 months, I exceeded my goal. I've now installed systems in 5 homes, each saving $30/month on energy. Those families are my marketing—word spreads fast when people see real impact. I'm already planning my second round of expansion.`,
    impact: [
      'Installed solar systems in 5 rural homes',
      'Reduced energy costs by 70% for families',
      'Eliminated kerosene lamp use and fumes',
      '$150/month in recurring customer savings',
      'Created 2 installation jobs',
    ],
    testimonial:
      'Bitcoin and OrangeCat made global funding possible. People from 8 countries supported my local business. The blockchain transparency meant I could prove every panel installation.',
  },
  {
    id: 'elena-medical',
    category: 'Medical & Research',
    emoji: '🏥',
    name: 'Dr. Elena Rodriguez',
    role: 'Parkinson\'s Researcher',
    location: 'Barcelona, Spain',
    goal: '$15,000',
    raised: '$17,200',
    supporters: 87,
    timeline: '4 months',
    gradient: 'from-red-50 to-pink-50',
    summary: 'Advanced Parkinson\'s treatment research with lab equipment funding',
    story: `My research into early-onset Parkinson\'s treatment was showing promising results, but I needed $15,000 for specialized lab equipment to accelerate trials. Grant applications take 18 months—patients don\'t have that time.

I turned to OrangeCat because I could maintain research independence. No corporate sponsors influencing my work, no giving up intellectual property rights.

I created a project explaining the science in plain language: how this equipment would let me test protein interactions 10x faster. I shared my published papers, university credentials, and preliminary results. I made a video showing exactly what the equipment does.

The Bitcoin community responded. Many supporters had family members with Parkinson's and understood the urgency. Others were scientists who believed in open, independent research.

I documented everything: equipment purchase receipts, installation photos, calibration tests. I posted weekly research updates (within ethical guidelines). When we achieved a breakthrough in protein stabilization, I shared the data openly.

The transparency attracted more support. A patient advocacy group contributed $3,000 after seeing our progress. A pharmaceutical researcher sent $500 and offered to review our methodology for free.

We exceeded our goal and advanced our research timeline by 6 months. Three peer-reviewed papers are now in submission. Most importantly, we're closer to a treatment that could help millions—funded by people who believed in open science.`,
    impact: [
      'Purchased advanced lab equipment',
      'Accelerated research timeline by 6 months',
      '3 peer-reviewed papers submitted',
      'Breakthrough in protein stabilization',
      'Maintained research independence',
    ],
    testimonial:
      'Grant funding takes 18 months. OrangeCat let me raise funds in 4 months while maintaining research independence. No corporate strings attached, just people who believe in open science.',
  },
  {
    id: 'chen-education',
    category: 'Education',
    emoji: '📚',
    name: 'Professor Chen Wei',
    role: 'Climate Researcher',
    location: 'Singapore',
    goal: '$12,000',
    raised: '$13,800',
    supporters: 56,
    timeline: '2.5 months',
    gradient: 'from-indigo-50 to-blue-50',
    summary: 'Funded field equipment for climate change research across continents',
    story: `Climate data collection requires expensive equipment and travel. My study on coastal erosion patterns needed $12,000 for sensors, drones, and fieldwork across 3 continents. University budgets were frozen.

I chose OrangeCat because climate research shouldn't be limited by arbitrary funding cycles. The data we collect today informs policy decisions for decades.

I created a project showing why this research matters: rising sea levels threaten 800 million people. I mapped out our data collection sites, explained our methodology, and showed how our findings would be made publicly available.

Environmental advocates globally sent support. A high school science class in Norway contributed $200 after their teacher showed them our work. Bitcoin miners concerned about their environmental impact sent larger amounts, wanting to support renewable energy research.

I documented every phase: purchasing equipment (with receipts), training local research assistants (with photos), collecting data (with drone footage), and analyzing results (with charts). All data goes into open-access databases.

We exceeded our goal and collected data from 15 coastal sites across South America, Southeast Asia, and East Africa. Our findings are being used by 3 governments to inform coastal development policy. The UN climate panel cited our data in their latest report.

Every supporter received detailed results summaries. They could see their $50 or $500 contribution turning into real-world policy change. That's the power of transparent, direct funding.`,
    impact: [
      'Collected data from 15 coastal sites across 3 continents',
      'Findings used by 3 governments for policy',
      'UN climate panel cited our data',
      'Trained 8 local research assistants',
      'All data released as open-access',
    ],
    testimonial:
      'Climate research can\'t wait for slow funding cycles. OrangeCat let me start fieldwork immediately. Supporters from 20 countries backed science that will inform policy for decades.',
  },
  {
    id: 'maria-family',
    category: 'Family Support',
    emoji: '👨‍👩‍👧',
    name: 'Maria Gonzalez',
    role: 'Single Mother',
    location: 'Mexico City, Mexico',
    goal: '$3,000',
    raised: '$3,400',
    supporters: 41,
    timeline: '3 weeks',
    gradient: 'from-rose-50 to-pink-50',
    summary: 'Sent three children to school for full year with community support',
    story: `As a single mother of three, I lost my job during the pandemic. I needed $3,000 for school supplies, uniforms, and food to get my kids through the school year. Traditional loans had impossible interest rates.

A friend told me about OrangeCat. I was skeptical—who would help a stranger? But I was desperate enough to try.

I posted photos of my kids, explained our situation honestly, and created a detailed budget: $800 for uniforms, $1,200 for books and supplies, $1,000 for meals. I promised to show receipts for every purchase.

The response overwhelmed me. Our local church community sent Bitcoin. My sister in the US contributed. Strangers who'd been in similar situations sent $20, $50, $100.

I documented everything. Photos of shopping for uniforms (with receipts). Pictures of the kids' first day of school. Report cards showing they were excelling. Thank-you videos from each child.

People could see their donations working. One supporter who sent $50 for school supplies later sent $200 more when she saw my daughter's straight-A report card. Another offered to pay for music lessons.

We exceeded our goal. My kids finished the school year with excellent grades. My oldest won a scholarship for secondary school—she wrote her essay about the kindness of strangers and Bitcoin. I found new work, and I'm paying it forward by supporting other families' projects.

OrangeCat didn't just help us financially—it restored my faith in human kindness. And the Bitcoin technology meant no platform took a cut from my children's education.`,
    impact: [
      'All 3 children completed school year',
      'Oldest daughter won scholarship',
      'Eldest achieved straight-A grades',
      'Mother found stable employment',
      'Now supporting other families',
    ],
    testimonial:
      'I was skeptical anyone would help a stranger. But OrangeCat connected me with people who\'d been in my situation. No platform fees meant every dollar went to my children\'s education.',
  },
  {
    id: 'alex-developer',
    category: 'Technology',
    emoji: '💻',
    name: 'Alex Chen',
    role: 'Open Source Developer',
    location: 'Berlin, Germany',
    goal: '$5,000',
    raised: '$6,200',
    supporters: 73,
    timeline: '1 month',
    gradient: 'from-blue-50 to-cyan-50',
    summary: 'Funded Bitcoin wallet development for privacy-focused users',
    story: `I maintain an open-source Bitcoin wallet focused on privacy. Big tech companies fund wallets that compromise privacy. I needed $5,000 for hosting costs and full-time development for 3 months.

OrangeCat was perfect—using Bitcoin to fund Bitcoin tools. I outlined my roadmap: implementing coin-join features, improving UI/UX, and adding hardware wallet support.

I shared my GitHub repository (8,000 stars), showed previous contributions to Bitcoin Core, and detailed exactly how funds would be used: $2,000 for cloud hosting, $3,000 for living expenses while coding full-time.

The Bitcoin community responded enthusiastically. Users who valued privacy sent support. Other developers contributed and offered code reviews. A Bitcoin podcast host interviewed me and his audience sent more donations.

I posted weekly development updates: code commits, bug fixes, new features. I shared server bills to show hosting costs. When I implemented the coin-join feature, I posted a tutorial showing it working.

Users could see their $10 or $100 contribution turning into real software. One supporter who sent $50 later contributed code for iOS support. Another who sent $200 helped with Japanese translations.

We exceeded our goal. The wallet now has 50,000 downloads and 12,000 active users. I built it on my terms—no venture capital pressuring me to add tracking or sell user data. The privacy community funded a privacy tool. That's how it should be.`,
    impact: [
      '50,000 wallet downloads',
      '12,000 active users',
      'Implemented coin-join privacy features',
      'Added hardware wallet support',
      'Maintained zero tracking/data collection',
    ],
    testimonial:
      'Big tech funds wallets that compromise privacy. OrangeCat let the privacy community fund a privacy tool—no investors pressuring me to add tracking or monetize user data.',
  },
  {
    id: 'san-pedro-community',
    category: 'Community & Infrastructure',
    emoji: '🏗️',
    name: 'Community of San Pedro',
    role: 'Village Infrastructure Project',
    location: 'Guatemala',
    goal: '$25,000',
    raised: '$27,500',
    supporters: 134,
    timeline: '6 months',
    gradient: 'from-slate-50 to-gray-50',
    summary: 'Brought clean water to 500 families through community-led project',
    story: `Our village of 500 families relies on contaminated well water. Children get sick regularly. We needed $25,000 for a water filtration system, but government funding was years away.

Our village council created an OrangeCat project. We posted photos of contaminated wells, water quality test results, and engineering plans for a multi-stage filtration system. We showed permits and quotes from contractors.

What happened next amazed us. Guatemalan diaspora sent support from the US and Canada. Engineers offered technical advice. A water charity contributed $5,000 after verifying our plans.

We documented every phase: breaking ground (with ceremony photos), installing pipes (with construction updates), testing water quality (with lab results), and finally, clean water flowing (with videos of families filling containers).

The transparency built unprecedented trust. When we needed an additional $2,000 for deeper excavation, supporters sent it within a week because they'd seen how carefully we managed the first funds.

Six months later, 500 families have clean water. Hospital visits for waterborne illness dropped 80%. School attendance improved because kids aren't sick. Women spend less time collecting water and more time on income-generating work.

We invited supporters to visit. Three Bitcoin donors from El Salvador came to see the project. They were amazed that their donations actually built something tangible. Now they're funding a school renovation.

This project showed our community what's possible when you have tools for transparent fundraising. We're planning a community internet project next—also on OrangeCat.`,
    impact: [
      'Provided clean water to 500 families',
      '80% reduction in waterborne illness',
      'Improved school attendance',
      'Women gained 10+ hours/week for work',
      'Inspired 3 additional community projects',
    ],
    testimonial:
      'Government funding was years away. OrangeCat let our community raise funds directly and show every donor exactly how we built a water system that changed 500 families\' lives.',
  },
  {
    id: 'maya-conservation',
    category: 'Environmental',
    emoji: '🌍',
    name: 'Dr. Maya Patel',
    role: 'Conservation Biologist',
    location: 'Mumbai, India',
    goal: '$18,000',
    raised: '$21,300',
    supporters: 94,
    timeline: '4 months',
    gradient: 'from-emerald-50 to-green-50',
    summary: 'Protected 200 acres of rainforest habitat for endangered species',
    story: `The rainforest I study is home to 3 endangered species. Logging companies were moving in. I needed $18,000 to purchase equipment and hire local guides for a conservation survey that would support legal protection.

Traditional conservation grants require 12-18 months of bureaucracy. The logging permits would be approved in 6 months. We didn't have time.

I created an OrangeCat project with research data, species population studies, and photos of the forest canopy. I explained how our survey data would support government protection orders.

Environmental activists globally sent Bitcoin. A wildlife photographer contributed $1,000 and offered to document the project. Students from my university contributed small amounts. A Bitcoin mining operation focused on renewable energy sent $5,000.

I posted weekly updates: hiring local guides (with contracts), purchasing camera traps (with receipts), conducting surveys (with drone footage), and documenting species (with photos of rare animals captured by camera traps).

The visual documentation was powerful. Supporters saw their donations protecting actual forest. When we documented a critically endangered bird species thought extinct, the project went viral in conservation circles.

We exceeded our goal and surveyed 200 acres. Our data convinced the government to grant temporary protection while permanent protections are considered. We employed 8 local residents as guides and monitors—giving them income alternatives to logging work.

Three logging permits were denied based on our species data. The Bitcoin transparency meant every donor could verify their contribution protected actual acres of forest. Some are now funding our expansion to survey 500 more acres.`,
    impact: [
      'Surveyed and documented 200 acres',
      'Government granted protection status',
      '3 logging permits denied',
      'Employed 8 local conservation guides',
      'Documented critically endangered species',
    ],
    testimonial:
      'Conservation grants take 18 months. Logging permits take 6. OrangeCat let me raise funds in 4 months and save 200 acres. Bitcoin transparency meant donors could verify their money protected actual forest.',
  },
];

export default function StoriesPageClient() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter stories based on category and search
  const filteredStories = allStories.filter((story) => {
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      story.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-bitcoinOrange/10 via-tiffany-50 to-bitcoinOrange/10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6">
              <Button variant="ghost" href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Real People.{' '}
              <span className="bg-gradient-to-r from-bitcoinOrange to-orange-600 bg-clip-text text-transparent">
                Real Stories.
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-8">
              From artists to entrepreneurs, researchers to families—see how people worldwide use
              direct Bitcoin funding to make real change happen.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">{allStories.length}</span>
                <span className="text-sm text-gray-600">Success Stories</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-green-600">$0</span>
                <span className="text-sm text-gray-600">Platform Fees</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">100%</span>
                <span className="text-sm text-gray-600">To Creators</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'bg-bitcoinOrange text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bitcoinOrange focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`h-full hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br ${story.gradient}`}
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-white shadow-md flex-shrink-0`}
                    >
                      {story.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{story.name}</h2>
                      <p className="text-base font-semibold text-gray-700">{story.role}</p>
                      <p className="text-sm text-gray-600">{story.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">Category</div>
                      <div className="text-xs text-gray-500">{story.category}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{story.goal}</div>
                      <div className="text-xs text-gray-600">Goal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{story.raised}</div>
                      <div className="text-xs text-gray-600">Raised</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{story.supporters}</div>
                      <div className="text-xs text-gray-600">Supporters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{story.timeline}</div>
                      <div className="text-xs text-gray-600">Timeline</div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700">{story.summary}</p>
                  </div>

                  {/* Full Story */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">The Full Story</h3>
                    <div className="prose prose-sm max-w-none">
                      {story.story.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-gray-700 leading-relaxed mb-3">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Impact Achieved</h3>
                    <ul className="space-y-2">
                      {story.impact.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Testimonial */}
                  <blockquote className="border-l-4 border-bitcoinOrange pl-4 py-2 bg-white/40 rounded-r-lg">
                    <p className="text-gray-800 italic">"{story.testimonial}"</p>
                    <footer className="text-sm text-gray-600 mt-2">— {story.name}</footer>
                  </blockquote>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No stories match your search.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="mt-4 text-bitcoinOrange hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-bitcoinOrange/10 via-tiffany-50 to-bitcoinOrange/10 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Write Your Story?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join hundreds of creators, entrepreneurs, and changemakers using Bitcoin to fund their
            dreams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" href="/auth">
              Start Your Project
            </Button>
            <Button variant="outline" size="lg" href="/discover">
              Browse Active Projects
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
