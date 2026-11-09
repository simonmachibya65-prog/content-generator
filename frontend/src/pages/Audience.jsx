import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Target, Filter, Download, RefreshCw, UserPlus, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CardSkeleton as LoadingSkeleton } from '../components/LoadingSkeleton';

export default function Audience() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [audienceData, setAudienceData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [showSegmentModal, setShowSegmentModal] = useState(false);

  useEffect(() => {
    fetchAudienceData();
  }, [selectedPlatform, dateRange]);

  const fetchAudienceData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAudienceData({
        totalFollowers: 125430,
        growthRate: 12.5,
        engagementRate: 4.8,
        demographics: {
          age: [
            { range: '18-24', percentage: 18 },
            { range: '25-34', percentage: 42 },
            { range: '35-44', percentage: 25 },
            { range: '45-54', percentage: 10 },
            { range: '55+', percentage: 5 }
          ],
          gender: [
            { type: 'Female', percentage: 58 },
            { type: 'Male', percentage: 40 },
            { type: 'Other', percentage: 2 }
          ],
          locations: [
            { country: 'United States', percentage: 45, followers: 56443 },
            { country: 'United Kingdom', percentage: 15, followers: 18814 },
            { country: 'Canada', percentage: 12, followers: 15051 },
            { country: 'Australia', percentage: 8, followers: 10034 },
            { country: 'Germany', percentage: 5, followers: 6271 }
          ]
        },
        segments: [
          {
            id: 1,
            name: 'High Engagers',
            description: 'Users who consistently interact with content',
            size: 12500,
            growthRate: 8.2,
            avgEngagement: 12.5,
            criteria: 'Engagement rate > 8%'
          },
          {
            id: 2,
            name: 'Recent Followers',
            description: 'Followers gained in last 30 days',
            size: 8340,
            growthRate: 100,
            avgEngagement: 3.2,
            criteria: 'Follow date < 30 days'
          },
          {
            id: 3,
            name: 'Video Enthusiasts',
            description: 'Users who primarily watch video content',
            size: 23100,
            growthRate: 15.3,
            avgEngagement: 6.8,
            criteria: 'Video views > 80% of interactions'
          },
          {
            id: 4,
            name: 'Product Interested',
            description: 'Users who engage with product-related posts',
            size: 15670,
            growthRate: 22.1,
            avgEngagement: 9.1,
            criteria: 'Product post engagement > 50%'
          }
        ],
        interests: [
          { name: 'Technology', percentage: 35 },
          { name: 'Business', percentage: 28 },
          { name: 'Marketing', percentage: 22 },
          { name: 'Design', percentage: 18 },
          { name: 'Entrepreneurship', percentage: 15 },
          { name: 'Innovation', percentage: 12 }
        ],
        activeHours: [
          { hour: '6 AM', activity: 15 },
          { hour: '9 AM', activity: 45 },
          { hour: '12 PM', activity: 75 },
          { hour: '3 PM', activity: 60 },
          { hour: '6 PM', activity: 85 },
          { hour: '9 PM', activity: 95 },
          { hour: '12 AM', activity: 30 }
        ]
      });
      setLoading(false);
    }, 800);
  };

  const platforms = [
    { id: 'all', name: 'All Platforms', color: 'bg-gray-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-600' },
    { id: 'twitter', name: 'X (Twitter)', color: 'bg-black' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-gray-900' }
  ];

  const dateRanges = [
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: '1y', label: 'Last year' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'demographics', label: 'Demographics', icon: Target },
    { id: 'segments', label: 'Segments', icon: Filter },
    { id: 'insights', label: 'Insights', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audience</h1>
          <p className="text-gray-600 mt-1">
            Understand your audience demographics and behavior patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAudienceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {platforms.map(platform => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {dateRanges.map(range => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Followers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {audienceData.totalFollowers.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+{audienceData.growthRate}%</span>
            <span className="text-gray-600 ml-2">vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Engagement Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {audienceData.engagementRate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${audienceData.engagementRate * 10}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Segments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {audienceData.segments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowSegmentModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Segment
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Hours */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Hours</h3>
            <div className="space-y-3">
              {audienceData.activeHours.map((hour, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">{hour.hour}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                    <div
                      className="bg-indigo-600 h-8 rounded-full flex items-center justify-end px-3"
                      style={{ width: `${hour.activity}%` }}
                    >
                      {hour.activity > 30 && (
                        <span className="text-xs font-medium text-white">{hour.activity}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Interests */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Interests</h3>
            <div className="space-y-4">
              {audienceData.interests.map((interest, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{interest.name}</span>
                    <span className="text-sm text-gray-600">{interest.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${interest.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution - Pie Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={audienceData.demographics.age.map(a => ({ name: a.range, value: a.percentage }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {audienceData.demographics.age.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution - Pie Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={audienceData.demographics.gender.map(g => ({ name: g.type, value: g.percentage }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {audienceData.demographics.gender.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ec4899', '#3b82f6', '#10b981'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Locations */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Followers</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Percentage</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {audienceData.demographics.locations.map((location, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">{location.country}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{location.followers.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{location.percentage}%</td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${location.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="space-y-4">
          {audienceData.segments.map((segment) => (
            <div key={segment.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{segment.name}</h3>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      {segment.size.toLocaleString()} followers
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Growth Rate: </span>
                      <span className="font-medium text-green-600">+{segment.growthRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Engagement: </span>
                      <span className="font-medium text-gray-900">{segment.avgEngagement}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Criteria: </span>
                      <span className="font-medium text-gray-900">{segment.criteria}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Insights</h3>
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Peak Engagement Opportunity</h4>
                  <p className="text-sm text-blue-700">
                    Your audience is most active between 6 PM - 9 PM. Schedule important content during these hours for maximum engagement.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Growing Segment</h4>
                  <p className="text-sm text-green-700">
                    "Product Interested" segment is growing 22.1% faster than average. Consider creating more product-focused content.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">Demographic Shift</h4>
                  <p className="text-sm text-purple-700">
                    25-34 age group represents your largest segment (42%). Tailor content themes to resonate with this demographic.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Content Performance Correlation</h4>
                  <p className="text-sm text-amber-700">
                    Video content drives 15% higher engagement than static posts. Consider increasing video content in your strategy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Segment Modal */}
      <Modal
        isOpen={showSegmentModal}
        onClose={() => setShowSegmentModal(false)}
        title="Create Audience Segment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment Name
            </label>
            <input
              type="text"
              placeholder="e.g., High-Value Customers"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe this segment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criteria
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Engagement rate threshold</option>
              <option>Follow date range</option>
              <option>Content preference</option>
              <option>Location-based</option>
              <option>Demographics-based</option>
              <option>Custom criteria</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowSegmentModal(false)}>
              Cancel
            </Button>
            <Button>
              Create Segment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
