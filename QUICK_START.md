# 🚀 Quick Start Guide - Autonomous Marketing System

## For Users

### Setup (5 minutes)

#### 1. Register & Create Workspace
```
→ Go to platform
→ Register with email/Google
→ Create workspace (Individual/Business/Agency)
```

#### 2. Enter Business Information
```
→ Business Profile
→ Fill in:
  - Business name
  - Industry
  - Products/services
  - Target audience
  - Marketing objective
  - Brand voice
  - Languages
```

#### 3. Connect Social Accounts
```
→ Social Media → Connect Accounts
→ Click each platform:
  ☐ Instagram
  ☐ TikTok
  ☐ Facebook
  ☐ YouTube
  ☐ LinkedIn
  ☐ X/Twitter
→ Authorize access
```

#### 4. Set Publishing Modes
```
→ Settings → Publishing Modes
→ For each account, choose:
  ○ Manual (you control everything)
  ○ Approval (AI creates, you approve)
  ○ Automatic (fully autonomous) ✨ Recommended
```

#### 5. Create Campaign
```
→ Campaigns → New Campaign
→ Enter:
  - Campaign name
  - Niche/topic
  - Target platforms
  - Posting frequency (e.g., 2 posts/day)
  - Duration (30 days)
→ Enable "Auto Publish"
```

#### 6. Start Autopilot 🚀
```
→ Click "Start AI Autopilot"
→ Wait 2-3 minutes for strategy generation
→ Review 30-day plan
→ Confirm start
```

### ✅ Done!

**The system now runs autonomously for 30 days:**
- ✅ Creates 60+ pieces of content
- ✅ Generates images and videos
- ✅ Adapts for each platform
- ✅ Publishes at optimal times
- ✅ Monitors performance
- ✅ Optimizes automatically

**You can:**
- ⏸️ Pause autopilot anytime
- 📊 Check performance dashboard
- 🔍 Review upcoming content
- ✏️ Override individual posts (if approval mode)

---

## For Developers

### Installation

```bash
cd /home/masalago/projects/cotents/backend

# Install dependencies (already done)
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migration
npm run migrate

# Start backend
npm run dev
```

### Required API Keys

Add to `/backend/.env`:

```env
# AI Providers (at least one per category)
OPENAI_API_KEY=sk-...              # For text generation
GOOGLE_GEMINI_API_KEY=...          # For text (free tier)
STABILITY_API_KEY=sk-...           # For images (25/day free)
ELEVENLABS_API_KEY=...             # For voice (10k chars/mo free)
KLING_API_KEY=...                  # For videos (66 credits/day free)

# Platform OAuth (for publishing)
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
# ... etc for other platforms

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/spyrex

# JWT
JWT_SECRET=your-secret-key

# Optional: Advanced features
RUNWAY_API_KEY=...                 # For video (paid)
GOOGLE_VEO_API_KEY=...             # For video (paid)
```

### Test Autopilot

```bash
# 1. Create test campaign via API
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "niche": "Fashion",
    "platforms": ["instagram", "tiktok"],
    "social_account_ids": ["uuid-1", "uuid-2"],
    "posting_frequency": {"posts_per_day": 2},
    "auto_publish": true
  }'

# 2. Start autopilot
curl -X POST http://localhost:5000/api/campaigns/CAMPAIGN_ID/autopilot/start \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Watch logs
tail -f logs/combined.log | grep "Autopilot"
```

### Monitor System

```bash
# Autopilot operations
tail -f logs/combined.log | grep "Autopilot"

# Quality checks
tail -f logs/combined.log | grep "Quality"

# Publishing
tail -f logs/combined.log | grep "Published"

# All errors
tail -f logs/error.log
```

### Key Endpoints

#### Autopilot
```javascript
POST   /api/campaigns/:id/autopilot/start      // Start autonomous operation
POST   /api/campaigns/:id/autopilot/pause      // Pause
POST   /api/campaigns/:id/autopilot/resume     // Resume
GET    /api/campaigns/:id/strategy             // Get strategy
POST   /api/campaigns/:id/optimize             // Optimize
```

#### Publishing Modes
```javascript
GET    /api/publishing/publishing-modes        // Get all modes
PUT    /api/publishing/publishing-modes        // Update modes
POST   /api/publishing/jobs/:id/approve        // Approve content
POST   /api/publishing/jobs/:id/reject         // Reject content
```

### Architecture

