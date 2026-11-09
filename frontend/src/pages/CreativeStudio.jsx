import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Sparkles, Plus, Image as ImageIcon, Video, Mic, PenTool,
  Loader2, Play, Check, Download, Copy, RefreshCw, Edit2,
  ArrowRight, ArrowLeft, Zap, Eye, Send, Trash2, X,
  Film, Layout, FileText, Globe, Target, Clock, ChevronDown,
  CheckCircle2, AlertCircle, Wand2
} from 'lucide-react';

// ─── CATEGORY DEFINITIONS ─────────────────────────────────────
const CATEGORIES = [
  { id: 'social_media', label: 'Social Media', icon: '📱', desc: 'Posts, carousels & stories', color: 'from-pink-500 to-rose-500' },
  { id: 'image_ad', label: 'Image Ad', icon: '🖼️', desc: 'Posters, banners & flyers', color: 'from-blue-500 to-cyan-500' },
  { id: 'video_ad', label: 'Video Ad', icon: '🎥', desc: 'Commercials, reels & shorts', color: 'from-violet-500 to-purple-600' },
  { id: 'product', label: 'Product Marketing', icon: '🛍️', desc: 'Product promotions & launches', color: 'from-amber-500 to-orange-500' },
  { id: 'business', label: 'Business Campaign', icon: '🏢', desc: 'Corporate & brand campaigns', color: 'from-emerald-500 to-teal-500' },
  { id: 'educational', label: 'Educational', icon: '📚', desc: 'Tutorials & explainer content', color: 'from-indigo-500 to-blue-600' },
  { id: 'custom', label: 'Custom', icon: '✨', desc: 'User-defined creative project', color: 'from-gray-500 to-gray-600' }
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'x', label: 'X', icon: '𝕏' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' }
];

const OBJECTIVES = [
  { id: 'awareness', label: 'Brand Awareness', icon: '📢' },
  { id: 'sales', label: 'Drive Sales', icon: '💰' },
  { id: 'leads', label: 'Generate Leads', icon: '🎯' },
  { id: 'engagement', label: 'Boost Engagement', icon: '❤️' },
  { id: 'traffic', label: 'Drive Traffic', icon: '🌐' },
  { id: 'launch', label: 'Product Launch', icon: '🚀' }
];

