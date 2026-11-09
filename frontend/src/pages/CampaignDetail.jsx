/**
 * Campaign Detail Page
 * View and manage campaign, ad sets, and advertisements
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  Plus as PlusIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
  Trash2 as TrashIcon,
  BarChart3 as ChartBarIcon,
  Eye as EyeIcon,
  MousePointerClick as CursorArrowRaysIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '../components/Button';
import { CardSkeleton as LoadingSkeleton } from '../components/LoadingSkeleton';
import { Modal } from '../components/Modal';
import GaugeChart from '../components/GaugeChart';
import api from '../lib/api';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [adSets, setAdSets] = useState([]);
  const [selectedAdSet, setSelectedAdSet] = useState(null);
  const [ads, setAds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Generate mock performance data for chart
  const generateMockPerformanceData = () => {
    const days = 14;
    const data = [];
    const baseImpressions = campaign?.impressions || 10000;
    const baseClicks = (campaign?.clicks || baseImpressions * 0.02);
    const baseConversions = campaign?.conversions || 50;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: Math.floor(baseImpressions / days * (0.8 + Math.random() * 0.4)),
        clicks: Math.floor(baseClicks / days * (0.8 + Math.random() * 0.4)),
        conversions: Math.floor(baseConversions / days * (0.8 + Math.random() * 0.4))
      });
    }
    
    return data;
  };

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  useEffect(() => {
    if (selectedAdSet) {
      loadAds(selectedAdSet.id);
    }
  }, [selectedAdSet]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const [campaignRes, adSetsRes] = await Promise.all([
        api.get(`/advertising/campaigns/${id}`),
        api.get(`/advertising/campaigns/${id}/ad-sets`)
      ]);

      setCampaign(campaignRes.data.campaign);
      setAdSets(adSetsRes.data.adSets);
      
      if (adSetsRes.data.adSets.length > 0) {
        setSelectedAdSet(adSetsRes.data.adSets[0]);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAds = async (adSetId) => {
    try {
      const response = await api.get(`/advertising/ad-sets/${adSetId}/ads`);
      setAds(response.data.ads);
    } catch (error) {
      console.error('Failed to load ads:', error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      const response = await api.put(`/advertising/campaigns/${id}`, { status: newStatus });
      setCampaign(response.data.campaign);
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      await api.delete(`/advertising/campaigns/${id}`);
      navigate('/advertising');
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/advertising')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Advertising
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-md border ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-gray-400 capitalize">{campaign.objective} • {campaign.platform.replace('_ads', '')}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={campaign.status === 'active' ? PauseIcon : PlayIcon}
              onClick={handleToggleStatus}
            >
              {campaign.status === 'active' ? 'Pause' : 'Activate'}
            </Button>
            <Button
              variant="danger"
              icon={TrashIcon}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-1">Budget</p>
          <p className="text-2xl font-bold text-white">
            ${parseFloat(campaign.budget_amount || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 capitalize">{campaign.budget_type}</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-1">Spent</p>
          <p className="text-2xl font-bold text-white">
            ${parseFloat(campaign.spent_amount || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {((campaign.spent_amount / campaign.budget_amount) * 100).toFixed(1)}% of budget
          </p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-1">Impressions</p>
          <p className="text-2xl font-bold text-white">
            {(campaign.impressions || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            CTR: {(parseFloat(campaign.ctr || 0) * 100).toFixed(2)}%
          </p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-1">Conversions</p>
          <p className="text-2xl font-bold text-white">
            {campaign.conversions || 0}
          </p>
          <p className="text-xs text-gray-500">
            CPA: ${parseFloat(campaign.cpa || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ROAS Gauge */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <GaugeChart
            value={parseFloat(campaign.roas || 0)}
            max={10}
            label="ROAS"
            color="#00d4aa"
            size={180}
            showPercentage={false}
          />
        </div>

        {/* CTR Gauge */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <GaugeChart
            value={parseFloat(campaign.ctr || 0) * 100}
            max={10}
            label="Click-Through Rate"
            color="#6366f1"
            size={180}
          />
        </div>

        {/* Budget Usage Gauge */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <GaugeChart
            value={(campaign.spent_amount / campaign.budget_amount) * 100}
            max={100}
            label="Budget Used"
            color="#ec4899"
            size={180}
          />
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6">Performance Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={generateMockPerformanceData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#252b3f',
                border: '1px solid #2d3748',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="impressions" 
              stroke="#00d4aa" 
              strokeWidth={2} 
              name="Impressions"
              dot={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="clicks" 
              stroke="#6366f1" 
              strokeWidth={2} 
              name="Clicks"
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="conversions" 
              stroke="#ec4899" 
              strokeWidth={2} 
              name="Conversions"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign Details */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Campaign Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Target Locations</p>
            <p className="text-white">
              {campaign.target_locations?.join(', ') || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Age Range</p>
            <p className="text-white">
              {campaign.target_age_min || 18} - {campaign.target_age_max || 65}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Start Date</p>
            <p className="text-white">
              {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">End Date</p>
            <p className="text-white">
              {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Ad Sets */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Ad Sets</h2>
          <Button size="sm" icon={PlusIcon}>
            Create Ad Set
          </Button>
        </div>

        {adSets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 mb-4">No ad sets yet</p>
            <Button size="sm" icon={PlusIcon}>
              Create Ad Set
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg/50">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Budget</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Ads</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {adSets.map((adSet) => (
                  <tr
                    key={adSet.id}
                    onClick={() => setSelectedAdSet(adSet)}
                    className={`cursor-pointer transition-colors ${
                      selectedAdSet?.id === adSet.id ? 'bg-accent-primary/10' : 'hover:bg-dark-hover'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <p className="font-medium text-white">{adSet.name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(adSet.status)}`}>
                        {adSet.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-300">
                        ${parseFloat(adSet.budget_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-300">{adSet.ads_count || 0} ads</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {(adSet.impressions || 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <CursorArrowRaysIcon className="w-4 h-4" />
                          {adSet.clicks || 0}
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

      {/* Advertisements */}
      {selectedAdSet && (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-dark-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Advertisements - {selectedAdSet.name}
            </h2>
            <Button size="sm" icon={PlusIcon}>
              Create Ad
            </Button>
          </div>

          {ads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-4">No ads yet</p>
              <Button size="sm" icon={PlusIcon}>
                Create Ad
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden hover:border-accent-primary/50 transition-colors"
                >
                  {ad.thumbnail_url && (
                    <img
                      src={ad.thumbnail_url}
                      alt={ad.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white">{ad.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(ad.status)}`}>
                        {ad.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{ad.headline}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <p className="text-gray-400">Impressions</p>
                        <p className="text-white font-medium">{(ad.impressions || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Clicks</p>
                        <p className="text-white font-medium">{ad.clicks || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Campaign"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this campaign? This will also delete all ad sets and advertisements associated with it.
          </p>
          <p className="text-sm text-gray-400">
            This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCampaign}
            >
              Delete Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignDetail;
