import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, TrendingUp, Users, Globe, Clock, BarChart3, Bot, Send,
  Check, ArrowRight, Star, Sparkles, Play, Calendar, Palette,
  Video, Mic, FileText, Image, Shield, Rocket, ChevronRight,
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────
const PLATFORMS = [
  { icon: '🎵', label: 'TikTok',    color: '#000000' },
  { icon: '▶️', label: 'YouTube',   color: '#FF0000' },
  { icon: '𝕏',  label: 'X',         color: '#000000' },
  { icon: '📸', label: 'Instagram', color: '#E1306C' },
  { icon: '📘', label: 'Facebook',  color: '#1877F2' },
  { icon: '💼', label: 'LinkedIn',  color: '#0A66C2' },
];

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Autopilot',
    desc: 'Set your goals once. AI generates, schedules, and publishes content for 30 days autonomously.',
    color: '#00d4aa',
    bg: 'rgba(0,212,170,0.1)',
  },
  {
    icon: Palette,
    title: 'Creative Studio',
    desc: 'Generate images, videos, voiceovers, and copy with AI. One brief → full campaign assets.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: Globe,
    title: '6 Platform Publishing',
    desc: 'Connect TikTok, YouTube, Instagram, Facebook, X, and LinkedIn. Publish everywhere at once.',
    color: '#3b82f6',
    bg: 'rgba(59,130,247,0.1)',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduler',
    desc: 'AI recommends optimal posting times per platform. Drag-and-drop calendar included.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    desc: 'Track reach, engagement, and conversions. AI recommends what to improve next.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: Shield,
    title: 'Quality Control',
    desc: 'Every post is validated for brand consistency, platform compliance, and content safety.',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
  },
];

const STEPS = [
  {
    num: '01',
    icon: FileText,
    title: 'Describe your business',
    desc: 'Enter your business name, industry, products, and target audience. Takes 2 minutes.',
  },
  {
    num: '02',
    icon: Bot,
    title: 'AI builds your strategy',
    desc: 'AI generates a 30-day marketing plan with content pillars, themes, and a posting schedule.',
  },
  {
    num: '03',
    icon: Rocket,
    title: 'Autopilot takes over',
    desc: 'AI creates content, adapts it for each platform, and publishes automatically at optimal times.',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: 'Watch it grow',
    desc: 'Track performance, get AI recommendations, and optimize — all from one dashboard.',
  },
];

const CREATIVE_TOOLS = [
  { icon: FileText, label: 'Text & Copy',  desc: 'Captions, scripts, ads' },
  { icon: Image,    label: 'AI Images',      desc: 'Product photos, posters' },
  { icon: Video,    label: 'AI Videos',      desc: 'Reels, ads, promos' },
  { icon: Mic,      label: 'AI Voice',       desc: 'Voiceovers, narration' },
];

const PRICING = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    desc: 'Perfect for trying things out',
    features: [
      '10 AI credits / month',
      '2 social accounts',
      '1 user',
      'Basic scheduling',
      'Community support',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Creator Pro',
    price: 19,
    period: '/mo',
    desc: 'For serious content creators',
    features: [
      '200 AI credits / month',
      '10 social accounts',
      '5 team members',
      'AI Autopilot campaigns',
      'Advanced analytics',
      'Video generation',
      'Priority support',
    ],
    cta: 'Start 14-Day Trial',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    price: 49,
    period: '/mo',
    desc: 'For growing businesses',
    features: [
      '500 AI credits / month',
      '25 social accounts',
      '15 team members',
      'Full Autopilot + optimization',
      'Team workflows & approvals',
      'Advertising management',
      'Custom reports',
    ],
    cta: 'Start 14-Day Trial',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Fashion Brand Owner',
    avatar: '👩‍💼',
    text: 'Publift automated our entire social media. We went from posting once a week to 3 times a day — sales increased 40% in the first month.',
    rating: 5,
  },
  {
    name: 'David K.',
    role: 'Digital Agency',
    avatar: '👨‍💻',
    text: 'Managing 8 client accounts used to take my team all day. Now AI handles content creation and we just approve. Game changer.',
    rating: 5,
  },
  {
    name: 'Amina H.',
    role: 'Real Estate Agent',
    avatar: '👩‍🏡',
    text: 'The AI Autopilot creates property showcase videos and posts them automatically. I get leads while I sleep.',
    rating: 5,
  },
];

