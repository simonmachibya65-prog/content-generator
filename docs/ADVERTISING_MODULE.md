# 📢 Advertising Module

Complete advertising management system with campaign creation, budget control, A/B testing, and multi-platform support.

## 🎯 Overview

The Advertising Module provides a full-featured advertising campaign management system that integrates with major ad platforms. Create campaigns, manage budgets, run A/B tests, and track performance—all from one unified interface.

## ✨ Features

### 1. Campaign Management
- **Multi-Platform Support**: Meta Ads, TikTok Ads, Google Ads, LinkedIn Ads
- **Campaign Hierarchy**: Campaign → Ad Set → Advertisement
- **Campaign Objectives**: Awareness, Traffic, Engagement, Leads, Conversions, Sales
- **Status Management**: Draft, Active, Paused, Completed
- **Performance Tracking**: Impressions, clicks, conversions, CTR, CPC, CPA, ROAS

### 2. Budget Management
- **Monthly Budgets**: Set total monthly advertising budgets
- **Platform Allocation**: Distribute budget across platforms with sliders
- **Auto-Distribution**: Evenly distribute budget across all platforms
- **Budget Alerts**: 85% and 100% threshold warnings
- **Real-Time Tracking**: Monitor spent vs allocated budgets
- **Visual Indicators**: Color-coded budget usage bars

### 3. A/B Testing
- **Variant Creation**: Create multiple ad variants to test
- **Performance Comparison**: Track impressions, clicks, conversions per variant
- **Confidence Scoring**: Statistical confidence in test results
- **Winner Declaration**: Automatically pause losing variants
- **Test History**: Track all A/B tests and their outcomes

### 4. Ad Creation
- **Creative Assets**: Upload images, videos, or use AI-generated content
- **Ad Formats**: Image, Video, Carousel, Collection, Stories
- **Headlines & Copy**: Write compelling ad headlines and descriptions
- **CTA Buttons**: Learn More, Shop Now, Sign Up, Download, Contact Us
- **Preview**: See how ads will look on each platform

### 5. Targeting
- **Geographic**: Target specific countries, regions, or cities
- **Demographics**: Age range, gender targeting
- **Interests**: Target users by interests and behaviors
- **Languages**: Multi-language targeting
- **Custom Audiences**: Upload customer lists (coming soon)

### 6. Analytics
- **Campaign Performance**: View metrics for all campaigns
- **Platform Breakdown**: Compare performance across platforms
- **Top Performers**: Identify best-performing ads
- **Time Series**: Track performance over time
- **Export Reports**: Download performance data

## 🗄️ Database Schema

### Tables

#### `ad_campaigns`
Main campaign metadata and performance metrics.
```sql
- id (UUID)
- user_id (FK)
- platform (meta_ads, tiktok_ads, google_ads, linkedin_ads)
- name
- objective (awareness, traffic, engagement, leads, conversions, sales)
- status (draft, active, paused, completed)
- budget_type (daily, lifetime)
- budget_amount, spent_amount
- target_locations, target_age_min/max, target_genders
- impressions, clicks, conversions, ctr, cpc, cpm, cpa, roas
```

#### `ad_sets`
Ad set configuration within campaigns.
```sql
- id (UUID)
- ad_campaign_id (FK)
- name, status
- budget_type, budget_amount
- targeting (JSONB)
- optimization_goal (impressions, clicks, conversions)
- bid_strategy (lowest_cost, cost_cap, bid_cap)
```

#### `advertisements`
Individual ads within ad sets.
```sql
- id (UUID)
- ad_set_id (FK)
- name, format (image, video, carousel, collection)
- headline, primary_text, description
- cta_type, cta_url
- media_ids (array of media files)
- is_variant, parent_ad_id (for A/B testing)
- impressions, clicks, conversions, performance metrics
```

#### `monthly_ad_budgets`
Monthly budget allocation across platforms.
```sql
- id (UUID)
- user_id (FK)
- month (DATE)
- total_budget, spent_amount, remaining_amount
- platform_budgets (JSONB) - allocation per platform
```

