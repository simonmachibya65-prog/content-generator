import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Building2, Package, Users, Target, Palette, Check,
  ArrowRight, ArrowLeft, Loader2, Globe, Zap, Upload,
  Plus, X, MapPin, ShoppingBag
} from 'lucide-react';

const INDUSTRIES = [
  'Fashion & Clothing', 'Food & Restaurant', 'Technology', 'Real Estate',
  'Healthcare', 'Education', 'Beauty & Cosmetics', 'Fitness & Wellness',
  'Finance', 'Entertainment', 'Travel & Tourism', 'Retail', 'Automotive',
  'Construction', 'Agriculture', 'Media & Marketing', 'NGO & Non-profit', 'Other'
];

const MARKETING_GOALS = [
  { id: 'brand_awareness', label: 'Brand Awareness', icon: '📢' },
  { id: 'increase_sales', label: 'Increase Sales', icon: '💰' },
  { id: 'generate_leads', label: 'Generate Leads', icon: '🎯' },
  { id: 'engagement', label: 'Grow Engagement', icon: '❤️' },
  { id: 'website_traffic', label: 'Drive Website Traffic', icon: '🌐' },
  { id: 'community', label: 'Build Community', icon: '👥' },
  { id: 'customer_retention', label: 'Retain Customers', icon: '🔄' },
  { id: 'product_launch', label: 'Product Launch', icon: '🚀' }
];

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'sw', label: 'Swahili', flag: '🇹🇿' },
  { id: 'fr', label: 'French', flag: '🇫🇷' },
  { id: 'es', label: 'Spanish', flag: '🇪🇸' },
  { id: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { id: 'pt', label: 'Portuguese', flag: '🇧🇷' }
];

const BRAND_COLORS_PRESETS = [
  { name: 'Ocean', primary: '#0EA5E9', secondary: '#6366F1', accent: '#10B981' },
  { name: 'Sunset', primary: '#F97316', secondary: '#EC4899', accent: '#FBBF24' },
  { name: 'Forest', primary: '#10B981', secondary: '#059669', accent: '#34D399' },
  { name: 'Royal', primary: '#7C3AED', secondary: '#6366F1', accent: '#A78BFA' },
  { name: 'Crimson', primary: '#EF4444', secondary: '#DC2626', accent: '#FCA5A5' },
  { name: 'Slate', primary: '#64748B', secondary: '#475569', accent: '#94A3B8' }
];

const STEPS = [
  { id: 0, label: 'Business', icon: Building2 },
  { id: 1, label: 'Products', icon: Package },
  { id: 2, label: 'Audience', icon: Users },
  { id: 3, label: 'Goals', icon: Target },
  { id: 4, label: 'Brand', icon: Palette },
  { id: 5, label: 'Review', icon: Check }
];

