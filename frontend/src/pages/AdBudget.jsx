/**
 * Ad Budget Management Page
 * Set monthly budgets and allocate across platforms
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft as ArrowLeftIcon, DollarSign as CurrencyDollarIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { CardSkeleton as LoadingSkeleton } from '../components/LoadingSkeleton';
import api from '../lib/api';

const AD_PLATFORMS = [
  { id: 'meta_ads', name: 'Meta Ads', color: '#1877F2' },
  { id: 'tiktok_ads', name: 'TikTok Ads', color: '#000000' },
  { id: 'google_ads', name: 'Google Ads', color: '#4285F4' },
  { id: 'linkedin_ads', name: 'LinkedIn Ads', color: '#0A66C2' }
];

const AdBudget = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [platformBudgets, setPlatformBudgets] = useState({
    meta_ads: 0,
    tiktok_ads: 0,
    google_ads: 0,
    linkedin_ads: 0
  });
  const [existingBudget, setExistingBudget] = useState(null);
  const [platformBreakdown, setPlatformBreakdown] = useState([]);

  useEffect(() => {
    const monthStr = new Date().toISOString().slice(0, 7) + '-01';
    setCurrentMonth(monthStr);
    loadBudgetData(monthStr);
  }, []);

  const loadBudgetData = async (month) => {
    try {
      setLoading(true);
      const [budgetRes, breakdownRes] = await Promise.all([
        api.get(`/advertising/budget/${month}`),
        api.get('/advertising/platform-breakdown')
      ]);

      if (budgetRes.data.budget) {
        const budget = budgetRes.data.budget;
        setExistingBudget(budget);
        setTotalBudget(budget.total_budget);
        setPlatformBudgets(budget.platform_budgets || {});
      }

      setPlatformBreakdown(breakdownRes.data.breakdown);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTotalBudgetChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTotalBudget(value);

    // Auto-distribute evenly if no existing allocations
    if (!existingBudget) {
      const perPlatform = value / AD_PLATFORMS.length;
      const newBudgets = {};
      AD_PLATFORMS.forEach(platform => {
        newBudgets[platform.id] = perPlatform;
      });
      setPlatformBudgets(newBudgets);
    }
  };

  const handlePlatformBudgetChange = (platform, value) => {
    setPlatformBudgets(prev => ({
      ...prev,
      [platform]: parseFloat(value) || 0
    }));
  };

  const handleDistributeEvenly = () => {
    const perPlatform = totalBudget / AD_PLATFORMS.length;
    const newBudgets = {};
    AD_PLATFORMS.forEach(platform => {
      newBudgets[platform.id] = perPlatform;
    });
    setPlatformBudgets(newBudgets);
  };

  const handleSaveBudget = async () => {
    try {
      setSaving(true);
      await api.post('/advertising/budget', {
        month: currentMonth,
        totalBudget: parseFloat(totalBudget),
        platformBudgets
      });
      
      alert('Budget saved successfully!');
      loadBudgetData(currentMonth);
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const allocatedTotal = Object.values(platformBudgets).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const remainingBudget = totalBudget - allocatedTotal;
  const isValid = Math.abs(remainingBudget) < 0.01 && totalBudget > 0;

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/advertising')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Advertising
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Budget Management</h1>
        <p className="text-gray-400">Set and allocate your monthly advertising budget</p>
      </div>

      {/* Current Month Budget */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {new Date(currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Budget
            </h2>
            <p className="text-sm text-gray-400">Set your total monthly budget and allocate across platforms</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Total Budget */}
          <div>
            <FormInput
              label="Total Monthly Budget"
              type="number"
              value={totalBudget}
              onChange={handleTotalBudgetChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {existingBudget && (
              <p className="text-xs text-gray-500 mt-2">
                Spent: ${parseFloat(existingBudget.spent_amount).toFixed(2)} • 
                Remaining: ${parseFloat(existingBudget.remaining_amount).toFixed(2)}
              </p>
            )}
          </div>

          {/* Platform Allocation */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Platform Allocation</h3>
              <button
                onClick={handleDistributeEvenly}
                className="text-sm text-accent-primary hover:text-accent-primary/80"
              >
                Distribute Evenly
              </button>
            </div>

            <div className="space-y-4">
              {AD_PLATFORMS.map((platform) => {
                const spent = platformBreakdown.find(p => p.platform === platform.id)?.spent || 0;
                const allocated = platformBudgets[platform.id] || 0;
                const percentage = totalBudget > 0 ? (allocated / totalBudget) * 100 : 0;

                return (
                  <div key={platform.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">{platform.name}</label>
                      <span className="text-sm text-gray-400">{percentage.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={totalBudget}
                          step="10"
                          value={allocated}
                          onChange={(e) => handlePlatformBudgetChange(platform.id, e.target.value)}
                          className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                      </div>
                      <input
                        type="number"
                        value={allocated}
                        onChange={(e) => handlePlatformBudgetChange(platform.id, e.target.value)}
                        className="w-24 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
                        min="0"
                        step="10"
                      />
                    </div>

                    {spent > 0 && (
                      <p className="text-xs text-gray-500">
                        Spent this month: ${parseFloat(spent).toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Summary */}
          <div className="p-4 bg-dark-bg rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Budget:</span>
              <span className="text-white font-medium">${parseFloat(totalBudget || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Allocated:</span>
              <span className="text-white font-medium">${allocatedTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-dark-border pt-2">
              <span className="text-gray-400">Remaining:</span>
              <span className={`font-medium ${remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                ${remainingBudget.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Validation Warning */}
          {!isValid && totalBudget > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-400 font-medium">Budget Mismatch</p>
                <p className="text-sm text-gray-300 mt-1">
                  {remainingBudget < 0 
                    ? 'Total allocated exceeds your budget. Please adjust platform allocations.'
                    : 'You have unallocated budget. Distribute it across platforms or reduce total budget.'}
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveBudget}
              disabled={!isValid || saving}
            >
              {saving ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      {platformBreakdown.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Current Month Performance</h2>
          <div className="space-y-4">
            {platformBreakdown.map((platform) => (
              <div key={platform.platform} className="p-4 bg-dark-bg rounded-lg">
                <h3 className="text-sm font-medium text-white mb-3 capitalize">
                  {platform.platform.replace('_ads', '').replace('_', ' ')}
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Spent</p>
                    <p className="text-sm font-medium text-white">${parseFloat(platform.spent).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Impressions</p>
                    <p className="text-sm font-medium text-white">{parseInt(platform.impressions).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Clicks</p>
                    <p className="text-sm font-medium text-white">{parseInt(platform.clicks).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">ROAS</p>
                    <p className="text-sm font-medium text-white">{parseFloat(platform.roas || 0).toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdBudget;
