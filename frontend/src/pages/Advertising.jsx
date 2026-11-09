/**
 * Advertising Overview Page
 * Main dashboard for advertising campaigns, budgets, and performance
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus as PlusIcon,
  BarChart3 as ChartBarIcon,
  DollarSign as CurrencyDollarIcon,
  Eye as EyeIcon,
  MousePointerClick as CursorArrowRaysIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as ArrowTrendingUpIcon,
  AlertTriangle as ExclamationTriangleIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Button } from '../components/Button';
import { CardSkeleton as LoadingSkeleton } from '../components/LoadingSkeleton';
import api from '../lib/api';

const PLATFORM_COLORS = {
  meta_ads: '#1877f2',
  tiktok_ads: '#fe2c55',
  google_ads: '#4285f4',
  linkedin_ads: '#0a66c2',
};

const Advertising = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [platformBreakdown, setPlatformBreakdown] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(null);

  useEffect(() => {
    loadAdvertisingData();
  }, []);

  const loadAdvertisingData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

      const [overviewRes, campaignRes, breakdownRes, alertsRes, budgetRes] = await Promise.all([
        api.get('/advertising/overview'),
        api.get('/advertising/campaigns'),
        api.get('/advertising/platform-breakdown'),
        api.get('/advertising/budget-alerts?unreadOnly=true'),
        api.get(`/advertising/budget/${currentMonth}`)
      ]);

      setOverview(overviewRes.data.stats);
      setCampaigns(campaignRes.data.campaigns);
      setPlatformBreakdown(breakdownRes.data.breakdown);
      setBudgetAlerts(alertsRes.data.alerts);
      setMonthlyBudget(budgetRes.data.budget);
    } catch (error) {
      console.error('Failed to load advertising data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    navigate('/advertising/create');
  };

  const handleCampaignClick = (campaignId) => {
    navigate(`/advertising/campaigns/${campaignId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getPlatformIcon = (platform) => {
    const platformName = platform.replace('_ads', '');
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center text-sm font-medium">
        {platformName.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  const budgetUsed = monthlyBudget ? (monthlyBudget.spent_amount / monthlyBudget.total_budget) * 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Advertising</h1>
          <p className="text-gray-400">Manage campaigns, budgets, and ad performance</p>
        </div>
        <Button onClick={handleCreateCampaign} icon={PlusIcon}>
          Create Campaign
        </Button>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-400 font-medium mb-2">Budget Alerts</h3>
              <div className="space-y-2">
                {budgetAlerts.map((alert) => (
                  <p key={alert.id} className="text-sm text-gray-300">
                    {alert.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-accent-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {overview?.active_campaigns || 0}
          </p>
          <p className="text-sm text-gray-400">Active Campaigns</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            ${parseFloat(overview?.total_spent || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Total Spent</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <EyeIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {(overview?.total_impressions || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">Impressions</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <ShoppingCartIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {overview?.total_conversions || 0}
          </p>
          <p className="text-sm text-gray-400">Conversions</p>
        </div>
      </div>

      {/* Monthly Budget */}
      {monthlyBudget && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Monthly Budget</h2>
            <button
              onClick={() => navigate('/advertising/budget')}
              className="text-sm text-accent-primary hover:text-accent-primary/80"
            >
              Manage Budget
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  ${parseFloat(monthlyBudget.spent_amount).toFixed(2)} spent of ${parseFloat(monthlyBudget.total_budget).toFixed(2)}
                </span>
                <span className={`text-sm font-semibold ${budgetUsed >= 90 ? 'text-red-400' : budgetUsed >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {budgetUsed.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-dark-bg rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full transition-all rounded-full ${
                    budgetUsed >= 90 ? 'bg-red-500' : budgetUsed >= 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-accent-primary to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>

              {/* Budget summary */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-3 rounded-xl bg-dark-surface">
                  <p className="text-xs text-gray-500 mb-1">Remaining</p>
                  <p className="text-lg font-bold text-white">
                    ${(parseFloat(monthlyBudget.total_budget) - parseFloat(monthlyBudget.spent_amount)).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-dark-surface">
                  <p className="text-xs text-gray-500 mb-1">Daily Average</p>
                  <p className="text-lg font-bold text-white">
                    ${(parseFloat(monthlyBudget.spent_amount) / (new Date().getDate())).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Spend projection area chart */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Daily Spend Projection</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={Array.from({ length: new Date().getDate() }, (_, i) => ({
                    day: i + 1,
                    spent: parseFloat(((parseFloat(monthlyBudget.spent_amount) / new Date().getDate()) * (i + 1)).toFixed(2)),
                    budget: parseFloat((parseFloat(monthlyBudget.total_budget) / 30 * (i + 1)).toFixed(2)),
                  }))}
                >
                  <defs>
                    <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Day', position: 'insideBottomRight', fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} formatter={v => [`$${v}`, '']} />
                  <Area type="monotone" dataKey="budget" stroke="#6366f1" strokeDasharray="4 2" fill="none" strokeWidth={1.5} dot={false} name="Budget" />
                  <Area type="monotone" dataKey="spent" stroke="#14b8a6" fill="url(#spentGrad)" strokeWidth={2} dot={false} name="Spent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-6">Platform Breakdown</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart — spend share */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Spend by Platform</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={platformBreakdown.map(p => ({
                      name: p.platform.replace('_ads','').replace('_',' '),
                      value: parseFloat(p.spent) || 0,
                    }))}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                  >
                    {platformBreakdown.map((p, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[p.platform] || '#14b8a6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                    formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Spent']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart — CTR per platform */}
            <div>
              <p className="text-sm text-gray-400 mb-3">CTR by Platform (%)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={platformBreakdown.map(p => ({
                    name: p.platform.replace('_ads','').replace('_',' '),
                    ctr: parseFloat((p.ctr * 100) || 0).toFixed(2),
                    impressions: parseInt(p.impressions) || 0,
                  }))}
                  barSize={36}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                    formatter={(v, name) => name === 'ctr' ? [`${v}%`, 'CTR'] : [v.toLocaleString(), 'Impressions']}
                  />
                  <Bar dataKey="ctr" radius={[4,4,0,0]}>
                    {platformBreakdown.map((p, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[p.platform] || '#14b8a6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table rows below charts */}
          <div className="mt-4 space-y-3 border-t border-dark-border pt-4">
            {platformBreakdown.map((platform) => (
              <div key={platform.platform} className="flex items-center gap-4">
                {getPlatformIcon(platform.platform)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white capitalize">
                      {platform.platform.replace('_ads', '').replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-400">
                      ${parseFloat(platform.spent).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{platform.campaign_count} campaigns</span>
                    <span>•</span>
                    <span>{parseInt(platform.impressions).toLocaleString()} impressions</span>
                    <span>•</span>
                    <span>{parseFloat(platform.ctr * 100).toFixed(2)}% CTR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white">Campaigns</h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-dark-bg rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No campaigns yet</h3>
            <p className="text-gray-400 mb-6">Create your first advertising campaign to get started</p>
            <Button onClick={handleCreateCampaign} icon={PlusIcon}>
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg/50">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Campaign</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Platform</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Budget</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Spent</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => handleCampaignClick(campaign.id)}
                    className="hover:bg-dark-hover cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-white">{campaign.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{campaign.objective}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(campaign.platform)}
                        <span className="text-sm text-gray-300 capitalize">
                          {campaign.platform.replace('_ads', '')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-300">
                        ${parseFloat(campaign.budget_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-300">
                        ${parseFloat(campaign.spent_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {(campaign.impressions || 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <CursorArrowRaysIcon className="w-4 h-4" />
                          {campaign.clicks || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                          {parseFloat(campaign.ctr * 100 || 0).toFixed(2)}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Advertising;
