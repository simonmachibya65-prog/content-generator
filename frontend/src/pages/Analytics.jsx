/**
 * Enhanced Analytics Dashboard
 * Comprehensive analytics with charts, platform breakdowns, and insights
 */

import { useState, useEffect } from 'react';
import {
  Eye as EyeIcon,
  Heart as HeartIcon,
  MessageCircle as ChatBubbleLeftIcon,
  Share2 as ShareIcon,
  TrendingUp as ArrowTrendingUpIcon,
  TrendingDown as ArrowTrendingDownIcon,
  BarChart3 as ChartBarIcon,
  Clock as ClockIcon,
  Hash as HashtagIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CardSkeleton as LoadingSkeleton } from '../components/LoadingSkeleton';
import GaugeChart from '../components/GaugeChart';
import api from '../lib/api';

const COLORS = ['#00d4aa', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

const PLATFORMS = {
  tiktok: { name: 'TikTok', color: '#000000' },
  youtube: { name: 'YouTube', color: '#FF0000' },
  instagram: { name: 'Instagram', color: '#E1306C' },
  facebook: { name: 'Facebook', color: '#1877F2' },
  x: { name: 'X', color: '#000000' },
  linkedin: { name: 'LinkedIn', color: '#0A66C2' }
};

const AnalyticsEnhanced = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [bestTimes, setBestTimes] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = `?days=${dateRange}`;

      const [
        overviewRes,
        trendsRes,
        platformsRes,
        topPostsRes,
        contentTypesRes,
        hashtagsRes,
        bestTimesRes,
        comparisonRes
      ] = await Promise.all([
        api.get(`/analytics/overview${params}`),
        api.get(`/analytics/engagement-trends${params}`),
        api.get('/analytics/platforms'),
        api.get(`/analytics/top-posts${params}&limit=5`),
        api.get(`/analytics/content-types${params}`),
        api.get(`/analytics/hashtags${params}`),
        api.get(`/analytics/best-times${params}`),
        api.get(`/analytics/comparison${params}`)
      ]);

      setOverview(overviewRes.data);
      setTrends(trendsRes.data.trends);
      setPlatforms(platformsRes.data.platforms);
      setTopPosts(topPostsRes.data.posts);
      setContentTypes(contentTypesRes.data.contentTypes);
      setHashtags(hashtagsRes.data.hashtags);
      setBestTimes(bestTimesRes.data.times);
      setComparison(comparisonRes.data.comparison);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const calculateEngagementRate = (data) => {
    if (!data) return 0;
    const totalEngagements = (data.total_likes || 0) + (data.total_comments || 0) + (data.total_shares || 0);
    const totalViews = data.total_views || 1;
    return ((totalEngagements / totalViews) * 100).toFixed(2);
  };

  const calculateReachRate = (data) => {
    if (!data) return 0;
    // Mock calculation - in real app, would compare unique viewers to follower count
    const reach = Math.min(((data.total_views || 0) / Math.max(data.total_views * 1.5, 1000)) * 100, 95);
    return parseFloat(reach.toFixed(1));
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getDayName = (dayNum) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum] || dayNum;
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Views',
      value: formatNumber(overview?.total_views),
      change: comparison?.changes.views,
      icon: EyeIcon,
      color: 'bg-blue-500/10 text-blue-400'
    },
    {
      label: 'Total Likes',
      value: formatNumber(overview?.total_likes),
      change: comparison?.changes.likes,
      icon: HeartIcon,
      color: 'bg-pink-500/10 text-pink-400'
    },
    {
      label: 'Comments',
      value: formatNumber(overview?.total_comments),
      change: null,
      icon: ChatBubbleLeftIcon,
      color: 'bg-green-500/10 text-green-400'
    },
    {
      label: 'Shares',
      value: formatNumber(overview?.total_shares),
      change: null,
      icon: ShareIcon,
      color: 'bg-purple-500/10 text-purple-400'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Track your content performance and audience growth</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-lg p-1">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === days
                  ? 'bg-accent-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {metric.change !== null && metric.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(metric.change)}`}>
                    {metric.change > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(metric.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-4 border-b border-dark-border">
          {['overview', 'platforms', 'content', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-white border-b-2 border-accent-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <GaugeChart
                value={parseFloat(calculateEngagementRate(overview))}
                max={10}
                label="Engagement Rate"
                color="#00d4aa"
                size={180}
              />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <GaugeChart
                value={overview?.total_views || 0}
                max={Math.max((overview?.total_views || 0) * 1.5, 100000)}
                label="Total Impressions"
                color="#6366f1"
                size={180}
                showPercentage={false}
              />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <GaugeChart
                value={calculateReachRate(overview)}
                max={100}
                label="Reach Rate"
                color="#ec4899"
                size={180}
              />
            </div>
          </div>

          {/* Engagement Trends Chart */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Engagement Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252b3f',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#00d4aa" strokeWidth={2} name="Views" />
                <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} name="Likes" />
                <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} name="Comments" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Posts */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Top Performing Posts</h2>
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-accent-primary">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-medium line-clamp-2">{post.content_text}</p>
                        <p className="text-sm text-gray-400 mt-1 capitalize">{post.platform_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        {formatNumber(post.views)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HeartIcon className="w-4 h-4" />
                        {formatNumber(post.likes)}
                      </div>
                      <div className="flex items-center gap-1">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        {formatNumber(post.comments)}
                      </div>
                      <div className="flex items-center gap-1">
                        <ShareIcon className="w-4 h-4" />
                        {formatNumber(post.shares)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'platforms' && (
        <div className="space-y-6">
          {/* Platform Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Platform Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platforms.map((p, i) => ({
                      name: p.platform_name,
                      value: parseInt(p.total_views)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platforms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#252b3f',
                      border: '1px solid #2d3748',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Engagement by Platform</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platforms}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="platform_name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#252b3f',
                      border: '1px solid #2d3748',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avg_engagement_rate" fill="#00d4aa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Details Table */}
          <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-dark-border">
              <h2 className="text-lg font-semibold text-white">Platform Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Platform</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Posts</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Views</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Likes</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {platforms.map((platform) => (
                    <tr key={platform.platform_name} className="hover:bg-dark-hover transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-medium text-white capitalize">{platform.platform_name}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{platform.post_count}</td>
                      <td className="py-4 px-6 text-gray-300">{formatNumber(platform.total_views)}</td>
                      <td className="py-4 px-6 text-gray-300">{formatNumber(platform.total_likes)}</td>
                      <td className="py-4 px-6 text-gray-300">{parseFloat(platform.avg_engagement_rate || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Content Type Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Content Type Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contentTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="content_type" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#252b3f',
                      border: '1px solid #2d3748',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avg_views" fill="#00d4aa" name="Avg Views" />
                  <Bar dataKey="avg_likes" fill="#ec4899" name="Avg Likes" />
                  <Bar dataKey="avg_comments" fill="#10b981" name="Avg Comments" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Chart - Content Distribution */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Content Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contentTypes.map(ct => ({ name: ct.content_type, value: ct.post_count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {contentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#252b3f',
                      border: '1px solid #2d3748',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Hashtags */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <HashtagIcon className="w-5 h-5 text-accent-primary" />
              Top Performing Hashtags
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hashtags.slice(0, 10).map((hashtag) => (
                <div
                  key={hashtag.hashtag}
                  className="flex items-center justify-between p-4 bg-dark-bg rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white">#{hashtag.hashtag}</p>
                    <p className="text-sm text-gray-400">{hashtag.usage_count} posts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent-primary">
                      {parseFloat(hashtag.avg_engagement_rate || 0).toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Best Times to Post */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-accent-primary" />
              Best Times to Post
            </h2>
            <div className="space-y-4">
              {bestTimes.slice(0, 5).map((time, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                  <div>
                    <p className="font-medium text-white capitalize">{time.platform_name}</p>
                    <p className="text-sm text-gray-400">
                      {getDayName(time.day_of_week)} at {time.hour}:00
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent-primary">
                      {parseFloat(time.avg_engagement_rate || 0).toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">avg engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Comparison */}
          {comparison && (
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">
                Performance vs Previous Period
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Views</p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {formatNumber(comparison.current.views)}
                  </p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(comparison.changes.views)}`}>
                    {comparison.changes.views > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(comparison.changes.views).toFixed(1)}% from previous period
                  </div>
                </div>

                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Likes</p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {formatNumber(comparison.current.likes)}
                  </p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(comparison.changes.likes)}`}>
                    {comparison.changes.likes > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(comparison.changes.likes).toFixed(1)}% from previous period
                  </div>
                </div>

                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Engagement Rate</p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {comparison.current.engagement.toFixed(2)}%
                  </p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(comparison.changes.engagement)}`}>
                    {comparison.changes.engagement > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(comparison.changes.engagement).toFixed(1)}% from previous period
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsEnhanced;
