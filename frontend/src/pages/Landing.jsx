import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Zap, BarChart3, MessageSquare,
  Sparkles, Bot, Send, TrendingUp, Globe, Shield, Star,
} from 'lucide-react';
import {
  FaTiktok, FaYoutube, FaXTwitter, FaInstagram, FaFacebookF, FaLinkedinIn,
  FaPinterest, FaThreads, FaMastodon,
} from 'react-icons/fa6';
import { SiBluesky, SiSubstack, SiDropbox } from 'react-icons/si';

/* ─── All platforms ───────────────────────────── */
const ALL_PLATFORMS = [
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
];

/* ─── Floating icons layout ───────────────────── */
const FLOATING = [
  { Icon: FaYoutube,    color: '#FF0000', style: { top: '15%', left: '6%' } },
  { Icon: FaXTwitter,   color: '#000',    style: { top: '32%', left: '11%' } },
  { Icon: FaLinkedinIn, color: '#0A66C2', style: { top: '52%', left: '6%' } },
  { Icon: SiBluesky,    color: '#0085FF', style: { top: '70%', left: '13%' } },
  { Icon: FaPinterest,  color: '#E60023', style: { top: '18%', right: '8%' } },
  { Icon: FaThreads,    color: '#000',    style: { top: '36%', right: '5%' } },
  { Icon: FaFacebookF,  color: '#1877F2', style: { top: '55%', right: '10%' } },
  { Icon: FaMastodon,   color: '#6364FF', style: { top: '72%', right: '5%' } },
  { Icon: FaTiktok,     color: '#000',    style: { top: '85%', left: '8%' } },
  { Icon: SiSubstack,   color: '#FF6719', style: { top: '85%', right: '8%' } },
];

/* ─── Pricing plans ───────────────────────────── */
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    sub: 'Free forever',
    cta: 'Get started free',
    highlight: false,
    features: ['3 social channels', '10 scheduled posts/channel', '100 content ideas', 'AI Assistant', 'Basic Insights (30 days)', 'Community inbox'],
  },
  {
    name: 'Essentials',
    price: '$9',
    sub: '/mo per channel',
    cta: 'Start 14-day free trial',
    highlight: true,
    badge: 'Most popular',
    features: ['Unlimited scheduled posts', 'Unlimited ideas', 'Advanced Analytics', 'Hashtag manager', 'First comment scheduling', 'Priority support'],
  },
  {
    name: 'Team',
    price: '$19',
    sub: '/mo per channel',
    cta: 'Start 14-day free trial',
    highlight: false,
    features: ['Everything in Essentials', 'Unlimited team members', 'Approval workflows', 'Custom access & permissions', 'Branded client reports', 'Dedicated support'],
  },
];

/* ─── Testimonials ────────────────────────────── */
const TESTIMONIALS = [
  { quote: 'SpyRex cuts my content work in half. I schedule a whole week in 20 minutes.', name: 'Rita Iglesias', role: 'Software engineer & creator', avatar: 'RI', bg: 'bg-violet-500' },
  { quote: 'The per-channel pricing is perfect for agencies. I only pay for what I use.', name: 'Alexandrea Bowman', role: 'Sapphire Social', avatar: 'AB', bg: 'bg-blue-500' },
  { quote: 'Insights plain-language takeaways changed how I report to clients.', name: 'Dustin Kuhns', role: 'Marketing Consultant', avatar: 'DK', bg: 'bg-green-500' },
];

/* ─── Feature sections ────────────────────────── */
const FEATURE_TABS = [
  {
    id: 'publish', label: 'Publish', color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600',
    headline: 'The most complete publishing tool, ever',
    desc: 'Schedule content to TikTok, YouTube, Instagram, Facebook, X, and LinkedIn from one dashboard. Auto-publish or get a notification. Never miss a day.',
    bullets: ['Recurring posting times per channel', 'Drag & drop visual calendar', 'Auto-publish or notification mode', 'Bulk scheduling & CSV import'],
  },
  {
    id: 'create', label: 'Create', color: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600',
    headline: 'Turn any idea into the perfect post',
    desc: 'AI generates images, videos, voiceovers, and copy tailored to each platform. One brief — content for every channel. Organize ideas on a kanban board.',
    bullets: ['AI text, image & video generation', 'Kanban idea board', 'Import from Google Drive, Dropbox, Canva', 'Content templates library'],
  },
  {
    id: 'community', label: 'Community', color: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600',
    headline: 'Reply to comments in a flash',
    desc: 'Manage every comment and message from all platforms in one calm, focused inbox. AI suggests replies in your voice. Never ghost your audience.',
    bullets: ['Unified comment inbox', 'AI reply suggestions', 'Saved reply templates', 'Comment score & engagement tracking'],
  },
  {
    id: 'insights', label: 'Insights', color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600',
    headline: 'Answers, not just analytics',
    desc: "Plain-language takeaways tell you what's working and what to try next. See every channel at a glance. Export polished reports for clients.",
    bullets: ['Plain-language AI takeaways', 'Cross-channel performance', 'Follower growth & engagement', 'PDF/CSV export for clients'],
  },
];