#### `budget_alerts`
Automated budget threshold alerts.
```sql
- id (UUID)
- user_id (FK)
- ad_campaign_id (FK)
- alert_type (budget_85_percent, budget_100_percent)
- threshold, current_value, message
```

#### `ab_test_results`
A/B test tracking and results.
```sql
- id (UUID)
- parent_ad_id (FK)
- test_name
- variants (JSONB) - array of variant data
- winning_variant (FK)
- confidence_score, status
```

## 🔌 API Endpoints

### Campaigns

```http
GET    /api/advertising/campaigns
POST   /api/advertising/campaigns
GET    /api/advertising/campaigns/:id
PUT    /api/advertising/campaigns/:id
DELETE /api/advertising/campaigns/:id
POST   /api/advertising/campaigns/:id/sync
```

### Ad Sets

```http
GET    /api/advertising/campaigns/:campaignId/ad-sets
POST   /api/advertising/ad-sets
PUT    /api/advertising/ad-sets/:id
DELETE /api/advertising/ad-sets/:id
```

### Advertisements

```http
GET    /api/advertising/ad-sets/:adSetId/ads
POST   /api/advertising/ads
GET    /api/advertising/ads/:id
PUT    /api/advertising/ads/:id
DELETE /api/advertising/ads/:id
```

### A/B Testing

```http
POST   /api/advertising/ab-tests
GET    /api/advertising/ab-tests/:parentAdId
POST   /api/advertising/ab-tests/:testId/winner
```

### Budget Management

```http
GET    /api/advertising/budget/:month
POST   /api/advertising/budget
GET    /api/advertising/budget-alerts
PUT    /api/advertising/budget-alerts/:id/read
```

### Analytics

```http
GET    /api/advertising/overview
GET    /api/advertising/platform-breakdown
GET    /api/advertising/top-ads
```

## 🎨 Frontend Pages

### 1. Advertising Overview (`/advertising`)
- Dashboard with key metrics
- Active campaigns count
- Total spend and impressions
- Budget alerts
- Platform breakdown
- Campaigns list

### 2. Create Campaign (`/advertising/create`)
- 6-step wizard:
  1. Platform selection
  2. Campaign information
  3. Objective selection
  4. Budget configuration
  5. Audience targeting
  6. Review and create

### 3. Campaign Detail (`/advertising/campaigns/:id`)
- Campaign performance metrics
- Ad sets management
- Advertisements grid
- Status toggle (active/paused)
- Delete campaign

### 4. Budget Management (`/advertising/budget`)
- Set monthly total budget
- Allocate budget across platforms
- Auto-distribute evenly
- Visual budget allocation
- Current month performance

## 🔄 Integration Framework

### Meta Ads (Facebook & Instagram)
```javascript
// OAuth flow ready
// API sync methods ready for implementation
- Campaign creation → Facebook Marketing API
- Ad set management → Graph API
- Performance sync → Insights API
```

### TikTok Ads
```javascript
// OAuth flow ready
- Campaign management → TikTok Marketing API
- Creative upload → Creative Management API
- Performance tracking → Reporting API
```

### Google Ads
```javascript
// OAuth flow ready
- Campaign management → Google Ads API
- Keyword management → AdWords API
- Performance data → Google Ads Reporting
```

### LinkedIn Ads
```javascript
// OAuth flow ready
- Campaign management → LinkedIn Marketing API
- Audience targeting → Audience API
- Analytics → Ads Reporting API
```

## 📊 Usage Examples

### Create a Campaign

```javascript
const campaignData = {
  platform: 'meta_ads',
  name: 'Summer Sale 2024',
  objective: 'conversions',
  budgetType: 'daily',
  budgetAmount: 100,
  currency: 'USD',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  targeting: {
    locations: ['United States', 'Canada'],
    ageMin: 25,
    ageMax: 45,
    genders: ['female'],
    interests: ['Fashion', 'Shopping']
  }
};

const response = await api.post('/advertising/campaigns', campaignData);
```

### Set Monthly Budget

