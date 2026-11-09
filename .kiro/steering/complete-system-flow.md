---
name: "Complete System Flow Implementation"
description: "End-to-end implementation guide from business setup to automatic publishing"
inclusion: manual
---

# Complete System Flow: From Business Setup to Automatic Publishing

## Overview

This is an **intelligent marketing pipeline** where a customer provides business information, the AI understands the business, develops a marketing strategy, creates promotional content, prepares platform-specific versions, schedules them and automatically publishes them to connected social media accounts.

**Key principle:** The user should not need to manually create every post or visit every social media platform. Once configured and authorized, the platform handles the workflow automatically.

## 12-Step Workflow

### STEP 01: USER REGISTRATION & LOGIN ✅ DONE
- Email/password or Google Sign-In
- Email verification
- JWT authentication
- Workspace creation

**Status:** Fully implemented

---

### STEP 02: BUSINESS SETUP ⏳ NEXT PRIORITY
**Goal:** Collect comprehensive business information for AI personalization

**Required:** Business Onboarding Page

**Form fields:**
- Business name
- Industry (dropdown: Fashion, Food, Tech, Real Estate, Healthcare, etc.)
- Products/Services (multi-line text)
- Target customers (demographics)
- Target location (country/region)
- Website URL
- Main marketing objectives (checkboxes: Sales, Awareness, Engagement, Leads)
- Preferred languages (multi-select: English, Swahili, French, Spanish, etc.)
- Brand logo upload
- Brand colors (color pickers)
- Contact details
- Current promotional offers

**Database:** `business_profiles` table
```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_name VARCHAR(255),
  industry VARCHAR(100),
  products TEXT,
  services TEXT,
  target_audience JSONB,
  target_location VARCHAR(100),
  website VARCHAR(255),
  marketing_goals JSONB,
  preferred_languages TEXT[],
  brand_logo_url TEXT,
  brand_colors JSONB,
  contact_info JSONB,
  promotional_offers TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**UI Design:** Multi-step wizard with progress indicator, similar to onboarding patterns in reference images.

---

### STEP 03: BRAND INTELLIGENCE ⏳ NEW FEATURE
**Goal:** AI analyzes business profile and creates reusable brand knowledge

**Process:**
1. User completes business setup
2. AI Engine processes all business information
3. Generates brand intelligence document:
   - Brand identity summary
   - Product/service catalog
   - Target audience personas
   - Brand voice guidelines
   - Content themes
   - Visual style preferences
   - Marketing objectives
   - Promotional strategies

**Implementation:**
- New page: `/brand-intelligence`
- AI Service method: `generateBrandIntelligence(businessProfileId)`
- Uses GPT-4 with structured output
- Stores in `brand_intelligence` table
- Shows generated analysis with edit capability

**Database:** `brand_intelligence` table
```sql
CREATE TABLE brand_intelligence (
  id UUID PRIMARY KEY,
  business_profile_id UUID REFERENCES business_profiles(id),
  brand_identity TEXT,
  brand_voice TEXT,
  content_themes JSONB,
  target_personas JSONB,
  visual_guidelines JSONB,
  marketing_strategy TEXT,
  generated_at TIMESTAMP,
  ai_model VARCHAR(50)
);
```

---

### STEP 04: SOCIAL MEDIA CONNECTION ✅ 60% DONE
**Current:** OAuth for 6 platforms (TikTok, YouTube, Instagram, Facebook, LinkedIn, X)

**Remaining work:**
- URL-based platform detection (paste profile URL → auto-detect platform)
- Account health dashboard
- Connection status monitoring
- Token refresh automation
- Multiple accounts per platform grouping
- Pinterest adapter
- Threads adapter (when API available)

**Enhancement needed:**
Better UX for connection:
1. User pastes profile URL
2. System extracts platform and username
3. Shows preview card with public info
4. User clicks "Connect"
5. OAuth flow begins

---

### STEP 05: MARKETING STRATEGY GENERATION ⏳ NEW FEATURE
**Goal:** AI creates comprehensive monthly marketing plan

**Page:** `/ai-intelligence/strategy`

**AI generates:**
- Marketing objectives
- Target platforms (based on audience + industry)
- Content types (videos, images, carousels, stories)
- Posting frequency per platform
- Content themes and topics
- Campaign schedule
- Budget recommendations (for ads)

**Example output:**
```
Fashion House — Monthly Marketing Strategy

Objectives:
- Increase brand awareness
- Generate product inquiries
- Drive sales

