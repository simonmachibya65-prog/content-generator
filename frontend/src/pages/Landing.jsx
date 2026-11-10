import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Zap, BarChart3, MessageSquare, Calendar,
  Sparkles, Users, Bot, Send, TrendingUp, Globe, Shield,
  ChevronRight, Star, Play,
} from 'lucide-react';
import {
  FaTiktok, FaYoutube, FaXTwitter, FaInstagram, FaFacebookF, FaLinkedinIn,
  FaPinterest, FaThreads, FaMastodon,
} from 'react-icons/fa6';
import { SiBluesky, SiSubstack, SiDropbox } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';

/* ─── Floating social icon positions (matches Buffer layout) ───── */
const FLOATING_ICONS = [
  // LEFT side
  { Icon: FcGoogle,      style: { top: '12%',  left: '7%'  }, size: 28, label: 'Google' },
  { Icon: FaXTwitter,    style: { top: '28%',  left: '12%' }, size: 32, color: '#000',    label: 'X' },
  { Icon: FaLinkedinIn,  style: { top: '50%',  left: '7%'  }, size: 28, color: '#0A66C2', label: 'LinkedIn' },
  { Icon: SiBluesky,     style: { top: '68%',  left: '15%' }, size: 24, color: '#0085FF', label: 'Bluesky' },
  { Icon: FcGoogle,      style: { top: '82%',  left: '8%'  }, size: 22, label: 'Google' },
  // RIGHT side
  { Icon: FaXTwitter,    style: { top: '8%',   right: '12%'}, size: 24, color: '#000',    label: 'X' },
  { Icon: FaPinterest,   style: { top: '20%',  right: '6%' }, size: 28, color: '#E60023', label: 'Pinterest' },
  { Icon: FaThreads,     style: { top: '36%',  right: '12%'}, size: 26, color: '#000',    label: 'Threads' },
  { Icon: FaFacebookF,   style: { top: '52%',  right: '7%' }, size: 28, color: '#1877F2', label: 'Facebook' },
  { Icon: FaMastodon,    style: { top: '68%',  right: '13%'}, size: 22, color: '#6364FF', label: 'Mastodon' },
  { Icon: SiSubstack,    style: { top: '80%',  right: '7%' }, size: 20, color: '#FF6719', label: 'Substack' },
];

/* ─── Customer brand logos ───────────────────────────────────────── */
const BRANDS = ['VICE', 'Wired', 'Semrush', 'Crocs', 'Benefit', 'ElevenLabs', 'Shopify', 'Canva'];

/* ─── Feature cards (colored, like Buffer) ──────────────────────── */
const FEATURES = [
  {
    id: 'publish',
    label: 'Publish',
    icon: Send,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-100',
    headline: 'The most complete set of publishing integrations, ever',
    desc: 'Schedule your content to TikTok, YouTube, Instagram, Facebook, X, and LinkedIn — all from one dashboard. Auto-publish or get a notification. Never miss a day.',
    bullets: ['Recurring posting times per channel', 'Drag & drop calendar', 'Auto-publish or notification mode', 'Bulk scheduling & CSV import'],
    link: '/register',
    previewId: 'publish',
  },
  {
    id: 'create',
    label: 'Create',
    icon: Sparkles,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-100',
    headline: 'Turn any idea into the perfect post',
    desc: 'AI generates images, videos, voiceovers, and copy tailored to each platform. One brief — content for every channel. Organize ideas on a kanban board.',
    bullets: ['AI text, image & video generation', 'Kanban idea board', 'Import from Google Drive, Dropbox, Canva', 'Content templates library'],
    link: '/register',
    previewId: 'create',
  },
  {
    id: 'community',
    label: 'Community',
    icon: MessageSquare,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-100',
    headline: 'Reply to comments in a flash',
    desc: 'Manage every comment and message from all platforms in one calm, focused inbox. AI suggests replies in your voice. Never ghost your audience.',
    bullets: ['Unified comment inbox', 'AI reply suggestions', 'Saved reply templates', 'Comment score & engagement tracking'],
    link: '/register',
    previewId: 'community',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    headline: 'Answers, not just analytics',
    desc: "Plain-language takeaways tell you what's working and what to try next. See every channel at a glance. Export polished reports for clients.",
    bullets: ['Plain-language AI takeaways', 'Cross-channel performance', 'Follower growth & engagement', 'PDF/CSV export for clients'],
    link: '/register',
    previewId: 'insights',
  },
];

