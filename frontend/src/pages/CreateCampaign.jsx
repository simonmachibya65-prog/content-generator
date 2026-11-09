/**
 * Create Campaign Wizard
 * 6-step wizard for creating advertising campaigns
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft as ArrowLeftIcon, Check as CheckIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import api from '../lib/api';

const PLATFORMS = [
  { id: 'meta_ads', name: 'Meta Ads', description: 'Facebook & Instagram' },
  { id: 'tiktok_ads', name: 'TikTok Ads', description: 'TikTok advertising' },
  { id: 'google_ads', name: 'Google Ads', description: 'Search, Display, YouTube' },
  { id: 'linkedin_ads', name: 'LinkedIn Ads', description: 'Professional network' }
];

const OBJECTIVES = [
  { id: 'awareness', name: 'Awareness', description: 'Increase brand awareness' },
  { id: 'traffic', name: 'Traffic', description: 'Drive traffic to your website' },
  { id: 'engagement', name: 'Engagement', description: 'Increase post engagement' },
  { id: 'leads', name: 'Leads', description: 'Generate leads' },
  { id: 'conversions', name: 'Conversions', description: 'Drive conversions' },
  { id: 'sales', name: 'Sales', description: 'Increase sales' }
];

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    platform: '',
    name: '',
    objective: '',
    budgetType: 'daily',
    budgetAmount: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    targeting: {
      locations: [],
      ageMin: 18,
      ageMax: 65,
      genders: [],
      interests: [],
      languages: ['en']
    }
  });

  const steps = [
    { num: 1, name: 'Platform' },
    { num: 2, name: 'Campaign Info' },
    { num: 3, name: 'Objective' },
    { num: 4, name: 'Budget' },
    { num: 5, name: 'Targeting' },
    { num: 6, name: 'Review' }
  ];

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await api.post('/advertising/campaigns', formData);
      navigate(`/advertising/campaigns/${response.data.campaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateTargeting = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      targeting: { ...prev.targeting, [key]: value }
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.platform !== '';
      case 2: return formData.name !== '';
      case 3: return formData.objective !== '';
      case 4: return formData.budgetAmount !== '' && parseFloat(formData.budgetAmount) > 0;
      case 5: return formData.targeting.locations.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/advertising')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Advertising
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Create Campaign</h1>
          <p className="text-gray-400">Set up your advertising campaign</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.num} className="flex-1 flex items-center">
                <div className="flex flex-col items-center w-full">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.num
                        ? 'bg-accent-primary border-accent-primary text-white'
                        : 'bg-dark-card border-dark-border text-gray-400'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${currentStep >= step.num ? 'text-white' : 'text-gray-500'}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 -mt-6 ${
                      currentStep > step.num ? 'bg-accent-primary' : 'bg-dark-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8">
          {/* Step 1: Platform */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-6">Select Platform</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => updateFormData('platform', platform.id)}
                    className={`p-6 rounded-lg border-2 text-left transition-all ${
                      formData.platform === platform.id
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-dark-border bg-dark-bg hover:border-gray-600'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white mb-1">{platform.name}</h3>
                    <p className="text-sm text-gray-400">{platform.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Campaign Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Campaign Information</h2>
              <FormInput
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="e.g., Summer Sale 2024"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                />
                <FormInput
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Objective */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-6">Campaign Objective</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OBJECTIVES.map((objective) => (
                  <button
                    key={objective.id}
                    onClick={() => updateFormData('objective', objective.id)}
                    className={`p-6 rounded-lg border-2 text-left transition-all ${
                      formData.objective === objective.id
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-dark-border bg-dark-bg hover:border-gray-600'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white mb-1">{objective.name}</h3>
                    <p className="text-sm text-gray-400">{objective.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Set Budget</h2>
              
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => updateFormData('budgetType', 'daily')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.budgetType === 'daily'
                      ? 'border-accent-primary bg-accent-primary/10 text-white'
                      : 'border-dark-border bg-dark-bg text-gray-400'
                  }`}
                >
                  Daily Budget
                </button>
                <button
                  onClick={() => updateFormData('budgetType', 'lifetime')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.budgetType === 'lifetime'
                      ? 'border-accent-primary bg-accent-primary/10 text-white'
                      : 'border-dark-border bg-dark-bg text-gray-400'
                  }`}
                >
                  Lifetime Budget
                </button>
              </div>

              <FormInput
                label={`${formData.budgetType === 'daily' ? 'Daily' : 'Lifetime'} Budget Amount`}
                type="number"
                value={formData.budgetAmount}
                onChange={(e) => updateFormData('budgetAmount', e.target.value)}
                placeholder="0.00"
                required
                min="1"
                step="0.01"
              />
            </div>
          )}

          {/* Step 5: Targeting */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Audience Targeting</h2>
              
              <FormInput
                label="Target Locations"
                value={formData.targeting.locations.join(', ')}
                onChange={(e) => updateTargeting('locations', e.target.value.split(',').map(s => s.trim()))}
                placeholder="e.g., United States, Canada, United Kingdom"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Minimum Age"
                  type="number"
                  value={formData.targeting.ageMin}
                  onChange={(e) => updateTargeting('ageMin', parseInt(e.target.value))}
                  min="13"
                  max="65"
                />
                <FormInput
                  label="Maximum Age"
                  type="number"
                  value={formData.targeting.ageMax}
                  onChange={(e) => updateTargeting('ageMax', parseInt(e.target.value))}
                  min="13"
                  max="65"
                />
              </div>

              <FormInput
                label="Interests (comma-separated)"
                value={formData.targeting.interests.join(', ')}
                onChange={(e) => updateTargeting('interests', e.target.value.split(',').map(s => s.trim()))}
                placeholder="e.g., Fashion, Technology, Travel"
              />
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Review Campaign</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Platform</p>
                  <p className="text-white font-medium capitalize">
                    {PLATFORMS.find(p => p.id === formData.platform)?.name}
                  </p>
                </div>

                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Campaign Name</p>
                  <p className="text-white font-medium">{formData.name}</p>
                </div>

                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Objective</p>
                  <p className="text-white font-medium capitalize">{formData.objective}</p>
                </div>

                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Budget</p>
                  <p className="text-white font-medium">
                    ${formData.budgetAmount} {formData.currency} ({formData.budgetType})
                  </p>
                </div>

                <div className="p-4 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Targeting</p>
                  <p className="text-white font-medium">
                    {formData.targeting.locations.join(', ')} • Ages {formData.targeting.ageMin}-{formData.targeting.ageMax}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-border">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
            >
              {currentStep === 6 ? 'Create Campaign' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