// ─── Production progress bar ──────────────────────────────────
function ProductionProgress({ projectId, onComplete }) {
  const [progress, setProgress] = useState({ status: 'generating', progress: 0, current_step: 'Starting...' });

  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/creative/projects/${projectId}/progress`);
        setProgress(data);
        if (data.status === 'ready' || data.status === 'failed') {
          clearInterval(interval);
          if (data.status === 'ready') onComplete?.();
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [projectId]);

  const steps = [
    { key: 'planning', label: 'Planning' },
    { key: 'text', label: 'Writing copy' },
    { key: 'images', label: 'Creating images' },
    { key: 'video', label: 'Generating video' },
    { key: 'audio', label: 'Adding voiceover' },
    { key: 'editing', label: 'Adapting platforms' },
    { key: 'ready', label: 'Ready!' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white">{progress.current_step || 'Processing...'}</span>
        <span className="text-sm font-bold text-accent-primary">{progress.progress || 0}%</span>
      </div>
      <div className="h-3 bg-dark-base rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-primary to-emerald-500 rounded-full transition-all duration-1000"
          style={{ width: `${progress.progress || 0}%` }}
        />
      </div>
      <div className="flex justify-between">
        {steps.map((step, i) => {
          const pct = (i / (steps.length - 1)) * 100;
          const done = (progress.progress || 0) >= pct;
          const active = Math.abs((progress.progress || 0) - pct) < 15;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full transition-all ${done ? 'bg-accent-primary' : 'bg-dark-border'} ${active ? 'ring-4 ring-accent-primary/30' : ''}`} />
              <span className={`text-[9px] font-medium hidden sm:block ${done ? 'text-accent-primary' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {progress.status === 'failed' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">Production failed: {progress.error_message}</p>
        </div>
      )}
    </div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────
function AssetCard({ asset, onRegenerate, onEdit }) {
  const [copied, setCopied] = useState(false);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  return (
    <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border group relative">
      {asset.asset_type === 'image' ? (
        <div className="relative">
          {asset.file_url ? (
            <img src={asset.file_url} alt={asset.asset_subtype} className="w-full rounded-xl mb-3 object-cover aspect-square" />
          ) : (
            <div className="w-full aspect-square rounded-xl bg-dark-base border border-dark-border flex items-center justify-center mb-3">
              {asset.status === 'generating' ? (
                <Loader2 size={24} className="animate-spin text-accent-primary" />
              ) : (
                <ImageIcon size={32} className="text-gray-700" />
              )}
            </div>
          )}
          <div className="flex gap-2">
            {asset.file_url && (
              <a href={asset.file_url} download className="btn btn-secondary btn-sm flex-1">
                <Download size={13} /> Download
              </a>
            )}
            <button onClick={() => onRegenerate(asset)} className="btn btn-secondary btn-sm flex-1">
              <RefreshCw size={13} /> Regenerate
            </button>
          </div>
        </div>
      ) : asset.asset_type === 'text' ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="badge badge-primary capitalize text-xs">{asset.asset_subtype?.replace('_', ' ')}</span>
            <div className="flex gap-1">
              <button onClick={() => copy(asset.content_text)} className="p-1.5 text-gray-500 hover:text-accent-primary rounded-lg">
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
              <button onClick={() => onEdit(asset)} className="p-1.5 text-gray-500 hover:text-accent-primary rounded-lg">
                <Edit2 size={13} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">
            {asset.asset_subtype === 'captions'
              ? Object.entries(JSON.parse(asset.content_text || '{}')).map(([p, c]) => `${p}: ${c}`).join('\n')
              : asset.content_text
            }
          </p>
        </div>
      ) : asset.asset_type === 'video_scene' ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <Film size={15} className="text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-white capitalize">{asset.asset_subtype?.replace('_', ' ')}</p>
          </div>
          {asset.file_url ? (
            <video src={asset.file_url} controls className="w-full rounded-xl" />
          ) : (
            <div className="p-3 rounded-xl bg-dark-base border border-dark-border">
              <p className="text-xs text-gray-400">{asset.content_text}</p>
              {asset.status === 'placeholder' && (
                <p className="text-xs text-amber-400 mt-1">⚠️ Video generation requires Veo or Runway API key</p>
              )}
            </div>
          )}
        </div>
      ) : asset.asset_type === 'voiceover' ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Mic size={15} className="text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-white">Voiceover Script</p>
          </div>
          <p className="text-xs text-gray-400 italic line-clamp-3">"{asset.content_text}"</p>
        </div>
      ) : null}

      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
        asset.status === 'ready' ? 'bg-emerald-400' :
        asset.status === 'generating' ? 'bg-amber-400 animate-pulse' :
        asset.status === 'failed' ? 'bg-red-400' : 'bg-gray-600'
      }`} />
    </div>
  );
}

