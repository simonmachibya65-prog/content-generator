import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Brain, Sparkles, TrendingUp, Lightbulb, Target, Zap, Users, Hash,
  ArrowRight, Loader2, RefreshCw, Check, MessageSquare, Send,
  User, Bot, Copy, Download, BarChart3, Clock, Eye, DollarSign,
  TrendingDown, Search, Globe, Award, AlertCircle, CheckCircle,
  Activity, BarChart, PieChart, Heart, Share2, Repeat
} from 'lucide-react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend,
  RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';

const CHART_COLORS = ['#14b8a6','#6366f1','#f59e0b','#ef4444','#10b981','#8b5cf6'];

// ─── Marketing Assistant Chat ────────────────────────────────
function MarketingAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Marketing Assistant. I can help you with marketing strategies, content ideas, audience insights, campaign recommendations, and more. What would you like to work on today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickActions = [
    'Generate a content strategy for this month',
    'What are the best hashtags for my niche?',
    'Analyze my posting frequency',
    'Create a product launch campaign'
  ];

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data } = await api.post('/business/ai-chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content }))
      });
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-accent-secondary' : 'bg-accent-primary/20'
            }`}>
              {msg.role === 'user' ? <User size={15} className="text-white" /> : <Bot size={15} className="text-accent-primary" />}
            </div>
            <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent-secondary text-white rounded-tr-none'
                : 'bg-dark-surface border border-dark-border text-gray-200 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/20 flex items-center justify-center">
              <Bot size={15} className="text-accent-primary" />
            </div>
            <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border rounded-tl-none">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="text-xs px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-gray-400 hover:text-white hover:border-accent-primary transition-all"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything about your marketing..."
          className="input flex-1"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className={`btn btn-primary ${loading || !input.trim() ? 'btn-disabled' : ''}`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Brand Intelligence ───────────────────────────────────────
function BrandIntelligenceView() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('brandIntelligence', async () => {
    const { data } = await api.get('/business/brand-intelligence');
    return data;
  });

  const generateMut = useMutation(
    () => api.post('/business/brand-intelligence'),
    {
      onSuccess: () => {
        toast.success('Brand intelligence regenerated!');
        queryClient.invalidateQueries('brandIntelligence');
      },
      onError: () => toast.error('Failed to generate. Check your business profile.')
    }
  );

  const intelligence = data?.intelligence;

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-accent-primary" />
    </div>
  );

  if (!intelligence) return (
    <div className="text-center py-12">
      <Brain size={48} className="mx-auto text-gray-700 mb-4" />
      <h3 className="font-bold text-white mb-2">No brand intelligence yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
        Complete your business profile first, then generate brand intelligence.
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/business-setup" className="btn btn-secondary">Complete Profile</Link>
        <button onClick={() => generateMut.mutate()} disabled={generateMut.isLoading} className="btn btn-primary">
          {generateMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
          Generate Intelligence
        </button>
      </div>
    </div>
  );

  const themes = Array.isArray(intelligence.content_themes) ? intelligence.content_themes : [];
  const personas = Array.isArray(intelligence.target_personas) ? intelligence.target_personas : [];
  const pillars = Array.isArray(intelligence.content_pillars) ? intelligence.content_pillars : [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => generateMut.mutate()} disabled={generateMut.isLoading} className="btn btn-secondary btn-sm">
          {generateMut.isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Regenerate
        </button>
      </div>

      <div className="card bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border-accent-primary/20">
        <h4 className="font-bold text-accent-primary text-sm mb-2">Brand Identity</h4>
        <p className="text-sm text-gray-300 leading-relaxed">{intelligence.brand_identity}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2"><Sparkles size={15} className="text-accent-primary" /> Content Themes</h4>
          <div className="space-y-2">
            {themes.slice(0, 5).map((theme, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-dark-surface">
                <div className="w-2 h-2 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{theme.theme || theme}</p>
                  {theme.description && <p className="text-xs text-gray-500">{theme.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2"><BarChart3 size={15} className="text-accent-primary" /> Content Pillars</h4>
          <div className="space-y-3">
            {pillars.map((pillar, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">{pillar.pillar || pillar}</span>
                  <span className="text-accent-primary">{pillar.percentage || 25}%</span>
                </div>
                <div className="h-1.5 bg-dark-base rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent-primary to-emerald-500 rounded-full" style={{ width: `${pillar.percentage || 25}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Competitor Analysis ──────────────────────────────────────