```
Frontend (React)
    ↓
Backend API (Express)
    ↓
┌───────────────────────────────────────┐
│  Core Services                        │
├───────────────────────────────────────┤
│  • CampaignAutomation (Autopilot)    │
│  • PlatformAdapterService             │
│  • QualityControlService              │
│  • PublishingService                  │
│  • CreativeStudioService              │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  External APIs                        │
├───────────────────────────────────────┤
│  • OpenAI / Gemini (Text)            │
│  • DALL-E / Stability (Images)       │
│  • Kling / Runway (Videos)           │
│  • ElevenLabs (Voice)                │
│  • Platform APIs (Publishing)         │
└───────────────────────────────────────┘
    ↓
PostgreSQL Database
```

### Database Schema

**New Tables:**
- `business_profiles` - Business information
- `publishing_modes` - Automation settings
- `campaign_insights` - AI recommendations

**Enhanced Tables:**
- `campaigns` - Added autopilot columns
- `publishing_jobs` - Added quality columns

Run migration:
```bash
npm run migrate
```

### Scheduler Jobs

Background tasks run automatically:

| Job | Frequency | Purpose |
|-----|-----------|---------|
| Process publishing jobs | Every minute | Publish scheduled content |
| Campaign automation | Every 6 hours | Generate new content |
| Token refresh | Daily 1 AM | Refresh expiring tokens |
| Analytics sync | Daily 2 AM | Fetch platform analytics |
| Performance monitoring | Daily 3 AM | Optimize campaigns |

### Troubleshooting

#### Issue: Autopilot not starting
```bash
# Check AI credits
SELECT ai_credits, ai_credits_used FROM users WHERE id = 'USER_ID';

# Check campaign status
SELECT * FROM campaigns WHERE id = 'CAMPAIGN_ID';

# Check logs
tail -f logs/error.log
```

#### Issue: Content not publishing
```bash
# Check publishing modes
SELECT * FROM publishing_modes WHERE user_id = 'USER_ID';

# Check account status
SELECT * FROM social_accounts WHERE user_id = 'USER_ID';

# Check token expiry
SELECT sa.platform_name, ot.expires_at 
FROM social_accounts sa
JOIN oauth_tokens ot ON ot.social_account_id = sa.id
WHERE sa.user_id = 'USER_ID';
```

#### Issue: Quality check failing
```bash
# Check quality reports
SELECT quality_report FROM publishing_jobs 
WHERE status = 'failed' AND quality_score < 60
ORDER BY created_at DESC LIMIT 5;
```

### Testing Checklist

- [ ] Database migration runs successfully
- [ ] User can create business profile
- [ ] User can connect social accounts
- [ ] User can set publishing modes
- [ ] User can create campaign
- [ ] Autopilot starts successfully
- [ ] Strategy is generated
- [ ] Content is pre-generated
- [ ] Quality checks pass (score ≥ 70)
- [ ] Content adapts for each platform
- [ ] Publishing jobs are created
- [ ] Content publishes at scheduled time (if automatic mode)
- [ ] Analytics are collected
- [ ] Optimization recommendations generated

---

## Common Workflows

### Workflow 1: Full Automation
```
1. Set all accounts to "automatic" mode
2. Create campaign with autopilot
3. Start autopilot
4. System runs for 30 days
5. Check results at end of month
```

### Workflow 2: Semi-Automated (Approval)
```
1. Set accounts to "approval" mode
2. Create campaign with autopilot
3. Start autopilot
4. AI generates content daily
5. User approves/rejects in dashboard
6. Approved content publishes automatically
```

### Workflow 3: Manual Control
```
1. Set accounts to "manual" mode
2. Use Creative Studio to generate content
3. Use Platform Adapter to format for platforms
4. Review quality reports
5. Manually schedule and publish
```

---

## Production Checklist

Before launching to production:

- [ ] Set up production database
- [ ] Configure all environment variables
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy
- [ ] Test all OAuth flows
- [ ] Test autopilot on staging
- [ ] Load test publishing system
- [ ] Set up error alerting
- [ ] Document API for frontend team
- [ ] Create user documentation
- [ ] Train support team

---

## Support

### Documentation
- **Full System Docs:** `AUTONOMOUS_MARKETING_SYSTEM.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `QUICK_START.md`

### Code Files
- **Autopilot:** `backend/src/services/campaignAutomation.js`
- **Platform Adapter:** `backend/src/services/platformAdapterService.js`
- **Quality Control:** `backend/src/services/qualityControlService.js`
- **Publishing:** `backend/src/services/publishingService.js`

### Database
- **Schema:** `backend/src/database/schema.sql`
- **Migration:** `backend/src/database/migrate.js`

---

**Last Updated:** November 10, 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready to Use
