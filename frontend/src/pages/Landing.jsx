import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, TrendingUp, Users, Globe, Clock, BarChart3, Bot, Send,
  Check, ArrowRight, Star, Sparkles, Play, Calendar, Palette,
  Video, Mic, FileText, Image, Shield, Rocket, ChevronRight,
  MessageSquare, Layers, Target,
} from 'lucide-react';

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Buffer Style */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your social media workspace
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered marketing that runs on autopilot. Create, schedule, and publish content across all platforms — without lifting a finger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-200"
              >
                Get started free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 text-lg"
              >
                Sign in
              </Link>
            </div>
            
            {/* Platform Icons - Floating Grid */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { emoji: '🎵', name: 'TikTok', color: 'bg-black' },
                { emoji: '▶️', name: 'YouTube', color: 'bg-red-600' },
                { emoji: '𝕏', name: 'X', color: 'bg-black' },
                { emoji: '📸', name: 'Instagram', color: 'bg-pink-500' },
                { emoji: '📘', name: 'Facebook', color: 'bg-blue-600' },
                { emoji: '💼', name: 'LinkedIn', color: 'bg-blue-700' },
              ].map((platform, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-default"
                >
                  <span className="text-2xl">{platform.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              No credit card required • Free plan forever • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Main Features - Card Layout */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Publish */}
            <FeatureCard
              icon={<Send className="w-8 h-8" />}
              title="Publish"
              subtitle="The most complete set of publishing integrations, ever"
              description="Schedule your content to 6 major platforms including TikTok, YouTube, Instagram, Facebook, X, and LinkedIn — all from one unified dashboard."
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />

            {/* Create */}
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Create"
              subtitle="Turn any idea into the perfect post"
              description="AI generates images, videos, voiceovers, and copy tailored to each platform. One brief creates content for all channels automatically."
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />

            {/* Autopilot */}
            <FeatureCard
              icon={<Bot className="w-8 h-8" />}
              title="Autopilot"
              subtitle="Set it once, let it run for 30 days"
              description="AI builds your marketing strategy, generates content daily, adapts it per platform, and publishes at optimal times — completely autonomous."
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />

            {/* Insights */}
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Insights"
              subtitle="Answers, not just analytics"
              description="Track engagement, reach, and conversions across all platforms. AI analyzes performance and recommends what to improve next."
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />

            {/* Community */}
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Community"
              subtitle="Reply to comments in a flash"
              description="Manage comments and messages from all platforms in one unified inbox. Never miss an engagement opportunity again."
              iconColor="text-pink-600"
              iconBg="bg-pink-50"
            />

            {/* Quality Control */}
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Quality Control"
              subtitle="Every post validated before publishing"
              description="8-point quality checks ensure brand consistency, platform compliance, and content safety. Set approval workflows for team content."
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
          </div>
        </div>
      </section>

      {/* AI Autopilot Showcase */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              <Bot className="w-4 h-4" />
              AI Autopilot Mode
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Marketing that runs itself
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Describe your business once. AI handles everything else for the next 30 days.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Target, title: 'Strategy', desc: '30-day marketing plan' },
              { icon: Calendar, title: 'Calendar', desc: '60+ content pieces scheduled' },
              { icon: Layers, title: 'Adaptation', desc: 'Auto-formatted for each platform' },
              { icon: TrendingUp, title: 'Optimization', desc: 'AI improves based on results' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  How it works
                </h3>
                <div className="space-y-6">
                  {[
                    { step: '1', text: 'Enter your business info and goals', time: '2 min' },
                    { step: '2', text: 'AI creates your 30-day strategy', time: '30 sec' },
                    { step: '3', text: 'Autopilot generates & publishes daily', time: 'Ongoing' },
                    { step: '4', text: 'Monitor, adjust, and optimize', time: 'Anytime' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-10 h-10 flex-shrink-0 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-gray-900 font-medium mb-1">{item.text}</p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-8 border border-emerald-100">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">AI is analyzing your industry...</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Generated Strategy</p>
                    <p className="text-sm font-medium text-gray-900">Week 1: Brand awareness campaign</p>
                    <p className="text-xs text-gray-600 mt-1">3 posts/day • 6 platforms • Educational focus</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Next Post</p>
                    <p className="text-sm font-medium text-gray-900">How to boost engagement by 300%</p>
                    <p className="text-xs text-gray-600 mt-1">Scheduled: Today at 2:30 PM • TikTok, Instagram</p>
                  </div>
                  <div className="flex gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center text-lg">
                        {['🎵', '▶️', '𝕏', '📸', '📘', '💼'][i]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Content pieces generated', value: '1M+' },
              { label: 'Hours saved monthly', value: '50K+' },
              { label: 'Marketing teams trust us', value: '2,500+' },
              { label: 'Platforms supported', value: '6' },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free. Scale as you grow. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for trying out Publift"
              features={[
                '3 social accounts',
                '10 posts per month',
                'Basic scheduler',
                'AI content generation',
                'Platform adaptation',
                'Mobile app',
              ]}
              cta="Start free"
              ctaLink="/register"
              popular={false}
            />

            {/* Pro */}
            <PricingCard
              name="Pro"
              price="$29"
              period="per month"
              description="For serious marketers and growing teams"
              features={[
                '10 social accounts',
                'Unlimited posts',
                'AI Autopilot (30 days)',
                'Advanced analytics',
                'Team collaboration',
                'Priority support',
                'Custom branding',
                'API access',
              ]}
              cta="Start 14-day trial"
              ctaLink="/register"
              popular={true}
            />

            {/* Enterprise */}
            <PricingCard
              name="Enterprise"
              price="Custom"
              period="contact sales"
              description="For agencies and large organizations"
              features={[
                'Unlimited accounts',
                'Unlimited posts',
                'White-label solution',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee',
                'Training & onboarding',
                'Custom AI models',
              ]}
              cta="Contact sales"
              ctaLink="/register"
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to automate your marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of marketers who've automated their content creation. Start free today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all text-lg shadow-xl"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-blue-100 text-sm mt-4">
            No credit card required • 14-day free trial on all plans
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
                <span className="text-xl font-bold text-white">Publift</span>
              </div>
              <p className="text-sm">
                AI-powered social media marketing that runs on autopilot.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Publift. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────

function FeatureCard({ icon, title, subtitle, description, iconColor, iconBg }) {
  return (
    <div className="group p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all bg-white">
      <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm font-medium text-gray-600 mb-3">{subtitle}</p>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, ctaLink, popular }) {
  return (
    <div className={`relative rounded-2xl p-8 ${popular ? 'bg-blue-600 text-white border-4 border-blue-700 shadow-2xl scale-105' : 'bg-white border border-gray-200'}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-gray-900 rounded-full text-sm font-bold">
          Most Popular
        </div>
      )}
      <div className="text-center mb-8">
        <h3 className={`text-2xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
        <div className="mb-2">
          <span className={`text-5xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>{price}</span>
          {price !== 'Custom' && <span className={`text-lg ${popular ? 'text-blue-100' : 'text-gray-600'}`}>/{period}</span>}
        </div>
        <p className={`text-sm ${popular ? 'text-blue-100' : 'text-gray-600'}`}>{description}</p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${popular ? 'text-blue-200' : 'text-green-500'}`} />
            <span className={`text-sm ${popular ? 'text-blue-50' : 'text-gray-700'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className={`block w-full py-3 px-4 rounded-lg font-semibold text-center transition-all ${
          popular
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