function CompetitorAnalysis() {
  const [competitorUrl, setCompetitorUrl] = useState('');
  
  const { data, isLoading } = useQuery('competitors', async () => {
    const { data } = await api.get('/analytics/competitors');
    return data;
  });

  const analyzeMut = useMutation(
    (url) => api.post('/analytics/competitors/analyze', { url }),
    {
      onSuccess: () => {
        toast.success('Competitor analyzed!');
        setCompetitorUrl('');
      },
      onError: () => toast.error('Failed to analyze competitor')
    }
  );

  const competitors = data?.competitors || [];

  return (
    <div className="space-y-5">
      <div className="card">
        <h4 className="font-bold text-white mb-3">Add Competitor</h4>
        <div className="flex gap-2">
          <input
            type="url"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="https://instagram.com/competitor"
            className="input flex-1"
          />
          <button
            onClick={() => analyzeMut.mutate(competitorUrl)}
            disabled={analyzeMut.isLoading || !competitorUrl}
            className="btn btn-primary"
          >
            {analyzeMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Analyze
          </button>
        </div>
      </div>

      {competitors.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-500">Add competitors to track and analyze their performance</p>
        </div>
      ) : (
        <>
          {/* Comparison bar chart */}
          <div className="card">
            <h4 className="font-bold text-white mb-4 text-sm">Engagement Rate Comparison</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ReBarChart data={competitors.map(c => ({ name: c.name, engagement: parseFloat(c.avg_engagement_rate) || 0, followers: c.followers || 0 }))} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} labelStyle={{ color: '#fff' }} formatter={(v) => [`${v}%`, 'Engagement']} />
                <Bar dataKey="engagement" radius={[4,4,0,0]}>
                  {competitors.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((comp) => (
              <div key={comp.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white">{comp.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{comp.platform}</p>
                  </div>
                  <span className={`badge ${comp.follower_growth > 0 ? 'badge-success' : 'badge-gray'}`}>
                    {comp.follower_growth > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(comp.follower_growth || 0)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{(comp.followers || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{comp.avg_engagement_rate || 0}%</p>
                    <p className="text-[10px] text-gray-500">Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{comp.posts_per_week || 0}</p>
                    <p className="text-[10px] text-gray-500">Posts/Week</p>
                  </div>
                </div>
                {comp.top_content_types && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Top Content Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {comp.top_content_types.map((type, i) => (
                        <span key={i} className="badge badge-primary text-[10px]">{type}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Trend Monitoring ─────────────────────────────────────────
function TrendMonitoring() {
  const [platform, setPlatform] = useState('all');

  const { data, isLoading } = useQuery(['trends', platform], async () => {
    const { data } = await api.get(`/analytics/trends?platform=${platform}`);
    return data;
  });

  const trends = data?.trends || [];

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {['all', 'instagram', 'tiktok', 'youtube', 'x'].map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`btn ${platform === p ? 'btn-primary' : 'btn-secondary'} capitalize`}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      ) : trends.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp size={48} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-500">No trending topics found</p>
        </div>
      ) : (
        <>
          {/* Volume overview bar chart */}
          <div className="card">
            <h4 className="font-bold text-white mb-4 text-sm">Trend Volume Overview</h4>
            <ResponsiveContainer width="100%" height={180}>
              <ReBarChart data={trends.map(t => ({ name: t.topic.slice(0, 18), volume: t.volume || 0 }))} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="volume" radius={[4,4,0,0]}>
                  {trends.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((trend, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{trend.topic}</h4>
                    <p className="text-xs text-gray-500 capitalize">{trend.platform}</p>
                  </div>
                  <span className={`badge ${
                    trend.trend_status === 'rising' ? 'badge-success' :
                    trend.trend_status === 'peak' ? 'badge-warning' : 'badge-gray'
                  }`}>
                    {trend.trend_status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {(trend.views || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity size={12} /> {trend.engagement_rate || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{trend.description}</p>
                <button className="btn btn-secondary btn-sm w-full">
                  <Sparkles size={13} /> Use This Trend
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Hashtag Research ─────────────────────────────────────────
function HashtagResearch() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState(null);

  const searchMut = useMutation(
    (kw) => api.post('/content/hashtag-research', { keyword: kw }),
    {
      onSuccess: ({ data }) => {
        setResults(data.hashtags);
        toast.success('Hashtags found!');
      },
      onError: () => toast.error('Failed to research hashtags')
    }
  );

  return (
    <div className="space-y-5">
      <div className="card">
        <h4 className="font-bold text-white mb-3">Research Hashtags</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMut.mutate(keyword)}
            placeholder="Enter keyword or niche..."
            className="input flex-1"
          />
          <button
            onClick={() => searchMut.mutate(keyword)}
            disabled={searchMut.isLoading || !keyword}
            className="btn btn-primary"
          >
            {searchMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Hash size={16} />}
            Research
          </button>
        </div>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white">Results for "{keyword}"</h4>
            <button
              onClick={() => {
                navigator.clipboard.writeText(results.map(h => `#${h.hashtag}`).join(' '));
                toast.success('Copied all hashtags!');
              }}
              className="btn btn-secondary btn-sm"
            >
              <Copy size={13} /> Copy All
            </button>
          </div>

          {/* Engagement chart for top hashtags */}
          <div className="card">
            <h5 className="text-sm font-bold text-white mb-3">Engagement Rate by Hashtag</h5>
            <ResponsiveContainer width="100%" height={160}>
              <ReBarChart data={results.slice(0, 8).map(t => ({ name: `#${t.hashtag.slice(0,10)}`, eng: parseFloat(t.avg_engagement) || 0 }))} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} labelStyle={{ color: '#fff' }} formatter={(v) => [`${v}%`, 'Engagement']} />
                <Bar dataKey="eng" radius={[4,4,0,0]} fill="#14b8a6" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {results.map((tag, i) => (
              <div key={i} className="card bg-dark-surface">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-accent-primary">#{tag.hashtag}</h5>
                  <span className={`badge ${
                    tag.difficulty === 'easy' ? 'badge-success' :
                    tag.difficulty === 'medium' ? 'badge-warning' : 'badge-gray'
                  }`}>
                    {tag.difficulty}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-gray-500">Posts</p>
                    <p className="text-sm font-semibold text-white">{(tag.post_count || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Reach</p>
                    <p className="text-sm font-semibold text-white">{(tag.avg_reach || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Engagement</p>
                    <p className="text-sm font-semibold text-white">{tag.avg_engagement || 0}%</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`#${tag.hashtag}`);
                    toast.success('Copied!');
                  }}
                  className="btn btn-secondary btn-sm w-full"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !searchMut.isLoading && (
        <div className="card text-center py-12">
          <Hash size={48} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-500">Enter a keyword to discover relevant hashtags</p>
        </div>
      )}
    </div>
  );
}

// ─── Caption Optimizer ────────────────────────────────────────
function CaptionOptimizer() {
  const [caption, setCaption] = useState('');
  const [optimization, setOptimization] = useState(null);

  const optimizeMut = useMutation(
    (text) => api.post('/content/optimize-caption', { caption: text }),
    {
      onSuccess: ({ data }) => {
        setOptimization(data);
        toast.success('Caption optimized!');
      },
      onError: () => toast.error('Failed to optimize')
    }
  );

  return (
    <div className="space-y-5">
      <div className="card">
        <h4 className="font-bold text-white mb-3">Optimize Your Caption</h4>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Paste your caption here..."
          className="textarea h-32 mb-3"
        />
        <button
          onClick={() => optimizeMut.mutate(caption)}
          disabled={optimizeMut.isLoading || !caption}
          className="btn btn-primary w-full"
        >
          {optimizeMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Optimize Caption
        </button>
      </div>

      {optimization && (
        <div className="space-y-4">
          <div className="card">
            <h4 className="font-bold text-white mb-3">Analysis</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-dark-surface rounded-xl">
                <p className="text-2xl font-bold text-white">{optimization.score}/100</p>
                <p className="text-xs text-gray-500">Overall Score</p>
              </div>
              <div className="text-center p-3 bg-dark-surface rounded-xl">
                <p className="text-2xl font-bold text-white">{optimization.readability}</p>
                <p className="text-xs text-gray-500">Readability</p>
              </div>
              <div className="text-center p-3 bg-dark-surface rounded-xl">
                <p className="text-2xl font-bold text-white">{optimization.word_count}</p>
                <p className="text-xs text-gray-500">Words</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-bold text-white">Suggestions:</h5>
              {optimization.suggestions.map((sug, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-dark-surface rounded-lg">
                  <AlertCircle size={14} className="text-accent-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{sug}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 className="font-bold text-white mb-3">Improved Version</h4>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{optimization.improved_caption}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(optimization.improved_caption);
                toast.success('Copied improved caption!');
              }}
              className="btn btn-primary w-full"
            >
              <Copy size={16} /> Copy Improved Caption
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Performance Predictor ────────────────────────────────────
function PerformancePredictor() {
  const [contentData, setContentData] = useState({
    platform: 'instagram',
    content_type: 'image',
    post_time: '09:00',
    has_hashtags: true,
    caption_length: 150
  });
  const [prediction, setPrediction] = useState(null);

  const predictMut = useMutation(
    (data) => api.post('/analytics/predict-performance', data),
    {
      onSuccess: ({ data }) => {
        setPrediction(data);
        toast.success('Prediction generated!');
      },
      onError: () => toast.error('Failed to predict')
    }
  );

  return (
    <div className="space-y-5">
      <div className="card">
        <h4 className="font-bold text-white mb-4">Predict Post Performance</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Platform</label>
            <select
              value={contentData.platform}
              onChange={(e) => setContentData({ ...contentData, platform: e.target.value })}
              className="select"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          
          <div>
            <label className="label">Content Type</label>
            <select
              value={contentData.content_type}
              onChange={(e) => setContentData({ ...contentData, content_type: e.target.value })}
              className="select"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="carousel">Carousel</option>
              <option value="reel">Reel/Short</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => predictMut.mutate(contentData)}
          disabled={predictMut.isLoading}
          className="btn btn-primary w-full"
        >
          {predictMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
          Predict Performance
        </button>
      </div>

      {prediction && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-r from-accent-primary/10 to-emerald-500/10 border-accent-primary/20">
            <h4 className="font-bold text-white mb-4">Prediction Results</h4>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-accent-primary/20 flex items-center justify-center">
                  <Eye size={24} className="text-accent-primary" />
                </div>
                <p className="text-2xl font-bold text-white">{prediction.estimated_reach.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Est. Reach</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Heart size={24} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">{prediction.estimated_engagement}%</p>
                <p className="text-xs text-gray-500">Est. Engagement</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Award size={24} className="text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{prediction.success_score}/10</p>
                <p className="text-xs text-gray-500">Success Score</p>
              </div>
            </div>

            {/* Score visual bar */}
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>Success Score</span>
              <span className="font-semibold text-white">{prediction.success_score}/10</span>
            </div>
            <div className="h-3 bg-dark-base rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-emerald-500 transition-all"
                style={{ width: `${(prediction.success_score / 10) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Low</span><span>Average</span><span>High</span>
            </div>

            {/* Reach vs engagement mini chart */}
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={120}>
                <ReBarChart
                  data={[
                    { label: 'Reach', value: prediction.estimated_reach },
                    { label: 'Likes', value: Math.round(prediction.estimated_reach * prediction.estimated_engagement / 100) },
                    { label: 'Comments', value: Math.round(prediction.estimated_reach * prediction.estimated_engagement / 300) },
                  ]}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {['#14b8a6','#10b981','#6366f1'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h5 className="font-bold text-white mb-3">Recommendations</h5>
            <div className="space-y-2">
              {prediction.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-dark-surface rounded-lg">
                  <CheckCircle size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROI Calculator ───────────────────────────────────────────
function ROICalculator() {
  const [inputs, setInputs] = useState({
    ad_spend: 1000,
    conversions: 50,
    avg_order_value: 100,
    production_cost: 200
  });

  const revenue = inputs.conversions * inputs.avg_order_value;
  const totalCost = inputs.ad_spend + inputs.production_cost;
  const profit = revenue - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) : 0;
  const roas = inputs.ad_spend > 0 ? (revenue / inputs.ad_spend).toFixed(2) : 0;

  return (
    <div className="space-y-5">
      <div className="card">
        <h4 className="font-bold text-white mb-4">Campaign ROI Calculator</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ad Spend ($)</label>
            <input
              type="number"
              value={inputs.ad_spend}
              onChange={(e) => setInputs({ ...inputs, ad_spend: parseFloat(e.target.value) || 0 })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Conversions</label>
            <input
              type="number"
              value={inputs.conversions}
              onChange={(e) => setInputs({ ...inputs, conversions: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Avg Order Value ($)</label>
            <input
              type="number"
              value={inputs.avg_order_value}
              onChange={(e) => setInputs({ ...inputs, avg_order_value: parseFloat(e.target.value) || 0 })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Production Cost ($)</label>
            <input
              type="number"
              value={inputs.production_cost}
              onChange={(e) => setInputs({ ...inputs, production_cost: parseFloat(e.target.value) || 0 })}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <DollarSign size={20} className="text-accent-primary mb-2" />
          <p className="text-2xl font-bold text-white">${revenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="stat-card">
          <DollarSign size={20} className="text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">${profit.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Profit</p>
        </div>
        <div className="stat-card">
          <BarChart size={20} className="text-blue-400 mb-2" />
          <p className={`text-2xl font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi}%</p>
          <p className="text-xs text-gray-500">ROI</p>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} className="text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{roas}x</p>
          <p className="text-xs text-gray-500">ROAS</p>
        </div>
      </div>

      {/* Cost breakdown donut + projection area chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h5 className="font-bold text-white mb-3 text-sm">Cost Breakdown</h5>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie
                data={[
                  { name: 'Ad Spend', value: inputs.ad_spend },
                  { name: 'Production', value: inputs.production_cost },
                ]}
                cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={4} dataKey="value"
              >
                <Cell fill="#14b8a6" />
                <Cell fill="#6366f1" />
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} formatter={(v) => [`$${v}`, '']} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h5 className="font-bold text-white mb-3 text-sm">Revenue vs Cost</h5>
          <ResponsiveContainer width="100%" height={200}>
            <ReBarChart
              data={[
                { label: 'Revenue', value: revenue, fill: '#10b981' },
                { label: 'Total Cost', value: totalCost, fill: '#ef4444' },
                { label: 'Profit', value: Math.max(0, profit), fill: '#14b8a6' },
              ]}
              barSize={48}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} formatter={v => [`$${v}`, '']} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {['#10b981','#ef4444','#14b8a6'].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <DollarSign size={20} className="text-accent-primary mb-2" />
          <p className="text-2xl font-bold text-white">${revenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="stat-card">
          <DollarSign size={20} className="text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">${profit.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Profit</p>
        </div>
        <div className="stat-card">
          <BarChart size={20} className="text-blue-400 mb-2" />
          <p className={`text-2xl font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi}%</p>
          <p className="text-xs text-gray-500">ROI</p>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} className="text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{roas}x</p>
          <p className="text-xs text-gray-500">ROAS</p>
        </div>
      </div>

      <div className="card">
        <h5 className="font-bold text-white mb-3">Analysis</h5>
        <div className="space-y-2">
          {roi > 100 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle size={16} className="text-emerald-400" />
              <p className="text-sm text-emerald-400">Excellent ROI! Your campaign is highly profitable.</p>
            </div>
          )}
          {roi >= 0 && roi <= 100 && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <AlertCircle size={16} className="text-blue-400" />
              <p className="text-sm text-blue-400">Positive ROI. Consider optimizing to increase returns.</p>
            </div>
          )}
          {roi < 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-sm text-red-400">Negative ROI. Review targeting, creative, and offer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AI Intelligence Page ────────────────────────────────
const TABS = [
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'brand', label: 'Brand Intelligence', icon: Brain },
  { id: 'competitors', label: 'Competitors', icon: Users },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'hashtags', label: 'Hashtags', icon: Hash },
  { id: 'caption', label: 'Caption Optimizer', icon: Sparkles },
  { id: 'predictor', label: 'Performance', icon: Activity },
  { id: 'roi', label: 'ROI Calculator', icon: DollarSign }
];

export default function AIIntelligence() {
  const [activeTab, setActiveTab] = useState('assistant');

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain size={24} className="text-accent-primary" /> AI Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your AI-powered marketing brain</p>
        </div>
        <Link to="/business-setup" className="btn btn-secondary">
          <Zap size={16} /> Update Business Profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 p-1 bg-dark-surface rounded-2xl border border-dark-border min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-dark-card text-white shadow-sm'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <Icon size={15} className={activeTab === tab.id ? 'text-accent-primary' : ''} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {activeTab === 'assistant' && <MarketingAssistant />}
        {activeTab === 'brand' && <BrandIntelligenceView />}
        {activeTab === 'competitors' && <CompetitorAnalysis />}
        {activeTab === 'trends' && <TrendMonitoring />}
        {activeTab === 'hashtags' && <HashtagResearch />}
        {activeTab === 'caption' && <CaptionOptimizer />}
        {activeTab === 'predictor' && <PerformancePredictor />}
        {activeTab === 'roi' && <ROICalculator />}
      </div>
    </div>
  );
}