const STATS = [
  { value: '50K+',   label: 'Active Users' },
  { value: '2M+',    label: 'Posts Published' },
  { value: '6',      label: 'Platforms Connected' },
  { value: '98%',    label: 'Satisfaction' },
];

// ─── Component ──────────────────────────────────────────────────
export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const [visibleSection, setVisibleSection] = useState('');
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const pricingRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Scroll detection for nav highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisibleSection(entry.target.id);
        });
      },
      { threshold: 0.3 }
    );
    [featuresRef, howItWorksRef, pricingRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, [mounted]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen" style={{ background: '#080b12' }}>

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative pt-32 pb-24 overflow-hidden">

        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute animate-blob"
               style={{ width: '600px', height: '600px', top: '-200px', left: '-100px',
                 background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)',
                 animationDuration: '12s' }} />
          <div className="absolute animate-blob"
               style={{ width: '700px', height: '700px', top: '-100px', right: '-200px',
                 background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                 animationDuration: '16s', animationDelay: '-5s' }} />
          <div className="absolute inset-0 opacity-[0.02]"
               style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                 backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Sparkles size={14} className="text-[#00d4aa]" />
            <span className="text-sm font-semibold text-[#00d4aa]">AI-Powered Marketing Operating System</span>
          </div>

          {/* Headline */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '0.1s' }}>
            Create once.<br />
            <span className="relative inline-block">
              <span style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Publish everywhere.
              </span>
            </span><br />
            Grow intelligently.
          </h1>

          {/* Subheadline */}
          <p className={`text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
             style={{ transitionDelay: '0.2s' }}>
            The AI marketing platform that creates content, adapts it for every platform,
            and publishes automatically — so you never have to think about social media again.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.3s' }}>
            <Link to="/register"
                  className="group btn-shimmer relative px-8 py-4 rounded-xl text-base font-bold text-[#0a0d14] transition-all duration-300 hover:scale-105 active:scale-95 shadow-glow-teal-sm hover:shadow-glow-teal overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 50%, #00d4aa 100%)', backgroundSize: '200% 200%' }}>
              <span className="flex items-center gap-2">
                Start Free — No Credit Card
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <button onClick={() => scrollTo('how-it-works')}
                    className="px-8 py-4 rounded-xl text-base font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 flex items-center gap-2">
              <Play size={16} />
              See How It Works
            </button>
          </div>

          {/* Platform badges */}
          <div className={`flex items-center justify-center gap-3 flex-wrap transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
               style={{ transitionDelay: '0.4s' }}>
            <span className="text-sm text-gray-500 mr-2">Publishes to</span>
            {PLATFORMS.map(({ icon, label }, i) => (
              <div key={label}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.06] hover:border-white/[0.15] transition-all duration-200 hover:scale-105"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 border-y border-white/[0.04]"
               style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map(({ value, label }, i) => (
              <div key={label} className="text-center animate-fade-in-up" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="text-4xl sm:text-5xl font-black mb-2"
                     style={{ background: 'linear-gradient(135deg, #00d4aa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {value}
                </div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section id="features" ref={featuresRef} className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-4 py-1.5 mb-4">
              <Zap size={14} className="text-[#6366f1]" />
              <span className="text-sm font-semibold text-[#6366f1]">Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Everything you need to <br />
              <span style={{ background: 'linear-gradient(135deg, #00d4aa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                dominate social media
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              One platform. Six social networks. AI that never sleeps.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div key={title}
                   className="group relative rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                   style={{ background: 'rgba(255,255,255,0.02)', animationDelay: `${0.05 * i}s` }}>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                     style={{ background: `radial-gradient(circle at 50% 0%, ${color}15 0%, transparent 70%)` }} />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                       style={{ background: bg, border: `1px solid ${color}20` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CREATIVE STUDIO SHOWCASE
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 border-y border-white/[0.04]"
               style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full px-4 py-1.5 mb-5">
                <Palette size={14} className="text-[#8b5cf6]" />
                <span className="text-sm font-semibold text-[#8b5cf6]">Creative Studio</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight mb-5">
                One brief.<br />
                <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Complete campaign assets.
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                Describe what you want. AI generates the script, images, videos, voiceovers,
                captions, and hashtags — adapted for every platform. No designer or video editor needed.
              </p>

              {/* Creative tools list */}
              <div className="grid grid-cols-2 gap-4">
                {CREATIVE_TOOLS.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                         style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <Icon size={18} className="text-[#8b5cf6]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual mockup */}
            <div className="relative">
              <div className="rounded-2xl p-8 border border-white/[0.08] relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #0d1021 0%, #1a1a2e 100%)' }}>

                {/* Mockup content */}
                <div className="space-y-4">
                  {/* Prompt bar */}
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-white/10"
                       style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Sparkles size={16} className="text-[#00d4aa] flex-shrink-0" />
                    <span className="text-sm text-slate-400 truncate">"Create a TikTok ad for luxury watches..."</span>
                  </div>

                  {/* Generated assets mockup */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: FileText, label: 'Caption',  color: '#00d4aa' },
                      { icon: Image,     label: 'Image',    color: '#6366f1' },
                      { icon: Video,     label: 'Video',    color: '#8b5cf6' },
                      { icon: Mic,        label: 'Voice',    color: '#ec4899' },
                    ].map(({ icon: Icon, label, color }, i) => (
                      <div key={label}
                           className="flex items-center gap-2 p-3 rounded-xl border border-white/[0.06] animate-fade-in-up"
                           style={{ background: 'rgba(255,255,255,0.02)', animationDelay: `${0.1 * i}s` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                             style={{ background: `${color}15` }}>
                          <Icon size={14} style={{ color }} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">{label}</div>
                          <div className="text-[10px] text-green-400 flex items-center gap-1">
                            <Check size={10} /> Ready
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Platform adaptations */}
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-white/[0.06]"
                       style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Globe size={14} className="text-slate-400 flex-shrink-0" />
                    {['IG', 'TT', 'YT', 'FB', 'X', 'LI'].map((p, i) => (
                      <span key={p} className="text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {p}
                      </span>
                    ))}
                    <span className="text-[10px] text-[#00d4aa] ml-auto">6 versions created</span>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-bold text-[#0a0d14] animate-float"
                   style={{ background: 'linear-gradient(135deg, #00d4aa, #10b981)' }}>
                ✨ AI Generated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" ref={howItWorksRef} className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-4">
              <Clock size={14} className="text-[#00d4aa]" />
              <span className="text-sm font-semibold text-[#00d4aa]">How It Works</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
              From setup to autopilot in <span style={{ color: '#00d4aa' }}>5 minutes</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              No marketing degree needed. No video editor. No social media manager.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <div key={num} className="relative group animate-fade-in-up" style={{ animationDelay: `${0.1 * i}s` }}>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px"
                       style={{ background: 'linear-gradient(90deg, rgba(0,212,170,0.3), rgba(99,102,241,0.1))' }} />
                )}

                <div className="relative">
                  {/* Number badge */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 relative"
                       style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(99,102,241,0.1))',
                               border: '1px solid rgba(0,212,170,0.2)' }}>
                    <Icon size={24} className="text-[#00d4aa]" />
                    <span className="absolute -top-2 -right-2 text-xs font-black text-white px-2 py-0.5 rounded-full"
                          style={{ background: 'linear-gradient(135deg, #00d4aa, #6366f1)' }}>
                      {num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-[#0a0d14] transition-all duration-300 hover:scale-105 active:scale-95 shadow-glow-teal-sm"
                  style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 100%)' }}>
              Set up my autopilot
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 border-y border-white/[0.04]"
               style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-full px-4 py-1.5 mb-4">
              <Star size={14} className="text-[#f59e0b]" fill="#f59e0b" />
              <span className="text-sm font-semibold text-[#f59e0b]">Loved by creators</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              What our users say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, text, rating }, i) => (
              <div key={name}
                   className="rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                   style={{ background: 'rgba(255,255,255,0.02)', animationDelay: `${0.1 * i}s` }}>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(rating)].map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400" fill="#facc15" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-slate-300 leading-relaxed mb-6">"{text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                       style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{name}</div>
                    <div className="text-xs text-gray-500">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" ref={pricingRef} className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-4 py-1.5 mb-4">
              <TrendingUp size={14} className="text-[#6366f1]" />
              <span className="text-sm font-semibold text-[#6366f1]">Pricing</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div key={plan.name}
                   className={`relative rounded-2xl p-8 transition-all duration-300 ${plan.highlight ? 'scale-105 border-2' : 'border hover:scale-[1.02]'}`}
                   style={plan.highlight
                     ? { borderColor: '#00d4aa', background: 'linear-gradient(135deg, rgba(0,212,170,0.05), rgba(99,102,241,0.05))' }
                     : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[#0a0d14]"
                       style={{ background: 'linear-gradient(135deg, #00d4aa, #10b981)' }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan name */}
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ background: 'rgba(0,212,170,0.15)' }}>
                        <Check size={12} className="text-[#00d4aa]" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-300">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link to="/register"
                      className={`block text-center py-3.5 rounded-xl font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95
                        ${plan.highlight ? 'text-[#0a0d14] shadow-glow-teal-sm' : 'text-white border border-white/10 hover:border-white/20'}`}
                      style={plan.highlight
                        ? { background: 'linear-gradient(135deg, #00d4aa, #10b981)' }
                        : { background: 'rgba(255,255,255,0.02)' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="text-center text-sm text-gray-500 mt-8">
            All plans include AI content generation, platform adaptation, and quality control.
            <br />Paid advertising spend is billed separately by each platform.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <div className="rounded-3xl p-12 border border-white/[0.08] relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #0d1021 0%, #0f1a14 50%, #0d1021 100%)' }}>

            {/* Glow orbs */}
            <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] rounded-full opacity-20 animate-blob"
                 style={{ background: 'radial-gradient(circle, #00d4aa 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-50%] right-[-20%] w-[400px] h-[400px] rounded-full opacity-15 animate-blob"
                 style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '-4s' }} />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-6">
                <Rocket size={14} className="text-[#00d4aa]" />
                <span className="text-sm font-semibold text-[#00d4aa]">Ready to automate?</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
                Start growing your brand<br />
                <span style={{ background: 'linear-gradient(135deg, #00d4aa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  on autopilot today
                </span>
              </h2>

              <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
                Join 50,000+ creators and businesses using Publift to grow their social media automatically.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register"
                      className="group btn-shimmer relative px-8 py-4 rounded-xl text-base font-bold text-[#0a0d14] transition-all duration-300 hover:scale-105 active:scale-95 shadow-glow-teal-sm hover:shadow-glow-teal overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 50%, #00d4aa 100%)', backgroundSize: '200% 200%' }}>
                  <span className="flex items-center gap-2">
                    Create free account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link to="/login"
                      className="px-8 py-4 rounded-xl text-base font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200">
                  Sign in
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6 mt-8">
                {['🔒 Secure', '⚡ Free plan', '🚀 No setup needed', '🌍 6 platforms'].map((item) => (
                  <span key={item} className="text-xs text-gray-500 font-medium">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-12"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-[#00d4aa] to-emerald-500 rounded-xl flex items-center justify-center">
                  <Zap size={18} className="text-[#0a0d14]" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-black text-white">Publift</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI-powered social media management. Create once. Publish everywhere. Grow intelligently.
              </p>
            </div>

            {/* Links */}
            <div>
              <div className="text-sm font-semibold text-white mb-3">Product</div>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Creative Studio', 'AI Autopilot'].map((item) => (
                  <button key={item} onClick={() => scrollTo(item.toLowerCase().replace(/ /g, '-'))}
                          className="block text-sm text-gray-500 hover:text-[#00d4aa] transition-colors">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white mb-3">Company</div>
              <div className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <span key={item} className="block text-sm text-gray-500 hover:text-[#00d4aa] transition-colors cursor-pointer">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white mb-3">Legal</div>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((item) => (
                  <span key={item} className="block text-sm text-gray-500 hover:text-[#00d4aa] transition-colors cursor-pointer">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
            <p className="text-xs text-gray-600">© 2026 Publift. All rights reserved.</p>
            <div className="flex items-center gap-3">
              {PLATFORMS.map(({ icon, label }) => (
                <div key={label} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition-transform cursor-pointer"
                     style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
