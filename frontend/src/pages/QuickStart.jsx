import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Sparkles, Zap, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Target, Clock, Globe } from 'lucide-react';

const PLATFORMS = [
  { id: 'tiktok',    name: 'TikTok',    icon: '🎵', bg: 'bg-black' },
  { id: 'youtube',   name: 'YouTube',   icon: '▶️', bg: 'bg-red-600' },
  { id: 'x',         name: 'X',         icon: '𝕏',  bg: 'bg-zinc-900' },
  { id: 'instagram', name: 'Instagram', icon: '📸', bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' },
  { id: 'facebook',  name: 'Facebook',  icon: '📘', bg: 'bg-blue-600' },
  { id: 'linkedin',  name: 'LinkedIn',  icon: '💼', bg: 'bg-blue-700' }
];

const TONES = [
  { id: 'professional',  label: 'Professional',  emoji: '💼' },
  { id: 'casual',        label: 'Casual & Friendly', emoji: '😊' },
  { id: 'funny',         label: 'Funny',           emoji: '😄' },
  { id: 'educational',   label: 'Educational',     emoji: '📚' },
  { id: 'inspirational', label: 'Inspirational',   emoji: '✨' }
];

const LANGUAGES = [
  { id: 'en', label: 'English',  flag: '🇬🇧' },
  { id: 'sw', label: 'Swahili',  flag: '🇹🇿' },
  { id: 'fr', label: 'French',   flag: '🇫🇷' },
  { id: 'es', label: 'Spanish',  flag: '🇪🇸' }
];

export default function QuickStart() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState([]);
  const [prefs, setPrefs] = useState({ niche: '', postsPerDay: 2, tone: 'professional', language: 'en' });
  const [connecting, setConnecting] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleConnect = async () => {
    if (selected.length === 0) return toast.error('Select at least one platform');
    setConnecting(true);
    const first = selected[0];
    try {
      const { data } = await api.get(`/oauth/${first}/authorize`);
      window.location.href = data.authUrl;
    } catch {
      toast.error('Failed to start connection');
      setConnecting(false);
    }
  };

  const createCampaign = useMutation(async () => {
    const { data: accountsData } = await api.get('/social-accounts');
    const accountIds = (accountsData.accounts || []).map(a => a.id);
    if (accountIds.length === 0) throw new Error('No accounts connected');

    return api.post('/campaigns', {
      name: `Auto Campaign — ${prefs.niche || 'Content'}`,
      niche: prefs.niche,
      platforms: selected,
      social_account_ids: accountIds,
      content_types: ['text', 'image'],
      posting_frequency: { posts_per_day: prefs.postsPerDay, times: prefs.postsPerDay === 2 ? ['09:00','18:00'] : ['12:00'] },
      language: prefs.language,
      tone: prefs.tone,
      auto_publish: true,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0]
    });
  }, {
    onSuccess: () => {
      toast.success('🎉 Automation activated!');
      setTimeout(() => navigate('/'), 1500);
    },
    onError: () => {
      toast.error('Failed to create campaign');
      navigate('/campaigns');
    }
  });

  const next = () => {
    if (step === 0 && selected.length === 0) return toast.error('Select at least one platform');
    if (step === 1 && !prefs.niche) return toast.error('Enter your content niche');
    if (step === 2) return createCampaign.mutate();
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">

        {/* ── Header ───────────────────── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <Sparkles size={14} /> Quick Start Wizard
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 0 && 'Connect your social accounts'}
            {step === 1 && 'Tell us about your content'}
            {step === 2 && 'Activate your automation'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 0 && 'Select the platforms you want to automate'}
            {step === 1 && 'Help our AI create the perfect content for you'}
            {step === 2 && 'Review and start — everything runs automatically after this'}
          </p>
        </div>

        {/* ── Progress ─────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-600 text-white shadow-glow-sm' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? <CheckCircle2 size={15} /> : i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 0: Platforms ───────── */}
        {step === 0 && (
          <div className="card animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PLATFORMS.map(p => {
                const isSel = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`p-5 rounded-2xl border-2 transition-all text-center relative
                      ${isSel ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                  >
                    {isSel && <CheckCircle2 size={18} className="absolute top-3 right-3 text-indigo-500" />}
                    <div className={`w-12 h-12 ${p.bg} rounded-xl flex items-center justify-center text-2xl mx-auto mb-2`}>
                      {p.icon}
                    </div>
                    <p className="font-semibold text-sm text-gray-800">{p.name}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              You can connect more accounts later in Settings
            </p>
          </div>
        )}

        {/* ── Step 1: Preferences ──────── */}
        {step === 1 && (
          <div className="card animate-fade-in space-y-5">
            <div>
              <label className="label">What's your content niche? <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={prefs.niche}
                onChange={e => setPrefs({ ...prefs, niche: e.target.value })}
                placeholder="e.g., Tech tutorials, Fitness tips, Cooking recipes"
                className="input"
              />
            </div>

            <div>
              <label className="label">How often should we post?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: 1, label: '1x daily',  desc: 'Once' },
                  { val: 2, label: '2x daily',  desc: 'Twice' },
                  { val: 3, label: '3x daily',  desc: 'Triple' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setPrefs({ ...prefs, postsPerDay: opt.val })}
                    className={`p-3 rounded-xl border-2 text-center transition-all
                      ${prefs.postsPerDay === opt.val ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <Clock size={18} className="mx-auto mb-1 text-indigo-500" />
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Content tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPrefs({ ...prefs, tone: t.id })}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2
                      ${prefs.tone === t.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Language</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setPrefs({ ...prefs, language: l.id })}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2
                      ${prefs.language === l.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                  >
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Summary ──────────── */}
        {step === 2 && (
          <div className="card animate-fade-in space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-6 text-center text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <Zap size={36} className="mx-auto mb-2" />
              <h3 className="text-xl font-bold">Ready to Automate!</h3>
              <p className="text-white/80 text-sm mt-1">AI will generate and publish content on autopilot</p>
            </div>

            {[
              { label: 'Platforms', value: selected.map(s => PLATFORMS.find(p => p.id === s)?.name).join(', ') },
              { label: 'Niche', value: prefs.niche },
              { label: 'Frequency', value: `${prefs.postsPerDay}x daily` },
              { label: 'Tone', value: TONES.find(t => t.id === prefs.tone)?.label },
              { label: 'Language', value: LANGUAGES.find(l => l.id === prefs.language)?.label },
              { label: 'Auto-publish', value: 'Enabled — no approval needed' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 text-right">{item.value}</span>
              </div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              💡 <strong>What happens next:</strong> AI generates fresh content based on your niche every 6 hours
              and publishes automatically at the best times. You can pause or edit anytime.
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────── */}
        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          <button
            onClick={step === 0 ? handleConnect : next}
            disabled={connecting || createCampaign.isLoading}
            className={`btn btn-primary btn-lg ${connecting || createCampaign.isLoading ? 'btn-disabled' : ''}`}
          >
            {connecting && <Loader2 size={18} className="animate-spin" />}
            {step === 0 && (connecting ? 'Redirecting...' : 'Connect Accounts')}
            {step === 1 && <>Continue <ArrowRight size={16} /></>}
            {step === 2 && (createCampaign.isLoading ? <><Loader2 size={18} className="animate-spin" /> Activating...</> : <>🚀 Activate Automation</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