Target Platforms:
- Instagram (5 posts/week)
- Facebook (5 posts/week)
- TikTok (4 videos/week)
- YouTube Shorts (3 videos/week)

Content Strategy:
- Product demonstrations
- Fashion tips and trends
- Customer testimonials
- Behind-the-scenes content
- Promotional announcements

Best Posting Times:
- Instagram: Mon-Fri 9AM, 6PM
- TikTok: Daily 12PM, 8PM
- Facebook: Mon-Fri 10AM, 3PM
```

**Implementation:**
- AI Service: `generateMarketingStrategy(businessProfileId, brandIntelligenceId)`
- User can edit and approve strategy
- Stores in `marketing_strategies` table
- Used as input for campaign automation

---

### STEP 06: AI CONTENT GENERATION ✅ 20% DONE
**Current:** Basic text generation for platforms

**Needed:** Complete Creative Studio (Phase 5)
- ✅ AI text captions (done)
- ⏳ AI image generation (DALL-E 3)
- ⏳ AI video generation (Runway/Pika)
- ⏳ Graphic design studio (canvas editor)
- ⏳ AI voiceover (ElevenLabs)
- ⏳ Templates library (500+ templates)
- ⏳ Brand kit integration

**Content types to generate:**
- Social media captions
- Promotional posters
- Product images
- Video scripts
- Short videos (15-60 seconds)
- Carousel graphics
- Instagram Stories
- Voiceovers
- Subtitles
- Hashtags

---

### STEP 07: PLATFORM-SPECIFIC ADAPTATION ⏳ NEW FEATURE
**Goal:** Don't copy same content everywhere — adapt intelligently

**Critical feature:** Each platform gets optimized version

**Example:**
Original campaign: "New Fashion Collection Available Now!"

| Platform | Adaptation |
|----------|-----------|
| Instagram | 1080x1080 image, engaging caption, hashtags, carousel |
| Facebook | 1200x630 image, product details, CTA button |
| TikTok | 9:16 vertical video, 15s hook, subtitles, trending audio |
| YouTube Shorts | 9:16 video, title, description, timestamps |
| LinkedIn | Professional tone, business angle, link |
| X | 280 chars, media, shortened link |

**Implementation:**
- Platform adapter layer
- Content transformer service
- Media resizer/reformatter
- Caption optimizer per platform
- Hashtag strategy per platform

**Service:** `PlatformAdapterService.adaptContent(content, platform)`

Returns platform-specific version:
```javascript
{
  platform: 'instagram',
  media: { url, dimensions, format },
  caption: 'Optimized caption with #hashtags',
  metadata: { location, tags, collaborators },
  publishing_options: { first_comment, hide_like_count }
}
```

---

### STEP 08: QUALITY CONTROL & POLICY CHECKS ⏳ NEW FEATURE
**Goal:** Validate before publishing to prevent errors

**Validation checks:**
1. Brand consistency (colors, voice, style)
2. Content completeness (caption, media, metadata)
3. Media validation (format, dimensions, file size)
4. Platform requirements met
5. Account connected and authorized
6. Publishing permissions verified
7. No policy violations (inappropriate content, prohibited keywords)
8. Links functional
9. Hashtags appropriate
10. No duplicate recent posts

**Implementation:**
- Validation pipeline before scheduling
- Rules engine for brand guidelines
- Content moderation (AI + manual review queue)
- Platform compliance checker

**Service:** `ValidationService.validatePost(post, account, platform)`

**Database:** `content_validation_results` table
- Stores validation outcome
- Lists issues found
- Suggests fixes
- Approval required if warnings

---

### STEP 09: PUBLISHING APPROVAL SETTINGS ✅ PARTIAL
**Current:** Basic scheduled/draft status

**Needed:** Three distinct publishing modes

**Mode A: Fully Automatic (Autopilot)**
- AI creates, validates, schedules, publishes automatically
- User sets rules and limits
- Notifications on publish success/fail

**Mode B: Approval Required**
- AI creates and prepares content
- Places in approval queue
- Team member reviews and approves
- Then auto-publishes

**Mode C: Manual Publishing**
- AI creates content
- User downloads or copies
- User publishes manually
- (For platforms without API or user preference)

**Settings page:** `/settings/publishing-modes`

**Per-account configuration:**
```javascript
{
  account_id: 'instagram_123',
  publishing_mode: 'approval', // 'auto' | 'approval' | 'manual'
  auto_publish_rules: {
    max_posts_per_day: 2,
    allowed_hours: ['09:00-12:00', '18:00-21:00'],
    require_approval_if: ['contains_link', 'mentions_competitor']
  }
}
```

---

### STEP 10: CONTENT SCHEDULING ✅ 50% DONE
**Current:** Basic calendar view exists

**Needed:**
- AI-powered optimal time selection
- Drag-and-drop scheduling (Phase 7)
- Bulk scheduling
- Conflict detection
- Platform rate limit awareness
- Time zone handling
- Best time recommendations per platform

**AI determines:**
- When target audience is most active
- Platform algorithm preferences
- Historical performance data
- Avoid oversaturation (max 2-3 posts/day)

**Scheduler:** Background job (Redis + Bull)
- Checks every minute for due posts
- Adds to publishing queue
- Handles retries
- Updates post status

---

### STEP 11: AUTOMATIC PUBLISHING ENGINE ⏳ 30% DONE
**Current:** Basic publishing routes exist

**Needed:** Robust background publishing system

**Architecture:**

```
┌─────────────────────┐
│  Post Scheduler     │ ← Cron job (every minute)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Publishing Queue   │ ← Redis + BullMQ
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Platform Adapter   │ ← Identifies platform
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Authorization      │ ← Check tokens + permissions
│      Check          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Media Processing   │ ← Upload media, prepare data
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Social Platform    │ ← API call to Instagram/TikTok/etc.
│       API           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Publication        │ ← Record result, update status
│   Verification      │
└─────────────────────┘
```

**Publishing Worker:**
```javascript
async function publishPost(job) {
  const { postId, accountId, platform } = job.data;
  
  // 1. Load post and account
  const post = await getPost(postId);
  const account = await getAccount(accountId);
  
  // 2. Check authorization
  if (!account.is_connected) throw new Error('Account not connected');
  if (isTokenExpired(account.access_token)) {
    await refreshToken(account);
  }
  
  // 3. Platform adapter
  const adapter = getPlatformAdapter(platform); // instagram, tiktok, etc.
  
  // 4. Prepare media
  const mediaUrls = await uploadMedia(post.media, platform);
  
  // 5. Publish
  const result = await adapter.publish({
    caption: post.content_text,
    media: mediaUrls,
    hashtags: post.hashtags,
    metadata: post.platform_data
  });
  
  // 6. Record result
  await updatePost(postId, {
    status: 'published',
    platform_post_id: result.id,
    platform_post_url: result.url,
    published_at: new Date()
  });
  
  // 7. Notify user
  await sendNotification(post.user_id, 'Post published successfully');
}
```

**Retry logic:**
- Exponential backoff: 1min → 5min → 15min → 1hr
- Max 4 retries
- Different errors:
  - Rate limit → wait and retry
  - Token expired → refresh and retry
  - Invalid content → mark as failed, notify user
  - Network error → retry

**Database:** `publishing_jobs` table (existing, enhance)
- Add `retry_count`, `last_error`, `next_retry_at`

---

### STEP 12: MONITORING & ANALYTICS ✅ 40% DONE
**Current:** Basic analytics exist

**Needed:**
- Post-publication verification
- Performance data collection
- AI recommendations based on performance
- Continuous improvement loop

**Data to collect:**
- Publishing success/failure rates
- Platform post IDs and URLs
- Views, likes, comments, shares (where available)
- Engagement rate
- Click-through rate
- Audience demographics
- Best-performing content types
- Best-performing times

**AI recommendations:**
"Your product demonstration videos generated 3x more engagement than static images. Consider creating more video content."

"Your audience is most active on weekends. Schedule more posts for Saturday and Sunday."

**Implementation:**
- Analytics collector (daily cron job)
- Fetches data from platform APIs
- Stores in `post_analytics` table
- AI analyzes trends
- Generates recommendations
- Shows in dashboard

---

## What Happens Automatically vs Manually

| Activity | User Involvement |
|----------|------------------|
| Register account | ✅ Required |
| Provide business info | ✅ Required |
| Connect social accounts | ✅ Required |
| Grant platform permissions | ✅ Required |
| Generate marketing strategy | 🤖 AI automated |
| Create captions | 🤖 AI automated |
| Generate images | 🤖 AI automated |
| Generate videos | 🤖 AI automated |
| Adapt content for platforms | 🤖 AI automated |
| Validate content | 🤖 System automated |
| Approve content | 🔀 Depends on mode |
| Schedule posts | 🤖 AI or user |
| Publish posts | 🤖 Automatic (where authorized) |
| Collect analytics | 🤖 Automatic |
| Recommend improvements | 🤖 AI automated |

---

## Backend Architecture

```
┌─────────────────────────────────────────────────────┐
│          WEB APPLICATION / MOBILE APP               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│          CENTRAL BACKEND API (Node.js + Express)    │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Authentication  │  │ Business Engine │          │
│  │     Engine      │  │                 │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ AI Intelligence │  │ Creative Studio │          │
│  │     Engine      │  │     Engine      │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Publishing    │  │   Automation    │          │
│  │     Engine      │  │     Engine      │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Analytics     │  │   Advertising   │          │
│  │     Engine      │  │     Engine      │          │
│  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              INTEGRATION LAYER                       │
│                                                      │
│  Social API Adapters · AI Providers · Payments      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              EXTERNAL SERVICES                       │
│                                                      │
│  OpenAI · DALL-E · TikTok API · Instagram API       │
│  YouTube API · LinkedIn API · X API · Stripe        │
└─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│            DATA INFRASTRUCTURE                       │
│                                                      │
│  PostgreSQL · Redis · S3/CloudFlare R2              │
└─────────────────────────────────────────────────────┘
```

---

## Example: AI Autopilot Activation

User configures:
- ✅ Connected: Instagram, Facebook, TikTok, YouTube
- ✅ Business profile complete
- ✅ Brand intelligence generated
- ✅ Publishing mode: Automatic
- ✅ Settings:
  - 20 promotional posts/month
  - 12 short videos/month
  - Max 2 posts per account per day
  - No publishing without authorization
  - No paid ads without approval

**User clicks: "Activate AI Autopilot"**

**What happens:**
1. AI reviews marketing strategy
2. Creates content calendar (32 pieces)
3. Generates captions for all platforms
4. Creates promotional images
5. Generates short videos
6. Adapts content per platform
7. Validates everything
8. Schedules optimal times
9. Publishing workers auto-publish
10. Analytics collects performance
11. AI recommends improvements

**User's role:** Monitor dashboard, approve major changes, adjust strategy

---

## Implementation Priority Order

### Phase 1: Foundation ✅ DONE
- Dark theme UI
- Auth system
- Basic pages

### Phase 2: Business Setup (NEXT - 1 week)
- Business onboarding form
- Brand intelligence AI
- Database schema

### Phase 3: Publishing Engine (2 weeks)
- Background workers
- Platform adapters enhancement
- Retry logic
- Status monitoring

### Phase 4: AI Intelligence (3 weeks)
- Marketing strategy generator
- Content ideas engine
- Trend discovery
- Recommendations

### Phase 5: Creative Studio (4 weeks)
- AI image generation
- AI video generation
- Graphic design canvas
- Templates library

### Phase 6: Platform Adaptation (1 week)
- Content transformer
- Format optimizer
- Smart adaptation logic

### Phase 7: Scheduling & Automation (2 weeks)
- Drag-drop calendar
- Optimal time selection
- Campaign automation
- Workflow builder

### Phase 8: Quality & Approval (1 week)
- Validation pipeline
- Approval workflows
- Publishing modes

### Phase 9: Analytics & Learning (2 weeks)
- Performance tracking
- AI recommendations
- Continuous improvement

**Total estimated time:** 16-18 weeks for complete autonomous pipeline

---

## Critical Technical Notes

1. **Organic vs Paid:** Publishing organic posts ≠ running paid ads. Separate workflows.

2. **Token management:** Refresh tokens before expiry, handle revocation gracefully.

3. **Rate limits:** Respect platform API limits, implement exponential backoff.

4. **Multi-account:** Support multiple accounts per platform (personal + business).

5. **Platform differences:** Each platform has unique requirements, capabilities, and limitations.

6. **Verification:** Just because API returns 200 doesn't mean post is published. Verify.

7. **Media processing:** Resize, compress, convert formats before upload.

8. **Content safety:** Filter inappropriate content before publishing to avoid account bans.

9. **Audit logs:** Track every action for compliance and debugging.

10. **Cost management:** AI generation costs money. Track usage, set limits.

---

## Success Metrics

User should be able to:
1. Complete business setup in < 5 minutes
2. Connect all social accounts in < 10 minutes
3. Generate 30-day content plan in < 2 minutes
4. Activate autopilot and never manually post again
5. See all posts publishing automatically
6. Receive performance reports weekly
7. Watch business grow without manual social media management

**The ultimate test:** User sets it up once, then only checks analytics dashboard weekly to see growth.

---

This is the complete vision. Now let's build it systematically, phase by phase.
