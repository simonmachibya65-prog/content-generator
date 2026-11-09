import { useState } from 'react';
import { useMutation } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  PenTool, Sparkles, Image as ImageIcon, FileText, Video, RefreshCw,
  Hash, Loader2, Copy, Check, Send, Calendar
} from 'lucide-react';

const PLATFORMS = [
  { id: 'tiktok',    name: 'TikTok',    icon: '🎵' },
  { id: 'youtube',   name: 'YouTube',   icon: '▶️' },
  { id: 'x',         name: 'X',         icon: '𝕏'  },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'facebook',  name: 'Facebook',  icon: '📘' },
  { id: 'linkedin',  name: 'LinkedIn',  icon: '💼' }
];

const TOOLS = [
  { id: 'text',      label: 'AI Text',       icon: PenTool,    desc: 'Captions & posts',     color: 'from-indigo-500 to-purple-600' },
  { id: 'image',     label: 'AI Image',      icon: ImageIcon,  desc: 'Generate visuals',     color: 'from-pink-500 to-rose-500' },
  { id: 'script',    label: 'Video Script',  icon: Video,      desc: 'For TikTok/YouTube',  color: 'from-orange-500 to-amber-500' },
  { id: 'hashtags',  label: 'Hashtags',      icon: Hash,       desc: 'Trending tags',         color: 'from-emerald-500 to-teal-500' }
];

const TONES = ['Professional', 'Casual', 'Funny', 'Educational', 'Inspirational', 'Promotional'];