// ─── Brief Card ───────────────────────────────────────────────
function BriefCard({ brief, onApprove }) {
  const [expanded, setExpanded] = useState(false);
  const scenes = typeof brief.video_scenes === 'string'
    ? JSON.parse(brief.video_scenes || '[]')
    : (brief.video_scenes || []);

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-white text-lg">{brief.headline}</h3>
          <p className="text-sm text-accent-primary mt-1">"{brief.tagline}"</p>
        </div>
        {!brief.approved && (
          <button onClick={onApprove} className="btn btn-primary btn-sm">
            <Check size={14} /> Approve Brief
          </button>
        )}
        {brief.approved && <span className="badge badge-success"><Check size={11} /> Approved</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-dark-surface border border-dark-border">
          <p className="text-xs font-bold text-gray-500 mb-1">OBJECTIVE</p>
          <p className="text-sm text-gray-200">{brief.objective}</p>
        </div>
        <div className="p-3 rounded-xl bg-dark-surface border border-dark-border">
          <p className="text-xs font-bold text-gray-500 mb-1">KEY MESSAGE</p>
          <p className="text-sm text-gray-200">{brief.key_message}</p>
        </div>
        <div className="p-3 rounded-xl bg-dark-surface border border-dark-border">
          <p className="text-xs font-bold text-gray-500 mb-1">TARGET AUDIENCE</p>
          <p className="text-sm text-gray-200">{brief.target_audience}</p>
        </div>
        <div className="p-3 rounded-xl bg-dark-surface border border-dark-border">
          <p className="text-xs font-bold text-gray-500 mb-1">CTA</p>
          <p className="text-sm font-bold text-accent-primary">{brief.cta}</p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-accent-primary/5 border border-accent-primary/20">
        <p className="text-xs font-bold text-accent-primary mb-1">CREATIVE CONCEPT</p>
        <p className="text-sm text-gray-300">{brief.creative_concept}</p>
      </div>

      {scenes.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <Film size={15} className="text-accent-primary" />
            Video Script — {scenes.length} scenes
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="mt-3 space-y-2">
              {scenes.map((scene, i) => (
                <div key={i} className="p-3 rounded-xl bg-dark-surface border border-dark-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {scene.scene}
                    </span>
                    <span className="text-xs text-gray-500">{scene.duration}s</span>
                    <span className="text-xs text-gray-400">{scene.description}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic ml-8">{scene.voiceover}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {brief.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {brief.hashtags.map(tag => (
            <span key={tag} className="badge badge-primary text-xs">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Platform Versions Panel ──────────────────────────────────
function PlatformVersions({ versions, project }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-white">Platform Versions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {versions.map((v, i) => (
          <div key={i} className="p-4 rounded-2xl bg-dark-surface border border-dark-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{PLATFORMS.find(p => p.id === v.platform)?.icon || '📱'}</span>
              <div>
                <p className="font-semibold text-white capitalize">{v.platform}</p>
                <p className="text-xs text-gray-500 capitalize">{v.format} • {v.aspect_ratio} • {v.resolution}</p>
              </div>
              {v.duration && <span className="ml-auto text-xs text-gray-500">{v.duration}s</span>}
            </div>
            {v.caption && (
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{v.caption}</p>
            )}
            {v.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(v.hashtags || []).slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-accent-primary">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(v.caption || ''); toast.success('Caption copied!'); }}
                className="btn btn-secondary btn-sm flex-1"
              >
                <Copy size={12} /> Copy Caption
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEW PROJECT WIZARD ───────────────────────────────────────
function NewProjectWizard({ onCreated }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', category: '',
    business_name: '', product_service: '', description: '',
    objective: '', target_audience: '', country: 'Tanzania',
    language: 'en', platforms: ['instagram', 'tiktok'],
    special_instructions: '', ad_duration: 30
  });

  const createMut = useMutation(
    () => api.post('/creative/projects', form),
    {
      onSuccess: ({ data }) => {
        toast.success('Project created!');
        onCreated(data.project);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to create project')
    }
  );

  const togglePlatform = (id) => setForm(prev => ({
    ...prev,
    platforms: prev.platforms.includes(id)
      ? prev.platforms.filter(p => p !== id)
      : [...prev.platforms, id]
  }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <h2 className="text-xl font-bold text-white mb-6">
        {step === 0 && 'What are you creating?'}
        {step === 1 && 'Tell us about your project'}
        {step === 2 && 'Target & platforms'}
      </h2>

      {/* STEP 0: Category */}
      {step === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setForm({ ...form, category: cat.id }); setStep(1); }}
              className="p-5 rounded-2xl border-2 border-dark-border hover:border-accent-primary text-center transition-all group hover:bg-accent-primary/5"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <p className="font-bold text-white text-sm">{cat.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{cat.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: Project Info */}
      {step === 1 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-surface border border-dark-border mb-4">
            <span className="text-2xl">{CATEGORIES.find(c => c.id === form.category)?.icon}</span>
            <span className="font-semibold text-white">{CATEGORIES.find(c => c.id === form.category)?.label}</span>
          </div>

          <div>
            <label className="label">Project name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Sugar Product Launch Campaign"
              className="input"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Business/Brand name</label>
              <input type="text" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="Your brand" className="input" />
            </div>
            <div>
              <label className="label">Product/Service <span className="text-red-400">*</span></label>
              <input type="text" value={form.product_service} onChange={e => setForm({ ...form, product_service: e.target.value })} placeholder="What you're advertising" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your product, its benefits, why people should buy it..."
              className="textarea h-20"
            />
          </div>

          <div>
            <label className="label">Marketing objective</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {OBJECTIVES.map(obj => (
                <button key={obj.id} onClick={() => setForm({ ...form, objective: obj.id })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all
                    ${form.objective === obj.id ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}>
                  <span>{obj.icon}</span> {obj.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Special instructions</label>
            <textarea
              value={form.special_instructions}
              onChange={e => setForm({ ...form, special_instructions: e.target.value })}
              placeholder="Any specific requirements, tone, messages to include or avoid..."
              className="textarea h-16"
            />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button
              onClick={() => { if (!form.name || !form.product_service) return toast.error('Fill required fields'); setStep(2); }}
              className="btn btn-primary"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Audience & Platforms */}
      {step === 2 && (
        <div className="card space-y-5">
          <div>
            <label className="label">Target audience</label>
            <textarea
              value={form.target_audience}
              onChange={e => setForm({ ...form, target_audience: e.target.value })}
              placeholder="e.g., Families and retailers in Tanzania, age 25-45, interested in home products..."
              className="textarea h-16"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Country</label>
              <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Language</label>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="select">
                <option value="en">🇬🇧 English</option>
                <option value="sw">🇹🇿 Swahili</option>
                <option value="fr">🇫🇷 French</option>
                <option value="es">🇪🇸 Spanish</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Target platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const sel = form.platforms.includes(p.id);
                return (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${sel ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400'}`}>
                    <span>{p.icon}</span> {p.label}
                    {sel && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          </div>

          {['video_ad', 'business'].includes(form.category) && (
            <div>
              <label className="label">Ad duration: {form.ad_duration} seconds</label>
              <div className="flex gap-2">
                {[15, 30, 60].map(d => (
                  <button key={d} onClick={() => setForm({ ...form, ad_duration: d })}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                      ${form.ad_duration === d ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400'}`}>
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isLoading}
              className={`btn btn-primary btn-lg ${createMut.isLoading ? 'btn-disabled' : ''}`}
            >
              {createMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROJECT WORKSPACE ────────────────────────────────────────
function ProjectWorkspace({ projectId, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [producing, setProducing] = useState(false);
  const [productionComplete, setProductionComplete] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery(['creativeProject', projectId], async () => {
    const { data } = await api.get(`/creative/projects/${projectId}`);
    return data;
  }, { refetchInterval: producing ? 3000 : false });

  const briefMut = useMutation(
    () => api.post(`/creative/projects/${projectId}/generate-brief`),
    {
      onSuccess: () => { toast.success('Brief generated!'); refetch(); setActiveTab('brief'); },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate brief')
    }
  );

  const approveBriefMut = useMutation(
    () => api.post(`/creative/projects/${projectId}/approve-brief`),
    {
      onSuccess: () => { toast.success('Brief approved!'); refetch(); },
      onError: () => toast.error('Failed to approve brief')
    }
  );

  const produceMut = useMutation(
    () => api.post(`/creative/projects/${projectId}/produce`),
    {
      onSuccess: () => {
        toast.success('🎬 Production started! This takes 2-5 minutes.');
        setProducing(true);
        setActiveTab('progress');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to start production')
    }
  );

  const generateTextMut = useMutation(
    () => api.post(`/creative/projects/${projectId}/generate-text`),
    {
      onSuccess: () => { toast.success('Text generated!'); refetch(); setActiveTab('assets'); },
      onError: () => toast.error('Failed to generate text')
    }
  );

  const generateImagesMut = useMutation(
    () => api.post(`/creative/projects/${projectId}/generate-images`),
    {
      onSuccess: () => { toast.success('Images generated!'); refetch(); setActiveTab('assets'); },
      onError: () => toast.error('Failed to generate images')
    }
  );

  const regenerateMut = useMutation(
    ({ assetId, prompt }) => api.post(`/creative/assets/${assetId}/regenerate`, { prompt }),
    {
      onSuccess: () => { toast.success('Regenerated!'); refetch(); },
      onError: () => toast.error('Failed to regenerate')
    }
  );

  const project = data?.project;
  const brief = data?.brief;
  const assets = data?.assets || [];
  const versions = data?.versions || [];

  const imageAssets = assets.filter(a => a.asset_type === 'image');
  const textAssets = assets.filter(a => a.asset_type === 'text');
  const videoAssets = assets.filter(a => a.asset_type === 'video_scene');
  const voiceAssets = assets.filter(a => a.asset_type === 'voiceover');
  const isReady = project?.status === 'ready';

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-accent-primary" /></div>;

  const TABS = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'brief', label: 'Creative Brief', count: brief ? 1 : 0 },
    { id: 'assets', label: 'Assets', count: assets.length },
    { id: 'versions', label: 'Platform Versions', count: versions.length },
    { id: 'progress', label: 'Production', count: null }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-2 text-gray-500 hover:text-white hover:bg-dark-hover rounded-xl transition-colors mt-0.5">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{project?.name}</h2>
              <span className={`badge ${project?.status === 'ready' ? 'badge-success' : project?.status === 'generating' ? 'badge-warning' : 'badge-gray'}`}>
                {project?.status === 'ready' ? <><CheckCircle2 size={11} /> Ready</> :
                 project?.status === 'generating' ? <><Loader2 size={11} className="animate-spin" /> Generating</> :
                 project?.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 capitalize">{project?.category?.replace('_', ' ')} · {project?.platforms?.join(', ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!brief && (
            <button
              onClick={() => briefMut.mutate()}
              disabled={briefMut.isLoading}
              className={`btn btn-secondary ${briefMut.isLoading ? 'btn-disabled' : ''}`}
            >
              {briefMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate Brief
            </button>
          )}
          {brief?.approved && !producing && !isReady && (
            <button
              onClick={() => produceMut.mutate()}
              disabled={produceMut.isLoading}
              className={`btn btn-primary btn-lg ${produceMut.isLoading ? 'btn-disabled' : ''}`}
            >
              {produceMut.isLoading ? <><Loader2 size={18} className="animate-spin" /> Starting...</> : <><Zap size={18} /> One-Click Produce</>}
            </button>
          )}
          {isReady && (
            <div className="flex gap-2">
              <button
                onClick={() => generateImagesMut.mutate()}
                disabled={generateImagesMut.isLoading}
                className="btn btn-secondary"
              >
                {generateImagesMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                Regen Images
              </button>
              <button className="btn btn-primary">
                <Send size={16} /> Schedule & Publish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-surface rounded-2xl border border-dark-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
              ${activeTab === tab.id ? 'bg-dark-card text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-accent-primary/20 text-accent-primary' : 'bg-dark-base text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Project info */}
          <div className="lg:col-span-2 card">
            <h3 className="font-bold text-white mb-4">Project Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Business', value: project?.business_name },
                { label: 'Product/Service', value: project?.product_service },
                { label: 'Objective', value: project?.objective },
                { label: 'Country', value: project?.country },
                { label: 'Language', value: project?.language === 'sw' ? 'Swahili' : project?.language === 'fr' ? 'French' : 'English' },
                { label: 'Duration', value: `${project?.ad_duration}s` }
              ].map(item => item.value && (
                <div key={item.label} className="p-3 rounded-xl bg-dark-surface border border-dark-border">
                  <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-semibold text-white capitalize">{item.value}</p>
                </div>
              ))}
            </div>
            {project?.description && (
              <div className="mt-3 p-3 rounded-xl bg-dark-surface border border-dark-border">
                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Description</p>
                <p className="text-sm text-gray-300">{project.description}</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="font-bold text-white mb-4">Production Steps</h3>
            <div className="space-y-2">
              {[
                { step: 1, label: 'Creative Brief', done: !!brief, action: briefMut, actionLabel: 'Generate Brief' },
                { step: 2, label: 'Approve Brief', done: brief?.approved, disabled: !brief },
                { step: 3, label: 'Full Production', done: isReady, action: produceMut, actionLabel: 'One-Click Produce', disabled: !brief?.approved }
              ].map(item => (
                <div key={item.step} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  item.done ? 'border-emerald-500/30 bg-emerald-500/5' :
                  item.disabled ? 'border-dark-border opacity-50' : 'border-dark-border'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    item.done ? 'bg-emerald-500 text-white' : 'bg-dark-surface border border-dark-border text-gray-400'
                  }`}>
                    {item.done ? <Check size={14} /> : item.step}
                  </div>
                  <p className={`text-sm font-semibold ${item.done ? 'text-emerald-400' : 'text-white'}`}>{item.label}</p>
                  {item.action && !item.done && !item.disabled && (
                    <button
                      onClick={() => item.action.mutate()}
                      disabled={item.action.isLoading}
                      className="ml-auto btn btn-primary btn-sm"
                    >
                      {item.action.isLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 font-semibold">Or generate individually:</p>
              <button onClick={() => generateTextMut.mutate()} disabled={generateTextMut.isLoading || !brief} className={`btn btn-secondary btn-sm w-full ${!brief ? 'opacity-50' : ''}`}>
                {generateTextMut.isLoading ? <Loader2 size={13} className="animate-spin" /> : <PenTool size={13} />} Generate Text Only
              </button>
              <button onClick={() => generateImagesMut.mutate()} disabled={generateImagesMut.isLoading || !brief} className={`btn btn-secondary btn-sm w-full ${!brief ? 'opacity-50' : ''}`}>
                {generateImagesMut.isLoading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />} Generate Images Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRIEF */}
      {activeTab === 'brief' && (
        brief ? (
          <BriefCard brief={brief} onApprove={() => approveBriefMut.mutate()} />
        ) : (
          <div className="card text-center py-12">
            <Sparkles size={36} className="mx-auto text-gray-700 mb-3" />
            <h3 className="font-bold text-white mb-2">No brief yet</h3>
            <p className="text-sm text-gray-500 mb-4">Generate an AI creative brief to plan your production</p>
            <button onClick={() => briefMut.mutate()} disabled={briefMut.isLoading} className="btn btn-primary">
              {briefMut.isLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Creative Brief</>}
            </button>
          </div>
        )
      )}

      {/* ASSETS */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {imageAssets.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><ImageIcon size={16} className="text-accent-primary" /> Images ({imageAssets.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageAssets.map(a => (
                  <AssetCard key={a.id} asset={a}
                    onRegenerate={() => regenerateMut.mutate({ assetId: a.id })}
                    onEdit={() => {}} />
                ))}
              </div>
            </div>
          )}
          {textAssets.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><PenTool size={16} className="text-accent-primary" /> Copy & Captions ({textAssets.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textAssets.map(a => (
                  <AssetCard key={a.id} asset={a}
                    onRegenerate={() => regenerateMut.mutate({ assetId: a.id })}
                    onEdit={() => {}} />
                ))}
              </div>
            </div>
          )}
          {videoAssets.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Film size={16} className="text-accent-primary" /> Video Scenes ({videoAssets.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoAssets.map(a => (
                  <AssetCard key={a.id} asset={a}
                    onRegenerate={() => regenerateMut.mutate({ assetId: a.id })}
                    onEdit={() => {}} />
                ))}
              </div>
            </div>
          )}
          {voiceAssets.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Mic size={16} className="text-accent-primary" /> Voiceover</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voiceAssets.map(a => (
                  <AssetCard key={a.id} asset={a}
                    onRegenerate={() => regenerateMut.mutate({ assetId: a.id })}
                    onEdit={() => {}} />
                ))}
              </div>
            </div>
          )}
          {assets.length === 0 && (
            <div className="card text-center py-12">
              <Sparkles size={36} className="mx-auto text-gray-700 mb-3" />
              <h3 className="font-bold text-white mb-2">No assets yet</h3>
              <p className="text-sm text-gray-500 mb-4">Generate a brief first, then approve it to start production</p>
            </div>
          )}
        </div>
      )}

      {/* PLATFORM VERSIONS */}
      {activeTab === 'versions' && (
        versions.length > 0 ? (
          <PlatformVersions versions={versions} project={project} />
        ) : (
          <div className="card text-center py-12">
            <Globe size={36} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">Platform versions are generated during full production</p>
          </div>
        )
      )}

      {/* PRODUCTION PROGRESS */}
      {activeTab === 'progress' && (
        <div className="card">
          <h3 className="font-bold text-white mb-5">Production Progress</h3>
          {(producing || project?.status === 'generating') ? (
            <ProductionProgress
              projectId={projectId}
              onComplete={() => { setProducing(false); setProductionComplete(true); refetch(); toast.success('🎉 Your advertisement is ready!'); setActiveTab('assets'); }}
            />
          ) : isReady ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-3" />
              <h3 className="font-bold text-white mb-1">Production Complete!</h3>
              <p className="text-sm text-gray-500 mb-4">Your advertisement is ready to review and publish</p>
              <button onClick={() => setActiveTab('assets')} className="btn btn-primary">
                <Eye size={16} /> View Assets
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Film size={36} className="mx-auto text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">No production running. Generate a brief and approve it, then click "One-Click Produce".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function CreativeStudio() {
  const [view, setView] = useState('list'); // list | new | workspace
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery('creativeProjects', async () => {
    const { data } = await api.get('/creative/projects');
    return data;
  });

  const deleteMut = useMutation(
    (id) => api.delete(`/creative/projects/${id}`),
    {
      onSuccess: () => { toast.success('Project deleted'); refetch(); }
    }
  );

  const projects = data?.projects || [];

  if (view === 'new') return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="p-2 text-gray-500 hover:text-white hover:bg-dark-hover rounded-xl transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles size={24} className="text-accent-primary" /> New Creative Project</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI creates complete professional advertisements</p>
        </div>
      </div>
      <NewProjectWizard onCreated={(project) => { setSelectedProjectId(project.id); setView('workspace'); refetch(); }} />
    </div>
  );

  if (view === 'workspace' && selectedProjectId) return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles size={24} className="text-accent-primary" /> Creative Studio</h1>
      </div>
      <ProjectWorkspace projectId={selectedProjectId} onBack={() => { setView('list'); setSelectedProjectId(null); refetch(); }} />
    </div>
  );

  // PROJECT LIST VIEW
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles size={24} className="text-accent-primary" /> Creative Studio
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered complete advertisement production</p>
        </div>
        <button onClick={() => setView('new')} className="btn btn-primary btn-lg">
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* ONE-CLICK HERO */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-accent-secondary p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full opacity-10">
          <div className="w-80 h-80 rounded-full bg-white absolute -top-20 -right-20" />
          <div className="w-48 h-48 rounded-full bg-white absolute bottom-10 right-20" />
        </div>
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={20} className="text-white" />
            <span className="text-sm font-semibold text-white/80">AI Advertisement Generator</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-3">One click → Complete Professional Ad</h2>
          <p className="text-white/80 text-sm mb-5">Enter your product details → AI creates the full campaign: strategy, captions, images, video scenes, voiceover, and platform-specific versions. All ready to review and publish.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {['Marketing Strategy', 'Ad Script & Captions', 'Promotional Images', 'Video Scenes', 'Voiceover', 'Platform Versions'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs bg-white/15 px-3 py-1.5 rounded-xl text-white">
                <Check size={11} /> {item}
              </span>
            ))}
          </div>
          <button onClick={() => setView('new')} className="btn bg-white text-violet-700 hover:bg-white/90 font-bold btn-lg shadow-xl">
            <Sparkles size={18} /> Create New Advertisement
          </button>
        </div>
      </div>

      {/* PROJECTS GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      ) : projects.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Your Projects ({projects.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className={`stat-card group cursor-pointer hover:border-accent-primary/50 transition-all animate-fade-in-up stagger-${Math.min(i+1,4)}`}
                onClick={() => { setSelectedProjectId(project.id); setView('workspace'); }}
              >
                {/* Thumbnail / Category icon */}
                <div className="w-full h-32 rounded-xl bg-dark-surface border border-dark-border mb-3 overflow-hidden flex items-center justify-center relative">
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{CATEGORIES.find(c => c.id === project.category)?.icon || '✨'}</span>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-bold ${
                    project.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                    project.status === 'generating' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-dark-card text-gray-400'
                  }`}>
                    {project.status === 'generating' && <Loader2 size={9} className="animate-spin inline mr-1" />}
                    {project.status}
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{project.name}</h3>
                <p className="text-xs text-gray-500 mb-3 capitalize">{project.category?.replace('_', ' ')} · {project.platforms?.slice(0, 3).join(', ')}</p>

                {project.status === 'generating' && (
                  <div className="h-1.5 bg-dark-base rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-accent-primary to-emerald-500 rounded-full transition-all"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedProjectId(project.id); setView('workspace'); }}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <Eye size={13} /> Open
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteMut.mutate(project.id); }}
                    className="btn btn-secondary btn-sm px-2.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Sparkles size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="font-bold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Create your first AI-powered advertisement in minutes</p>
          <button onClick={() => setView('new')} className="btn btn-primary">
            <Plus size={16} /> Create First Project
          </button>
        </div>
      )}
    </div>
  );
}