export default function BusinessSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [productInput, setProductInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    business_description: '',
    website: '',
    products: [],
    services: [],
    target_location: '',
    target_audience: {
      age_range: '',
      gender: 'all',
      interests: []
    },
    marketing_goals: [],
    preferred_languages: ['en'],
    brand_colors: { primary: '#00d4aa', secondary: '#6366f1', accent: '#10b981' },
    promotional_offers: '',
    contact_info: { phone: '', email: '' }
  });

  const saveMut = useMutation(
    (data) => api.post('/business/profile', data),
    {
      onSuccess: () => {
        toast.success('Business profile saved! Generating brand intelligence...');
        // Trigger brand intelligence generation
        api.post('/business/brand-intelligence').then(() => {
          toast.success('Brand intelligence ready! 🧠');
        });
        navigate('/ai-intelligence');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to save')
    }
  );

  const next = () => {
    if (step === 0 && !form.business_name) return toast.error('Enter your business name');
    if (step === 0 && !form.industry) return toast.error('Select your industry');
    if (step === 5) return saveMut.mutate({ ...form, products: form.products.join('\n'), services: form.services.join('\n') });
    setStep(s => s + 1);
  };

  const toggleGoal = (id) => {
    setForm(prev => ({
      ...prev,
      marketing_goals: prev.marketing_goals.includes(id)
        ? prev.marketing_goals.filter(g => g !== id)
        : [...prev.marketing_goals, id]
    }));
  };

  const toggleLang = (id) => {
    setForm(prev => ({
      ...prev,
      preferred_languages: prev.preferred_languages.includes(id)
        ? prev.preferred_languages.filter(l => l !== id)
        : [...prev.preferred_languages, id]
    }));
  };

  const addProduct = () => {
    if (!productInput.trim()) return;
    setForm(prev => ({ ...prev, products: [...prev.products, productInput.trim()] }));
    setProductInput('');
  };

  const addService = () => {
    if (!serviceInput.trim()) return;
    setForm(prev => ({ ...prev, services: [...prev.services, serviceInput.trim()] }));
    setServiceInput('');
  };

  return (
    <div className="min-h-screen bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-3xl animate-fade-in-up">

        {/* ── Logo ─────────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-dark-base" />
          </div>
          <span className="text-xl font-bold text-white">Cotents</span>
        </div>

        {/* ── Header ─────────────────── */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {step === 0 && 'Tell us about your business'}
            {step === 1 && 'What do you sell?'}
            {step === 2 && 'Who are your customers?'}
            {step === 3 && 'What are your goals?'}
            {step === 4 && 'Your brand identity'}
            {step === 5 && 'Review your profile'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 0 && 'This helps our AI understand your business'}
            {step === 1 && 'Add your products and services'}
            {step === 2 && 'Help us target the right audience'}
            {step === 3 && 'Select all that apply'}
            {step === 4 && 'Customize your brand colors and style'}
            {step === 5 && 'Everything looks good? Let\'s activate your AI marketing!'}
          </p>
        </div>

        {/* ── Progress Steps ──────────── */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  ${done ? 'bg-emerald-500/20 text-emerald-400' : active ? 'bg-accent-primary/20 text-accent-primary' : 'bg-dark-surface text-gray-600'}`}>
                  {done ? <Check size={13} /> : <Icon size={13} />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-4 h-px ${i < step ? 'bg-emerald-500' : 'bg-dark-border'}`} />}
              </div>
            );
          })}
        </div>

        {/* ── Step Content ──────────── */}
        <div className="card animate-fade-in">

          {/* STEP 0: Business basics */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="label">Business name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => setForm({ ...form, business_name: e.target.value })}
                  placeholder="e.g., Fashion House, TechCorp, Mama Mboga"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Industry <span className="text-red-400">*</span></label>
                <select
                  value={form.industry}
                  onChange={e => setForm({ ...form, industry: e.target.value })}
                  className="select"
                >
                  <option value="">Select your industry...</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Business description</label>
                <textarea
                  value={form.business_description}
                  onChange={e => setForm({ ...form, business_description: e.target.value })}
                  placeholder="Briefly describe what your business does..."
                  className="textarea h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Website (optional)</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={e => setForm({ ...form, website: e.target.value })}
                      placeholder="https://yoursite.com"
                      className="input pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={form.target_location}
                      onChange={e => setForm({ ...form, target_location: e.target.value })}
                      placeholder="Tanzania, Kenya, Global..."
                      className="input pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Products & Services */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="label">Products</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={productInput}
                    onChange={e => setProductInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addProduct()}
                    placeholder="Add a product (press Enter)"
                    className="input flex-1"
                  />
                  <button onClick={addProduct} className="btn btn-primary">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.products.map((p, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-dark-surface border border-dark-border text-white px-3 py-1.5 rounded-xl text-sm">
                      <ShoppingBag size={13} className="text-accent-primary" />
                      {p}
                      <button onClick={() => setForm(prev => ({ ...prev, products: prev.products.filter((_, j) => j !== i) }))} className="ml-1 text-gray-500 hover:text-red-400">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Services</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={e => setServiceInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addService()}
                    placeholder="Add a service (press Enter)"
                    className="input flex-1"
                  />
                  <button onClick={addService} className="btn btn-primary">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.services.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-dark-surface border border-dark-border text-white px-3 py-1.5 rounded-xl text-sm">
                      <Package size={13} className="text-indigo-400" />
                      {s}
                      <button onClick={() => setForm(prev => ({ ...prev, services: prev.services.filter((_, j) => j !== i) }))} className="ml-1 text-gray-500 hover:text-red-400">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Promotional offers (optional)</label>
                <textarea
                  value={form.promotional_offers}
                  onChange={e => setForm({ ...form, promotional_offers: e.target.value })}
                  placeholder="e.g., 10% off first order, Free delivery on orders over $50..."
                  className="textarea h-20"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Target Audience */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="label">Target age range</label>
                <div className="grid grid-cols-3 gap-3">
                  {['13-17', '18-24', '25-34', '35-44', '45-54', '55+'].map(age => (
                    <button
                      key={age}
                      onClick={() => setForm(prev => ({ ...prev, target_audience: { ...prev.target_audience, age_range: age } }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all
                        ${form.target_audience.age_range === age ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['all', 'male', 'female'].map(g => (
                    <button
                      key={g}
                      onClick={() => setForm(prev => ({ ...prev, target_audience: { ...prev.target_audience, gender: g } }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                        ${form.target_audience.gender === g ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}
                    >
                      {g === 'all' ? 'Everyone' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Preferred content languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      onClick={() => toggleLang(l.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${form.preferred_languages.includes(l.id) ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}
                    >
                      <span>{l.flag}</span> {l.label}
                      {form.preferred_languages.includes(l.id) && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Marketing Goals */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-400 mb-4">Select all goals that apply to your business</p>
              <div className="grid grid-cols-2 gap-3">
                {MARKETING_GOALS.map(goal => {
                  const selected = form.marketing_goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                        ${selected ? 'border-accent-primary bg-accent-primary/10' : 'border-dark-border hover:border-dark-border-light'}`}
                    >
                      <span className="text-2xl">{goal.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${selected ? 'text-accent-primary' : 'text-white'}`}>
                          {goal.label}
                        </p>
                      </div>
                      {selected && <Check size={16} className="text-accent-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Brand Identity */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="label">Brand color presets</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  {BRAND_COLORS_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => setForm(prev => ({ ...prev, brand_colors: { primary: preset.primary, secondary: preset.secondary, accent: preset.accent } }))}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dark-border hover:border-accent-primary transition-all"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ background: preset.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ background: preset.secondary }} />
                        <div className="w-4 h-4 rounded-full" style={{ background: preset.accent }} />
                      </div>
                      <span className="text-xs text-gray-500">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {['primary', 'secondary', 'accent'].map(colorKey => (
                    <div key={colorKey}>
                      <label className="label capitalize">{colorKey} color</label>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-surface border border-dark-border">
                        <input
                          type="color"
                          value={form.brand_colors[colorKey]}
                          onChange={e => setForm(prev => ({ ...prev, brand_colors: { ...prev.brand_colors, [colorKey]: e.target.value } }))}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-sm font-mono text-gray-400">{form.brand_colors[colorKey]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone number</label>
                  <input
                    type="tel"
                    value={form.contact_info.phone}
                    onChange={e => setForm(prev => ({ ...prev, contact_info: { ...prev.contact_info, phone: e.target.value } }))}
                    placeholder="+255 700 000 000"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Business email</label>
                  <input
                    type="email"
                    value={form.contact_info.email}
                    onChange={e => setForm(prev => ({ ...prev, contact_info: { ...prev.contact_info, email: e.target.value } }))}
                    placeholder="info@yourbusiness.com"
                    className="input"
                  />
                </div>
              </div>

              {/* Color preview */}
              <div className="rounded-xl overflow-hidden border border-dark-border">
                <div className="h-16 flex" style={{
                  background: `linear-gradient(135deg, ${form.brand_colors.primary}, ${form.brand_colors.secondary})`
                }}>
                  <div className="flex items-center px-5 gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg" />
                    <div>
                      <div className="w-24 h-2 bg-white/80 rounded-full mb-1" />
                      <div className="w-16 h-1.5 bg-white/50 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-dark-surface flex gap-2">
                  <div className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: form.brand_colors.primary }}>
                    Primary
                  </div>
                  <div className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: form.brand_colors.secondary }}>
                    Secondary
                  </div>
                  <div className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: form.brand_colors.accent }}>
                    Accent
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl" style={{ background: `linear-gradient(135deg, ${form.brand_colors.primary}, ${form.brand_colors.secondary})` }}>
                    {form.business_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{form.business_name}</h3>
                    <p className="text-sm text-accent-primary">{form.industry}</p>
                  </div>
                </div>
              </div>

              {[
                { label: 'Location', value: form.target_location || 'Not specified' },
                { label: 'Website', value: form.website || 'Not specified' },
                { label: 'Products', value: form.products.join(', ') || 'None added' },
                { label: 'Services', value: form.services.join(', ') || 'None added' },
                { label: 'Target Age', value: form.target_audience.age_range || 'All ages' },
                { label: 'Goals', value: form.marketing_goals.map(g => MARKETING_GOALS.find(mg => mg.id === g)?.label).filter(Boolean).join(', ') || 'None selected' },
                { label: 'Languages', value: form.preferred_languages.map(l => LANGUAGES.find(lang => lang.id === l)?.label).join(', ') }
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-dark-border last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-white text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}

              <div className="rounded-xl bg-dark-surface border border-dark-border p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Zap size={18} className="text-accent-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">AI will now:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Analyze your business and create a brand intelligence profile</li>
                      <li>• Generate a personalized marketing strategy</li>
                      <li>• Suggest the best content types and posting schedule</li>
                      <li>• Be ready to generate content tailored to your brand</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────── */}
        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="btn btn-secondary">Skip for now</button>
          )}

          <button
            onClick={next}
            disabled={saveMut.isLoading}
            className={`btn btn-primary btn-lg ${saveMut.isLoading ? 'btn-disabled' : ''}`}
          >
            {saveMut.isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : step === 5 ? (
              <>🚀 Activate AI Marketing</>
            ) : (
              <>Continue <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