export default function CreateContent() {
  const [activeTool, setActiveTool] = useState('text');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['tiktok', 'instagram']);
  const [form, setForm] = useState({ topic: '', tone: 'Professional', language: 'en' });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const generateMut = useMutation(async (payload) => {
    if (activeTool === 'text')     return (await api.post('/content/generate', payload)).data;
    if (activeTool === 'image')    return (await api.post('/content/generate-image', payload)).data;
    if (activeTool === 'script')   return (await api.post('/content/generate-script', payload)).data;
    if (activeTool === 'hashtags') return (await api.post('/content/generate-hashtags', payload)).data;
  }, {
    onSuccess: (data) => {
      setResult(data);
      toast.success('Content generated! ✨');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
  });

  const handleGenerate = () => {
    if (!form.topic) return toast.error('Please enter a topic');
    setResult(null);
    const payload = { ...form, platforms: selectedPlatforms };
    if (activeTool === 'image') payload.prompt = form.topic;
    if (activeTool === 'hashtags') { payload.platform = selectedPlatforms[0]; payload.count = 15; }
    generateMut.mutate(payload);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied!');
  };

  const togglePlatform = (id) => setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">

      {/* ── Header ─────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Create Content</h1>
        <p className="text-sm text-gray-500 mt-1">Generate AI-powered content for all your platforms</p>
      </div>

      {/* ── Tool selector ──────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(null); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative
                ${active ? 'border-accent-primary bg-accent-primary/10 scale-[1.02] shadow-glow-teal-sm' : 'border-dark-border hover:border-dark-border-light bg-dark-card'}`}
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="font-bold text-sm text-white">{tool.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tool.desc}</p>
              {active && <div className="absolute top-3 right-3 w-2 h-2 bg-accent-primary rounded-full animate-pulse" />}
            </button>
          );
        })}
      </div>

      {/* ── Main content area ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Input panel ────────────── */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-dark-border">
            <Sparkles size={18} className="text-accent-primary" />
            <h3 className="font-bold text-white">
              {activeTool === 'text' && 'Generate Text Content'}
              {activeTool === 'image' && 'Generate AI Image'}
              {activeTool === 'script' && 'Write Video Script'}
              {activeTool === 'hashtags' && 'Generate Hashtags'}
            </h3>
          </div>

          <div>
            <label className="label">
              {activeTool === 'image' ? 'Image description' : activeTool === 'hashtags' ? 'Topic for hashtags' : 'Topic / Description'}
            </label>
            <textarea
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder={activeTool === 'image' ? 'A modern tech workspace with blue lighting...' : 'e.g., 5 productivity tips for remote workers'}
              className="textarea h-24"
            />
          </div>

          {/* Platform selection (for text) */}
          {activeTool !== 'hashtags' && activeTool !== 'image' && (
            <div>
              <label className="label">Target platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => {
                  const sel = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-1.5
                        ${sel ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}
                    >
                      <span>{p.icon}</span> {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tone (for text and script) */}
          {(activeTool === 'text' || activeTool === 'script') && (
            <div>
              <label className="label">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tone: t })}
                    className={`px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all
                      ${form.tone === t ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Language */}
          <div>
            <label className="label">Language</label>
            <select
              value={form.language}
              onChange={e => setForm({ ...form, language: e.target.value })}
              className="select"
            >
              <option value="en">🇬🇧 English</option>
              <option value="sw">🇹🇿 Swahili</option>
              <option value="fr">🇫🇷 French</option>
              <option value="es">🇪🇸 Spanish</option>
            </select>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generateMut.isLoading || !form.topic}
            className={`btn btn-primary w-full btn-lg ${generateMut.isLoading || !form.topic ? 'btn-disabled' : ''}`}
          >
            {generateMut.isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={18} /> Generate with AI</>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Uses 1-3 AI credits depending on the tool
          </p>
        </div>

        {/* ── Result panel ────────────── */}
        <div className="card flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-dark-border">
            <h3 className="font-bold text-white">Result</h3>
            {result && (
              <span className="badge badge-success">
                <Check size={11} /> Generated
              </span>
            )}
          </div>

          <div className="flex-1 py-4">
            {generateMut.isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <Loader2 size={32} className="animate-spin text-accent-primary" />
                <p className="text-sm text-gray-500">AI is thinking...</p>
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            ) : result ? (
              <div className="space-y-3">
                {/* Text content result */}
                {result.content && Object.entries(result.content).map(([platform, content]) => (
                  <div key={platform} className="p-4 rounded-xl bg-dark-surface border border-dark-border group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge badge-primary capitalize">{PLATFORMS.find(p => p.id === platform)?.icon} {platform}</span>
                      <button onClick={() => copy(content, platform)} className="p-1.5 text-gray-500 hover:text-accent-primary rounded-lg hover:bg-dark-hover transition-colors">
                        {copied === platform ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">
                      {content.caption || content.text || content.message || content.title}
                    </p>
                    {content.hashtags && (
                      <p className="text-xs text-accent-primary mt-2">{content.hashtags.map(h => `#${h}`).join(' ')}</p>
                    )}
                  </div>
                ))}

                {/* Image result */}
                {result.image && (
                  <div className="space-y-3">
                    <img src={result.image.url} alt="Generated" className="w-full rounded-xl" />
                    {result.image.revised_prompt && (
                      <p className="text-xs text-gray-500 italic">{result.image.revised_prompt}</p>
                    )}
                  </div>
                )}

                {/* Script result */}
                {result.script && (
                  <div className="p-4 rounded-xl bg-dark-surface border border-dark-border space-y-3">
                    <div>
                      <p className="text-xs font-bold text-accent-primary mb-1">HOOK</p>
                      <p className="text-sm text-gray-200">{result.script.hook}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-accent-primary mb-1">FULL SCRIPT</p>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{result.script.full_script}</p>
                    </div>
                    {result.script.suggested_visuals && (
                      <div>
                        <p className="text-xs font-bold text-accent-primary mb-1">SUGGESTED VISUALS</p>
                        <ul className="text-sm text-gray-400 list-disc list-inside">{result.script.suggested_visuals.map((v,i) => <li key={i}>{v}</li>)}</ul>
                      </div>
                    )}
                    <button onClick={() => copy(result.script.full_script, 'script')} className="btn btn-secondary btn-sm w-full">
                      {copied === 'script' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Script</>}
                    </button>
                  </div>
                )}

                {/* Hashtags result */}
                {result.hashtags && (
                  <div className="p-4 rounded-xl bg-dark-surface border border-dark-border">
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag, i) => (
                        <span key={i} className="badge badge-primary text-sm py-1.5 px-3">#{tag}</span>
                      ))}
                    </div>
                    <button onClick={() => copy(result.hashtags.map(h => `#${h}`).join(' '), 'tags')} className="btn btn-secondary btn-sm w-full mt-3">
                      {copied === 'tags' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy All</>}
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button className="btn btn-secondary flex-1">
                    <FileText size={15} /> Save as Draft
                  </button>
                  <button className="btn btn-primary flex-1">
                    <Send size={15} /> Publish
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-2xl flex items-center justify-center mb-3">
                  <Sparkles size={28} className="text-gray-700" />
                </div>
                <p className="text-sm font-semibold text-gray-400">No content yet</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">Enter a topic and click "Generate with AI" to create content for your platforms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