```javascript
const budgetData = {
  month: '2024-06-01',
  totalBudget: 5000,
  platformBudgets: {
    meta_ads: 2000,
    tiktok_ads: 1500,
    google_ads: 1000,
    linkedin_ads: 500
  }
};

await api.post('/advertising/budget', budgetData);
```

### Create A/B Test

```javascript
const testData = {
  parentAdId: 'ad-uuid-123',
  testName: 'Headline Test',
  variants: [
    {
      name: 'Variant A',
      headline: 'Summer Sale - 50% Off',
      primaryText: 'Shop now and save big!',
      variantName: 'A'
    },
    {
      name: 'Variant B',
      headline: 'Limited Time Offer - Half Price',
      primaryText: 'Don\'t miss out on huge savings!',
      variantName: 'B'
    }
  ]
};

await api.post('/advertising/ab-tests', testData);
```

## 🚀 Getting Started

### Prerequisites
- PostgreSQL database with schema migrated
- Social platform OAuth credentials
- Ad platform API access (Meta, TikTok, Google, LinkedIn)

### Setup

1. **Run database migrations:**
```bash
cd backend
npm run migrate
```

2. **Configure ad platform credentials:**
```env
# Meta Ads
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret

# TikTok Ads
TIKTOK_APP_ID=your-app-id
TIKTOK_APP_SECRET=your-app-secret

# Google Ads
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# LinkedIn Ads
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
```

3. **Start the backend:**
```bash
npm start
```

4. **Navigate to advertising:**
```
http://localhost:3000/advertising
```

## 📈 Performance Metrics

The system tracks comprehensive performance metrics:

- **Impressions**: Total ad views
- **Clicks**: User clicks on ads
- **Conversions**: Completed actions (purchases, sign-ups)
- **CTR (Click-Through Rate)**: Clicks / Impressions
- **CPC (Cost Per Click)**: Spent / Clicks
- **CPM (Cost Per Mille)**: (Spent / Impressions) * 1000
- **CPA (Cost Per Acquisition)**: Spent / Conversions
- **ROAS (Return On Ad Spend)**: Revenue / Spent

## 🔔 Budget Alerts

Automatic alerts trigger when:
- Campaign reaches 85% of budget
- Campaign reaches 100% of budget
- CPA exceeds target threshold (coming soon)
- ROAS drops below target (coming soon)

## 🎯 Best Practices

### Campaign Organization
- Use clear, descriptive campaign names
- Group related ad sets together
- Set realistic budgets based on goals
- Monitor performance daily

### A/B Testing
- Test one variable at a time
- Run tests for at least 7 days
- Wait for statistical significance
- Apply learnings to future campaigns

### Budget Management
- Start with conservative budgets
- Scale winners gradually
- Pause underperforming campaigns quickly
- Review allocation monthly

### Targeting
- Start broad, then narrow
- Use platform insights to refine
- Test different audience segments
- Exclude converters to avoid ad fatigue

## 🔮 Roadmap

### Coming Soon
- [ ] Custom audience uploads
- [ ] Lookalike audiences
- [ ] Automated bid optimization
- [ ] Multi-platform campaign duplication
- [ ] Automated reporting schedules
- [ ] ROI calculator
- [ ] Budget recommendations
- [ ] Seasonal campaign templates

### Future Enhancements
- [ ] Predictive budget allocation
- [ ] AI-powered ad copy suggestions
- [ ] Automated A/B test creation
- [ ] Cross-platform performance comparison
- [ ] Integration with Google Analytics
- [ ] Conversion pixel management
- [ ] Advanced attribution modeling

## 📚 Additional Resources

- [Meta Ads Documentation](https://developers.facebook.com/docs/marketing-apis)
- [TikTok Ads API](https://ads.tiktok.com/marketing_api/docs)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [LinkedIn Ads API](https://docs.microsoft.com/en-us/linkedin/marketing/)

## 🆘 Support

For issues or questions:
1. Check the [main README](../README.md)
2. Review API endpoint documentation
3. Check database schema
4. Review error logs in `backend/logs/`

---

**Built with ❤️ as part of the AI Marketing OS**