/* ─── Feature preview content ─────────────────── */
function PublishPreview() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slots = [
    { day: 0, Icon: FaInstagram, color: '#E4405F' },
    { day: 1, Icon: FaTiktok,    color: '#000' },
    { day: 2, Icon: FaFacebookF, color: '#1877F2' },
    { day: 3, Icon: FaXTwitter,  color: '#000' },
    { day: 4, Icon: FaLinkedinIn,color: '#0A66C2' },
  ];
  return (
    <div className="bg-white p-6">
      <p className="font-semibold text-stone-900 text-sm mb-4">Content Calendar — November 2026</p>
      <div className="grid grid-cols-5 gap-2 mb-2">
        {days.map(d => <p key={d} className="text-center text-xs text-stone-400 font-medium">{d}</p>)}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {days.map((_, di) => {
          const slot = slots.find(s => s.day === di);
          return (
            <div key={di} className={`h-14 rounded-xl flex items-center justify-center border ${slot ? 'border-stone-200' : 'border-stone-100 bg-stone-50'}`}
              style={slot ? { backgroundColor: `${slot.color}12` } : {}}>
              {slot && <slot.Icon size={20} style={{ color: slot.color }} />}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-4 items-center">
        {[FaTiktok, FaInstagram, FaYoutube, FaFacebookF].map((Icon, i) => (
          <div key={i} className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center">
            <Icon size={13} className="text-stone-500" />
          </div>
        ))}
        <span className="text-xs text-stone-400 ml-1">4 channels connected</span>
      </div>
    </div>
  );
}

function CreatePreview() {
  const cols = [
    { title: 'Ideas', color: 'bg-stone-100 text-stone-600', items: ['Summer product shoot', 'Behind the scenes reel'] },
    { title: 'Drafting', color: 'bg-blue-100 text-blue-700', items: ['5 tips thread', 'Product launch'] },
    { title: 'Ready', color: 'bg-green-100 text-green-700', items: ['Monday motivation', 'Weekly recap'] },
  ];
  return (
    <div className="bg-white p-6">
      <p className="font-semibold text-stone-900 text-sm mb-4">Content Board</p>
      <div className="grid grid-cols-3 gap-3">
        {cols.map(col => (
          <div key={col.title}>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2 ${col.color}`}>{col.title}</span>
            {col.items.map(item => (
              <div key={item} className="bg-stone-50 rounded-lg p-2 border border-stone-100 mb-1.5">
                <p className="text-xs text-stone-700 leading-tight">{item}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityPreview() {
  const comments = [
    { Icon: FaInstagram, color: '#E4405F', user: '@sarah_m', text: 'Love this content! 🔥', time: '2m' },
    { Icon: FaTiktok,    color: '#000',    user: '@johnk',   text: 'Can you do a tutorial?', time: '5m' },
    { Icon: FaFacebookF, color: '#1877F2', user: '@mike.d',  text: 'Sharing with my team', time: '8m' },
    { Icon: FaXTwitter,  color: '#000',    user: '@alex99',  text: 'Exactly what I needed', time: '12m' },
  ];
  return (
    <div className="bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-stone-900 text-sm">Community Inbox</p>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">4 new</span>
      </div>
      <div className="space-y-2">
        {comments.map(({ Icon, color, user, text, time }) => (
          <div key={user} className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
              <Icon size={14} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
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
    { label: 'Mon', h: 60, color: 'bg-blue-400' },
    { label: 'Tue', h: 85, color: 'bg-blue-500' },
    { label: 'Wed', h: 50, color: 'bg-blue-400' },
    { label: 'Thu', h: 95, color: 'bg-green-500' },
    { label: 'Fri', h: 70, color: 'bg-blue-400' },
    { label: 'Sat', h: 40, color: 'bg-blue-300' },
    { label: 'Sun', h: 55, color: 'bg-blue-400' },
  ];
  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Impressions', value: '28.4K', change: '+11%' },
          { label: 'Engagement',  value: '6,429', change: '+7%' },
          { label: 'Followers',   value: '807',   change: '+25%' },
        ].map(({ label, value, change }) => (
          <div key={label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
            <p className="text-[10px] text-stone-400 mb-1">{label}</p>
            <p className="font-bold text-stone-900 text-sm">{value}</p>
            <p className="text-xs font-semibold text-green-600">{change}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1 h-16 mb-3">
        {bars.map(({ label, h, color }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full rounded-t ${color}`} style={{ height: `${h}%` }} />
            <p className="text-[10px] text-stone-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">✨ AI Takeaway</p>
        <p className="text-xs text-blue-600">Thursday posts perform 35% better. Post more on Thursdays.</p>
      </div>
    </div>
  );
}

const PREVIEWS = { publish: PublishPreview, create: CreatePreview, community: CommunityPreview, insights: InsightsPreview };

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function Landing() {
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  const ActivePreview = PREVIEWS[FEATURE_TABS[activeTab].id];

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white min-h-[580px] flex items-center">
        {/* Floating icons — desktop only */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {FLOATING.map(({ Icon, color, style }, i) => (
            <div key={i} className="absolute w-12 h-12 bg-white rounded-2xl shadow-md border border-stone-100 flex items-center justify-center" style={style}>
              <Icon size={22} style={{ color }} />
            </div>
          ))}
        </div>

        <div className="relative w-full max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 mb-5 leading-[1.1] tracking-tight">
            Your social media<br />workspace
          </h1>
          <p className="text-xl text-stone-500 mb-10 max-w-lg mx-auto">
            Works with every platform you post to,<br />and plugs into your favorite tools
          </p>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-5">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="flex-1 px-5 py-3.5 rounded-full border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
            <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-green-700 transition-all whitespace-nowrap">
              Get started for free <ArrowRight size={15} />
            </button>
          </form>
          <p className="text-xs text-stone-400">No credit card required. Free forever.</p>

          {/* Platform pills — mobile */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 lg:hidden">
            {ALL_PLATFORMS.slice(0, 6).map(({ Icon, color, name, lucide }) => (
              <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-full text-xs font-medium text-stone-600 border border-stone-100">
                {lucide ? <Icon size={13} style={{ color }} /> : <Icon size={13} style={{ color }} />}
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────── */}
      <section className="border-y border-stone-100 bg-stone-50 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-stone-400 font-medium mb-4">335,609 creators, brands, and agencies using SpyRex</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {['VICE', 'Wired', 'Semrush', 'Crocs', 'Benefit', 'ElevenLabs', 'Shopify'].map(b => (
              <span key={b} className="text-stone-300 font-bold text-base uppercase tracking-wide">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '335K+', label: 'Active users' },
              { value: '17M+',  label: 'Posts/month' },
              { value: '99%',   label: 'Post reliability' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-black text-stone-900">{value}</p>
                <p className="text-sm text-stone-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE TABS ───────────────────────────────── */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {FEATURE_TABS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                  activeTab === i
                    ? `${f.color} text-white border-transparent shadow-md`
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Active panel */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${FEATURE_TABS[activeTab].light} ${FEATURE_TABS[activeTab].text}`}>
                {FEATURE_TABS[activeTab].label}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
                {FEATURE_TABS[activeTab].headline}
              </h2>
              <p className="text-stone-500 text-lg mb-6 leading-relaxed">{FEATURE_TABS[activeTab].desc}</p>
              <ul className="space-y-3 mb-8">
                {FEATURE_TABS[activeTab].bullets.map(b => (
                  <li key={b} className="flex items-center gap-3">
                    <div className={`w-5 h-5 ${FEATURE_TABS[activeTab].light} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Check size={11} className={FEATURE_TABS[activeTab].text} strokeWidth={3} />
                    </div>
                    <span className="text-stone-700 text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`inline-flex items-center gap-2 px-6 py-3 ${FEATURE_TABS[activeTab].color} text-white rounded-full font-semibold text-sm hover:opacity-90 transition-all`}>
                Get started free <ArrowRight size={15} />
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-100">
              <ActivePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── ALL PLATFORMS ──────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Works with every platform</h2>
          <p className="text-stone-500 mb-10 max-w-md mx-auto">Connect all your social accounts and manage them from one clean workspace.</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {ALL_PLATFORMS.map(({ Icon, color, name, lucide }) => (
              <div key={name} className="flex flex-col items-center gap-2 p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  {lucide ? <Icon size={20} style={{ color }} /> : <Icon size={20} style={{ color }} />}
                </div>
                <span className="text-xs font-medium text-stone-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ─────────────────────────────────── */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold mb-5">
                <Bot size={12} /> AI Assistant
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
                Plan and post from your AI assistant
              </h2>
              <p className="text-stone-500 text-lg mb-6 leading-relaxed">
                Connect SpyRex to Claude or ChatGPT and manage your whole workflow from a conversation.
              </p>
              {[
                { step: 'Ask', desc: '"What were my top posts?" — AI pulls real numbers.' },
                { step: 'Plan', desc: 'Turn what\'s working into next week\'s content ideas.' },
                { step: 'Post', desc: 'Content lands in your queue, ready to publish.' },
              ].map(({ step, desc }) => (
                <div key={step} className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{step[0]}</div>
                  <p className="text-sm text-stone-600 pt-1"><strong className="text-stone-900">{step}:</strong> {desc}</p>
                </div>
              ))}
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-semibold text-sm hover:bg-stone-800 transition-all mt-2">
                Learn more <ArrowRight size={15} />
              </Link>
            </div>
            {/* Chat mockup */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone-100">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">SpyRex AI</p>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-stone-700">Which of my posts had the most engagement last month?</p>
                </div>
                <div className="bg-green-50 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-auto">
                  <p className="text-sm text-green-900">Your top post was <strong>"5 productivity hacks"</strong> — 2,847 likes. Want me to repurpose it for TikTok?</p>
                </div>
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-stone-700">Yes, schedule it for peak time this week.</p>
                </div>
                <div className="bg-green-50 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-auto">
                  <p className="text-sm text-green-900">Done! Scheduled for Thursday 7PM ✅</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────── */}
      <section className="py-14 bg-white border-y border-stone-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-stone-400 font-medium text-sm mb-8">Works with the tools you already use</p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { Icon: SiDropbox, color: '#0061FF', name: 'Dropbox' },
              { Icon: TrendingUp, color: '#FF4A00', name: 'Zapier', lucide: true },
              { Icon: Bot, color: '#10A37F', name: 'ChatGPT', lucide: true },
              { Icon: Sparkles, color: '#D97706', name: 'Claude', lucide: true },
              { Icon: Globe, color: '#6B21A8', name: 'Make', lucide: true },
              { Icon: Send, color: '#0061FF', name: 'n8n', lucide: true },
            ].map(({ Icon, color, name, lucide }) => (
              <div key={name} className="flex flex-col items-center gap-1.5 group">
                <div className="w-11 h-11 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center group-hover:shadow-md transition-all">
                  {lucide ? <Icon size={20} style={{ color }} /> : <Icon size={20} style={{ color }} />}
                </div>
                <span className="text-xs text-stone-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────── */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">Loved by creators and teams</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role, avatar, bg }) => (
              <div key={name} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed mb-5">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{avatar}</div>
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

      {/* ── PRICING ────────────────────────────────────── */}
      <section className="py-20 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">Flexible pricing for everyone</h2>
            <p className="text-stone-500 max-w-sm mx-auto">Start free forever. Upgrade when you need more. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, sub, cta, highlight, badge, features }) => (
              <div key={name} className={`relative rounded-2xl p-7 border ${highlight ? 'bg-green-600 border-green-700 shadow-2xl scale-105' : 'bg-white border-stone-200'}`}>
                {badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-stone-900 rounded-full text-xs font-bold">{badge}</div>
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
                      <Check size={14} className={`flex-shrink-0 mt-0.5 ${highlight ? 'text-green-200' : 'text-green-500'}`} strokeWidth={3} />
                      <span className={`text-sm ${highlight ? 'text-green-50' : 'text-stone-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block w-full py-3 rounded-full font-semibold text-center text-sm transition-all ${highlight ? 'bg-white text-green-700 hover:bg-green-50' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPEN COMPANY ───────────────────────────────── */}
      <section className="py-16 bg-stone-50 border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-bold mb-5">
            <Shield size={12} /> We are an open company
          </span>
          <h2 className="text-3xl font-bold text-stone-900 mb-3">Transparent by default</h2>
          <p className="text-stone-500 mb-10 max-w-lg mx-auto">We share our finances, roadmap, and metrics openly. You always know what you're building on.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            Grow your social<br />presence with confidence
          </h2>
          <p className="text-stone-500 mb-8 text-lg">No credit card needed. Free forever.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="flex-1 px-5 py-3.5 rounded-full border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-green-700 transition-all">
              Get started free <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="bg-stone-900 text-stone-400 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg">SpyRex</span>
              </div>
              <p className="text-sm leading-relaxed">Your social media workspace. Works with every platform, plugs into your favorite tools.</p>
            </div>
            {[
              { title: 'Product',   links: ['Publish', 'Create', 'Community', 'Insights', 'Pricing'] },
              { title: 'Resources', links: ['Documentation', 'Help Center', 'Blog', 'Templates'] },
              { title: 'Company',   links: ['About', 'Careers', 'Contact', 'Privacy', 'Terms'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-sm hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2025 SpyRex. All rights reserved.</p>
            <p>Built for creators, marketers, and agencies worldwide.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