/* ─── Pricing ───────────────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    sub: 'Free forever',
    cta: "Get started free",
    highlight: false,
    features: [
      '3 social channels',
      '10 scheduled posts/channel',
      '100 content ideas',
      'AI Assistant',
      'Basic Insights (30 days)',
      'Community inbox',
    ],
  },
  {
    name: 'Essentials',
    price: '$9',
    sub: '/mo per channel',
    cta: 'Start 14-day free trial',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Unlimited scheduled posts',
      'Unlimited ideas',
      'Advanced Analytics',
      'Hashtag manager',
      'First comment scheduling',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    price: '$19',
    sub: '/mo per channel',
    cta: 'Start 14-day free trial',
    highlight: false,
    features: [
      'Everything in Essentials',
      'Unlimited team members',
      'Approval workflows',
      'Custom access & permissions',
      'Branded client reports',
      'Dedicated support',
    ],
  },
];

/* ─── Testimonials ──────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "Publift cuts my content work in half. I schedule a whole week in 20 minutes and the AI suggestions are actually good.",
    name: "Rita Iglesias",
    role: "Software engineer & creator",
    avatar: "RI",
    color: "bg-violet-500",
  },
  {
    quote: "The per-channel pricing is perfect for agencies. I only pay for what I actually use — no bloated plan fees.",
    name: "Alexandrea Bowman",
    role: "Sapphire Social",
    avatar: "AB",
    color: "bg-blue-500",
  },
  {
    quote: "Insights' plain-language takeaways changed how I report to clients. No more drowning in charts.",
    name: "Dustin Kuhns",
    role: "Marketing Consultant",
    avatar: "DK",
    color: "bg-green-500",
  },
];

export default function Landing() {
  const [email, setEmail] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const emailRef = useRef();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    navigate(`/register?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════════════════════
          HERO — floating icons + email capture
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white min-h-[600px] flex items-center">
        {/* Floating platform icons */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {FLOATING_ICONS.map(({ Icon, style, size, color, label }, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-md border border-stone-100 hover:scale-110 transition-transform"
              style={style}
              title={label}
            >
              <Icon style={{ color, fontSize: size }} />
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center w-full">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 mb-5 leading-[1.1] tracking-tight">
            Your social media<br />workspace
          </h1>
          <p className="text-xl text-stone-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Works with every platform you post to,<br className="hidden sm:block" />
            and plugs into your favorite tools
          </p>

          {/* Email capture — Buffer style */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-5">
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="w-full px-5 py-3.5 rounded-full border border-stone-200 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
            <button
              type="submit"
              className="whitespace-nowrap flex items-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
            >
              Get started for free <ArrowRight size={16} />
            </button>
          </form>
          <p className="text-xs text-stone-400">
            By entering your email, you agree to receive emails from Publift. No credit card required.
          </p>

          {/* Platform pill row — mobile only */}
          <div className="flex flex-wrap justify-center gap-2 mt-10 lg:hidden">
            {[
              { Icon: FaTiktok,    color: '#000',    name: 'TikTok' },
              { Icon: FaYoutube,   color: '#FF0000', name: 'YouTube' },
              { Icon: FaInstagram, color: '#E4405F', name: 'Instagram' },
              { Icon: FaFacebookF, color: '#1877F2', name: 'Facebook' },
              { Icon: FaXTwitter,  color: '#000',    name: 'X' },
              { Icon: FaLinkedinIn,color: '#0A66C2', name: 'LinkedIn' },
            ].map(({ Icon, color, name }) => (
              <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-full text-xs font-medium text-stone-600 border border-stone-100">
                <Icon style={{ color }} size={14} /> {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BRANDS / TRUST BAR
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-stone-100 bg-stone-50 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-stone-400 mb-5 font-medium">
            335,609 creators, brands, and agencies using Publift
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {BRANDS.map(brand => (
              <span key={brand} className="text-stone-300 font-bold text-lg tracking-wide uppercase select-none">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          LIVE STATS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '335,609', label: 'Active users' },
              { value: '17M+',   label: 'Posts published/month' },
              { value: '99%',    label: 'Post reliability' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-bold text-stone-900">{value}</p>
                <p className="text-sm text-stone-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURE TABS — Publish / Create / Community / Insights
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Tab pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const active = activeFeature === i;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    active
                      ? `${f.color} text-white border-transparent shadow-md`
                      : `bg-white text-stone-500 border-stone-200 hover:border-stone-300`
                  }`}
                >
                  <Icon size={15} /> {f.label}
                </button>
              );
            })}
          </div>

          {/* Active feature panel */}
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            if (i !== activeFeature) return null;
            return (
              <div key={f.id} className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in">
                {/* Left — text */}
                <div>
                  <div className={`inline-flex items-center gap-2 ${f.lightColor} ${f.textColor} px-3 py-1.5 rounded-full text-xs font-bold mb-5`}>
                    <Icon size={13} /> {f.label}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
                    {f.headline}
                  </h2>
                  <p className="text-stone-500 text-lg mb-7 leading-relaxed">{f.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {f.bullets.map(b => (
                      <li key={b} className="flex items-center gap-3">
                        <div className={`w-5 h-5 ${f.lightColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Check size={11} className={f.textColor} strokeWidth={3} />
                        </div>
                        <span className="text-stone-700 text-sm">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={f.link}
                    className={`inline-flex items-center gap-2 px-6 py-3 ${f.color} text-white rounded-full font-semibold text-sm hover:opacity-90 transition-all`}
                  >
                    Get started for free <ArrowRight size={15} />
                  </Link>
                </div>
                {/* Right — preview */}
                <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-100">
                  {f.previewId === 'publish'   && <PublishPreview />}
                  {f.previewId === 'create'    && <CreatePreview />}
                  {f.previewId === 'community' && <CommunityPreview />}
                  {f.previewId === 'insights'  && <InsightsPreview />}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PLATFORM GRID — all channels
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
            Works with every platform you post to
          </h2>
          <p className="text-stone-500 mb-12 max-w-xl mx-auto">
            Connect all your social accounts and manage them from one clean workspace.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[
              { Icon: FaTiktok,     color: '#000000', name: 'TikTok' },
              { Icon: FaYoutube,    color: '#FF0000', name: 'YouTube' },
              { Icon: FaInstagram,  color: '#E4405F', name: 'Instagram' },
              { Icon: FaFacebookF,  color: '#1877F2', name: 'Facebook' },
              { Icon: FaXTwitter,   color: '#000000', name: 'X' },
              { Icon: FaLinkedinIn, color: '#0A66C2', name: 'LinkedIn' },
              { Icon: FaPinterest,  color: '#E60023', name: 'Pinterest' },
              { Icon: FaThreads,    color: '#000000', name: 'Threads' },
              { Icon: SiBluesky,    color: '#0085FF', name: 'Bluesky' },
              { Icon: FaMastodon,   color: '#6364FF', name: 'Mastodon' },
              { Icon: SiSubstack,   color: '#FF6719', name: 'Substack' },
              { Icon: Globe,        color: '#4285F4', name: 'Google', lucide: true },
            ].map(({ Icon, color, name }) => (
              <div key={name} className="flex flex-col items-center gap-2 p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon style={{ color }} size={22} />
                </div>
                <span className="text-xs font-medium text-stone-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          AI SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold mb-5">
                <Bot size={13} /> AI Assistant
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
                Plan and post from your AI assistant
              </h2>
              <p className="text-stone-500 text-lg mb-6 leading-relaxed">
                Connect Publift to Claude or ChatGPT and manage your whole workflow from a conversation.
                Pull your performance data, plan content around what's working, and send content straight to your queue.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { step: 'Ask', desc: '"What were my top posts this month?" — AI pulls real numbers.' },
                  { step: 'Plan', desc: 'Turn what\'s working into next week\'s content ideas.' },
                  { step: 'Post', desc: 'Content lands in your queue, ready to publish.' },
                ].map(({ step, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {step[0]}
                    </div>
                    <div className="pt-0.5">
                      <span className="font-semibold text-stone-900 text-sm">{step}: </span>
                      <span className="text-stone-500 text-sm">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-semibold text-sm hover:bg-stone-800 transition-all">
                Learn more <ArrowRight size={15} />
              </Link>
            </div>

            {/* Chat mock */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">Publift AI</p>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-stone-700">Review the last 6 months of my posts and tell me which have the most engagement.</p>
                </div>
                <div className="bg-green-50 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-auto">
                  <p className="text-sm text-green-900">Your top post was <strong>"5 productivity hacks"</strong> — 2,847 likes, 312 comments. Want me to repurpose it for TikTok?</p>
                </div>
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-stone-700">Yes, and schedule it for peak time this week.</p>
                </div>
                <div className="bg-green-50 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-auto">
                  <p className="text-sm text-green-900">Done! Scheduled for Thursday 7PM — your best performing slot. ✅</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          INTEGRATIONS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-y border-stone-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-stone-400 font-medium text-sm mb-8">Works with the tools you already use</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { Icon: FcGoogle,  name: 'Google Drive', color: null },
              { Icon: SiDropbox, name: 'Dropbox',      color: '#0061FF' },
              { Icon: Globe,     name: 'Canva',        color: '#00C4CC', lucide: true },
              { Icon: Bot,       name: 'ChatGPT',      color: '#10A37F', lucide: true },
              { Icon: Sparkles,  name: 'Claude',       color: '#D97706', lucide: true },
              { Icon: Globe,     name: 'Zapier',       color: '#FF4A00', lucide: true },
              { Icon: TrendingUp,name: 'Make',         color: '#6B21A8', lucide: true },
            ].map(({ Icon, name, color, lucide }) => (
              <div key={name} className="flex flex-col items-center gap-1.5 group">
                <div className="w-11 h-11 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center group-hover:shadow-md transition-all group-hover:border-stone-200">
                  {lucide
                    ? <Icon size={22} style={{ color }} />
                    : <Icon size={22} style={color ? { color } : {}} />
                  }
                </div>
                <span className="text-xs text-stone-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
            Loved by creators and teams
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role, avatar, color }) => (
              <div key={name} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed mb-5">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{name}</p>
                    <p className="text-xs text-stone-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
              Flexible pricing for everyone
            </h2>
            <p className="text-stone-500 max-w-md mx-auto">
              Start free forever. Upgrade when you need more. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, sub, cta, highlight, badge, features }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-7 border ${
                  highlight
                    ? 'bg-green-600 border-green-700 shadow-2xl scale-105 text-white'
                    : 'bg-white border-stone-200'
                }`}
              >
                {badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-stone-900 rounded-full text-xs font-bold">
                    {badge}
                  </div>
                )}
                <h3 className={`font-bold text-xl mb-1 ${highlight ? 'text-white' : 'text-stone-900'}`}>{name}</h3>
                <div className="mb-1">
                  <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-stone-900'}`}>{price}</span>
                  <span className={`text-sm ml-1 ${highlight ? 'text-green-100' : 'text-stone-400'}`}>{sub}</span>
                </div>
                <div className={`h-px w-full my-5 ${highlight ? 'bg-green-500' : 'bg-stone-100'}`} />
                <ul className="space-y-3 mb-7">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={15} className={`flex-shrink-0 mt-0.5 ${highlight ? 'text-green-200' : 'text-green-500'}`} strokeWidth={3} />
                      <span className={`text-sm ${highlight ? 'text-green-50' : 'text-stone-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-3 rounded-full font-semibold text-center text-sm transition-all ${
                    highlight
                      ? 'bg-white text-green-700 hover:bg-green-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          OPEN COMPANY (Buffer's transparency section)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-stone-50 border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-bold mb-5">
            <Shield size={12} /> We are an open company
          </div>
          <h2 className="text-3xl font-bold text-stone-900 mb-3">
            Transparent by default
          </h2>
          <p className="text-stone-500 mb-10 max-w-xl mx-auto">
            We share our finances, roadmap, and metrics openly. You always know what you're building on.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: '335K+',  label: 'Monthly active users' },
              { value: '86K',    label: 'Total customers' },
              { value: '$28.3M', label: 'Annual revenue' },
              { value: '73',     label: 'Team members' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                <p className="text-2xl font-black text-stone-900">{value}</p>
                <p className="text-xs text-stone-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            Grow your social<br />presence with confidence
          </h2>
          <p className="text-stone-500 mb-8 text-lg">
            No credit card needed. Free forever.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="flex-1 px-5 py-3.5 rounded-full border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-green-700 transition-all"
            >
              Get started free <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-stone-900 text-stone-400 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg">Publift</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Your social media workspace. Works with every platform, plugs into your favorite tools.
              </p>
              <div className="flex gap-3">
                {[FaXTwitter, FaInstagram, FaLinkedinIn, FaYoutube].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-colors">
                    <Icon size={14} className="text-stone-300" />
                  </a>
                ))}
              </div>
            </div>
            {/* Links */}
            {[
              { title: 'Product', links: ['Publish', 'Create', 'Community', 'Insights', 'Pricing'] },
              { title: 'Resources', links: ['Documentation', 'Help Center', 'Blog', 'Templates'] },
              { title: 'Company', links: ['About', 'Careers', 'Contact', 'Privacy', 'Terms'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2025 Publift. All rights reserved.</p>
            <p>Built for creators, marketers, and agencies worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Feature Preview Components ───────────────────────────────── */

function PublishPreview() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const times = ['9 AM', '12 PM', '3 PM', '6 PM'];
  const posts = [
    { day: 0, time: 1, Icon: FaInstagram, color: '#E4405F' },
    { day: 1, time: 0, Icon: FaTiktok,    color: '#000' },
    { day: 2, time: 2, Icon: FaFacebookF, color: '#1877F2' },
    { day: 3, time: 1, Icon: FaXTwitter,  color: '#000' },
    { day: 4, time: 3, Icon: FaLinkedinIn,color: '#0A66C2' },
  ];
  return (
    <div className="bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-stone-900 text-sm">Content Calendar</p>
        <span className="text-xs text-stone-400">November 2026</span>
      </div>
      <div className="grid grid-cols-5 gap-1 mb-1">
        {days.map(d => <p key={d} className="text-center text-xs text-stone-400 font-medium">{d}</p>)}
      </div>
      <div className="relative">
        {times.map((t, ti) => (
          <div key={t} className="grid grid-cols-5 gap-1 mb-1">
            {days.map((_, di) => {
              const post = posts.find(p => p.day === di && p.time === ti);
              return (
                <div key={di} className={`h-10 rounded-lg border ${post ? 'border-transparent' : 'border-stone-100 bg-stone-50'} flex items-center justify-center`}
                  style={post ? { backgroundColor: `${post.color}15`, borderColor: `${post.color}30` } : {}}
                >
                  {post && <post.Icon size={16} style={{ color: post.color }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {[FaTiktok, FaInstagram, FaYoutube, FaFacebookF].map((Icon, i) => (
          <div key={i} className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center">
            <Icon size={12} className="text-stone-500" />
          </div>
        ))}
        <span className="text-xs text-stone-400 ml-1 self-center">4 channels connected</span>
      </div>
    </div>
  );
}

function CreatePreview() {
  const cols = [
    { title: 'Ideas', color: 'bg-stone-100 text-stone-600', items: ['Summer product shoot', 'Behind the scenes reel', 'Customer story'] },
    { title: 'Drafting', color: 'bg-blue-100 text-blue-700', items: ['5 tips thread', 'Product launch post'] },
    { title: 'Ready', color: 'bg-green-100 text-green-700', items: ['Monday motivation', 'Weekly recap'] },
  ];
  return (
    <div className="bg-white p-5">
      <p className="font-semibold text-stone-900 text-sm mb-4">Content Board</p>
      <div className="grid grid-cols-3 gap-3">
        {cols.map(col => (
          <div key={col.title}>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2 ${col.color}`}>{col.title}</span>
            <div className="space-y-1.5">
              {col.items.map(item => (
                <div key={item} className="bg-stone-50 rounded-lg p-2 border border-stone-100">
                  <p className="text-xs text-stone-700 leading-tight">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityPreview() {
  const comments = [
    { platform: FaInstagram, color: '#E4405F', user: '@sarah_m', text: 'Love this content! 🔥', time: '2m' },
    { platform: FaTiktok,    color: '#000',    user: '@johnk',   text: 'Can you do a tutorial?', time: '5m' },
    { platform: FaFacebookF, color: '#1877F2', user: '@mike.d',  text: 'Sharing this with my team', time: '8m' },
    { platform: FaXTwitter,  color: '#000',    user: '@alex99',  text: 'This is exactly what I needed', time: '12m' },
  ];
  return (
    <div className="bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-stone-900 text-sm">Community Inbox</p>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">4 new</span>
      </div>
      <div className="space-y-2.5">
        {comments.map(({ platform: Icon, color, user, text, time }) => (
          <div key={user} className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
              <Icon size={14} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-700">{user}</p>
                <span className="text-[10px] text-stone-400">{time}</span>
              </div>
              <p className="text-xs text-stone-500 truncate">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsPreview() {
  const bars = [
    { label: 'Mon', value: 65, color: 'bg-blue-400' },
    { label: 'Tue', value: 85, color: 'bg-blue-500' },
    { label: 'Wed', value: 55, color: 'bg-blue-400' },
    { label: 'Thu', value: 95, color: 'bg-green-500' },
    { label: 'Fri', value: 70, color: 'bg-blue-400' },
    { label: 'Sat', value: 45, color: 'bg-blue-300' },
    { label: 'Sun', value: 60, color: 'bg-blue-400' },
  ];
  return (
    <div className="bg-white p-5">
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Impressions', value: '28.4K', change: '+11%', up: true },
          { label: 'Engagement', value: '6,429', change: '+7%',  up: true },
          { label: 'Followers',  value: '807',   change: '+25%', up: true },
        ].map(({ label, value, change, up }) => (
          <div key={label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
            <p className="text-xs text-stone-400 mb-1">{label}</p>
            <p className="font-bold text-stone-900 text-sm">{value}</p>
            <p className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>{change}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1 h-16">
        {bars.map(({ label, value, color }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full rounded-t-sm ${color} transition-all`} style={{ height: `${value}%` }} />
            <p className="text-[10px] text-stone-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">✨ AI Takeaway</p>
        <p className="text-xs text-blue-600">Your Thursday posts perform 35% better. Consider posting more on Thursdays.</p>
      </div>
    </div>
  );
}
