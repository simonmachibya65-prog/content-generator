-- ============================================================
-- COTENTS DATABASE SCHEMA
-- AI Social Media Management Platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  avatar_url      TEXT,
  timezone        VARCHAR(100) DEFAULT 'Africa/Dar_es_Salaam',
  language        VARCHAR(10) DEFAULT 'en',
  plan            VARCHAR(50) DEFAULT 'free',
  ai_credits      INTEGER DEFAULT 10,
  ai_credits_used INTEGER DEFAULT 0,
  email_verified  BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── SOCIAL PLATFORMS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_platforms (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(50) UNIQUE NOT NULL,  -- tiktok, youtube, x, instagram, facebook, linkedin
  display_name VARCHAR(100) NOT NULL,
  icon_url     TEXT,
  color        VARCHAR(7),
  features     JSONB DEFAULT '{}',           -- {text, images, videos, stories, reels}
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─── SOCIAL ACCOUNTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id     UUID NOT NULL REFERENCES social_platforms(id),
  platform_name   VARCHAR(50) NOT NULL,
  account_id      VARCHAR(255) NOT NULL,      -- platform's user/channel ID
  username        VARCHAR(255),
  display_name    VARCHAR(255),
  profile_url     TEXT,
  avatar_url      TEXT,
  followers_count INTEGER DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'connected', -- connected, expired, error, disconnected
  connected_at    TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP,
  last_synced_at  TIMESTAMP,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform_name, account_id)
);

-- ─── OAUTH TOKENS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  access_token      TEXT NOT NULL,            -- encrypted
  refresh_token     TEXT,                     -- encrypted
  token_type        VARCHAR(50) DEFAULT 'Bearer',
  scope             TEXT,
  expires_at        TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── OAUTH STATES (PKCE/state validation) ────────────────────
CREATE TABLE IF NOT EXISTS oauth_states (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform     VARCHAR(50) NOT NULL,
  state        VARCHAR(255) NOT NULL UNIQUE,
  code_verifier TEXT,                         -- for PKCE
  redirect_uri TEXT,
  expires_at   TIMESTAMP NOT NULL,
  used         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─── MEDIA LIBRARY ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_files (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_type    VARCHAR(50),                   -- image, video, document
  mime_type    VARCHAR(100),
  file_size    BIGINT,
  file_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  width        INTEGER,
  height       INTEGER,
  duration     FLOAT,                         -- for videos (seconds)
  folder       VARCHAR(255) DEFAULT 'root',
  tags         TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── CONTENT POSTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id     UUID,                       -- FK added below
  title           VARCHAR(500),
  content_text    TEXT,
  hashtags        TEXT[] DEFAULT '{}',
  media_ids       UUID[] DEFAULT '{}',
  platform_data   JSONB DEFAULT '{}',         -- per-platform customized content
  status          VARCHAR(30) DEFAULT 'draft', -- draft, scheduled, published, failed, cancelled
  scheduled_at    TIMESTAMP,
  published_at    TIMESTAMP,
  ai_generated    BOOLEAN DEFAULT FALSE,
  ai_prompt       TEXT,
  tone            VARCHAR(50),
  language        VARCHAR(10) DEFAULT 'en',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── PUBLISHING JOBS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publishing_jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  platform_name     VARCHAR(50) NOT NULL,
  status            VARCHAR(30) DEFAULT 'pending', -- pending, processing, published, failed, cancelled
  scheduled_at      TIMESTAMP,
  published_at      TIMESTAMP,
  platform_post_id  VARCHAR(255),             -- ID returned by platform after publishing
  platform_post_url TEXT,
  retry_count       INTEGER DEFAULT 0,
  next_retry_at     TIMESTAMP,
  error_message     TEXT,
  response_data     JSONB DEFAULT '{}',
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── PUBLISHING LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publishing_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publishing_job_id UUID NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  level           VARCHAR(20) NOT NULL,       -- info, error, warning
  message         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── CAMPAIGNS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  niche             VARCHAR(255),
  brand_voice       TEXT,
  target_audience   TEXT,
  platforms         TEXT[] DEFAULT '{}',      -- ['tiktok', 'youtube', 'instagram']
  social_account_ids UUID[] DEFAULT '{}',
  content_types     TEXT[] DEFAULT '{}',      -- ['video', 'image', 'text']
  posting_frequency JSONB DEFAULT '{}',       -- {daily: 2, times: ['09:00', '18:00']}
  language          VARCHAR(10) DEFAULT 'en',
  tone              VARCHAR(50) DEFAULT 'professional',
  status            VARCHAR(20) DEFAULT 'active', -- active, paused, completed, draft
  auto_publish      BOOLEAN DEFAULT FALSE,
  start_date        DATE,
  end_date          DATE,
  posts_generated   INTEGER DEFAULT 0,
  posts_published   INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- Add campaign FK to posts
ALTER TABLE posts ADD CONSTRAINT fk_posts_campaign
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- ─── ANALYTICS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_analytics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publishing_job_id UUID NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id),
  platform_name     VARCHAR(50) NOT NULL,
  platform_post_id  VARCHAR(255),
  views             BIGINT DEFAULT 0,
  likes             BIGINT DEFAULT 0,
  comments          BIGINT DEFAULT 0,
  shares            BIGINT DEFAULT 0,
  saves             BIGINT DEFAULT 0,
  clicks            BIGINT DEFAULT 0,
  reach             BIGINT DEFAULT 0,
  impressions       BIGINT DEFAULT 0,
  engagement_rate   FLOAT DEFAULT 0,
  synced_at         TIMESTAMP DEFAULT NOW(),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ─── ACCOUNT ANALYTICS (follower growth) ─────────────────────
CREATE TABLE IF NOT EXISTS account_analytics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  followers_count   BIGINT DEFAULT 0,
  following_count   BIGINT DEFAULT 0,
  posts_count       BIGINT DEFAULT 0,
  recorded_at       DATE DEFAULT CURRENT_DATE,
  UNIQUE(social_account_id, recorded_at)
);

-- ─── TEAM MEMBERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(50) DEFAULT 'editor',    -- admin, editor, viewer
  status     VARCHAR(20) DEFAULT 'pending',   -- pending, active, removed
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at  TIMESTAMP,
  UNIQUE(owner_id, member_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,           -- post_published, post_failed, account_expired, etc.
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── SUBSCRIPTION / BILLING ──────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                 VARCHAR(50) NOT NULL,
  stripe_customer_id   VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status               VARCHAR(50) DEFAULT 'active', -- active, cancelled, past_due, trialing
  current_period_start TIMESTAMP,
  current_period_end   TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  amount               DECIMAL(10,2),
  currency             VARCHAR(10) DEFAULT 'USD',
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform_name);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_status ON publishing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_scheduled ON publishing_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);

-- ─── SEED PLATFORMS ──────────────────────────────────────────
INSERT INTO social_platforms (name, display_name, color, features) VALUES
  ('tiktok',    'TikTok',    '#000000', '{"videos": true, "images": true, "text": false}'),
  ('youtube',   'YouTube',   '#FF0000', '{"videos": true, "shorts": true, "text": false}'),
  ('x',         'X',         '#000000', '{"text": true, "images": true, "videos": true}'),
  ('instagram', 'Instagram', '#E1306C', '{"images": true, "reels": true, "stories": true, "text": true}'),
  ('facebook',  'Facebook',  '#1877F2', '{"text": true, "images": true, "videos": true}'),
  ('linkedin',  'LinkedIn',  '#0A66C2', '{"text": true, "images": true, "videos": true}')
ON CONFLICT (name) DO NOTHING;


-- ─── BUSINESS PROFILES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_profiles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name        VARCHAR(255) NOT NULL,
  business_description TEXT,
  industry             VARCHAR(100),
  products             TEXT,
  services             TEXT,
  target_audience      JSONB DEFAULT '{}',
  target_location      VARCHAR(255),
  website              VARCHAR(255),
  marketing_goals      JSONB DEFAULT '[]',
  preferred_languages  TEXT[] DEFAULT '{en}',
  brand_logo_url       TEXT,
  brand_colors         JSONB DEFAULT '{}',   -- {primary, secondary, accent}
  brand_fonts          JSONB DEFAULT '{}',   -- {heading, body}
  contact_info         JSONB DEFAULT '{}',
  promotional_offers   TEXT,
  setup_completed      BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── BRAND INTELLIGENCE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_intelligence (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id  UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  brand_identity       TEXT,
  brand_voice          TEXT,
  tone_guidelines      JSONB DEFAULT '{}',
  content_themes       JSONB DEFAULT '[]',
  target_personas      JSONB DEFAULT '[]',
  visual_guidelines    JSONB DEFAULT '{}',
  marketing_strategy   TEXT,
  content_pillars      JSONB DEFAULT '[]',
  posting_strategy     JSONB DEFAULT '{}',
  ai_model             VARCHAR(50),
  generated_at         TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_profile_id)
);

-- ─── MARKETING STRATEGIES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_strategies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id),
  name                VARCHAR(255),
  strategy_data       JSONB NOT NULL,
  months              INTEGER DEFAULT 1,
  status              VARCHAR(20) DEFAULT 'draft', -- draft, approved, active, archived
  generated_at        TIMESTAMP DEFAULT NOW(),
  approved_at         TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- ─── Add has_business_profile to users ───────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_business_profile BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_business_profiles_user ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_intelligence_profile ON brand_intelligence(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_marketing_strategies_user ON marketing_strategies(user_id);

-- ─── PUBLISHING MODES (per account) ──────────────────────────
CREATE TABLE IF NOT EXISTS publishing_modes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  mode              VARCHAR(20) DEFAULT 'auto', -- auto, approval, manual
  max_posts_per_day INTEGER DEFAULT 3,
  allowed_hours     TEXT[] DEFAULT ARRAY['00:00-23:59'],
  updated_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, social_account_id)
);

-- ─── WORKFLOWS (automation) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL, -- schedule, event, performance, rss, webhook
  trigger_config JSONB DEFAULT '{}',
  conditions  JSONB DEFAULT '[]',
  actions     JSONB DEFAULT '[]',
  status      VARCHAR(20) DEFAULT 'active', -- active, paused, draft
  last_run_at TIMESTAMP,
  run_count   INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ─── AUTOPILOT SETTINGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS autopilot_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_enabled          BOOLEAN DEFAULT FALSE,
  posts_per_month     INTEGER DEFAULT 20,
  videos_per_month    INTEGER DEFAULT 10,
  max_posts_per_day   INTEGER DEFAULT 2,
  publishing_mode     VARCHAR(20) DEFAULT 'auto',
  platforms           TEXT[] DEFAULT '{}',
  social_account_ids  UUID[] DEFAULT '{}',
  auto_approve        BOOLEAN DEFAULT TRUE,
  content_language    VARCHAR(10) DEFAULT 'en',
  content_tone        VARCHAR(50) DEFAULT 'professional',
  pause_on_errors     BOOLEAN DEFAULT TRUE,
  pause_for_holidays  BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── Add next_retry_at to publishing_jobs ─────────────────────
ALTER TABLE publishing_jobs ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;
ALTER TABLE publishing_jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_publishing_modes_user ON publishing_modes(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_next_retry ON publishing_jobs(next_retry_at) WHERE status = 'pending';

-- ─── CREATIVE PROJECTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS creative_projects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  category          VARCHAR(100) NOT NULL,  -- social_media, image_ad, video_ad, product, business, educational, custom
  status            VARCHAR(30) DEFAULT 'draft', -- draft, planning, generating, editing, ready, published, archived
  progress          INTEGER DEFAULT 0,       -- 0-100
  current_step      VARCHAR(100),            -- planning|text|images|video|audio|editing|quality|ready
  -- Project input
  business_name     VARCHAR(255),
  product_service   VARCHAR(255),
  description       TEXT,
  objective         VARCHAR(100),           -- awareness, sales, leads, engagement
  target_audience   TEXT,
  country           VARCHAR(100),
  language          VARCHAR(10) DEFAULT 'en',
  platforms         TEXT[] DEFAULT '{}',    -- ['instagram','tiktok','youtube']
  special_instructions TEXT,
  brand_colors      JSONB DEFAULT '{}',
  brand_logo_url    TEXT,
  -- Output settings
  ad_duration       INTEGER DEFAULT 30,     -- seconds
  output_formats    JSONB DEFAULT '[]',     -- [{platform, aspect_ratio, resolution}]
  -- Metadata
  thumbnail_url     TEXT,
  error_message     TEXT,
  ai_credits_used   INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── CREATIVE BRIEFS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creative_briefs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES creative_projects(id) ON DELETE CASCADE,
  -- AI-generated strategy
  objective         TEXT,
  target_audience   TEXT,
  key_message       TEXT,
  creative_concept  TEXT,
  headline          TEXT,
  tagline           TEXT,
  cta               TEXT,
  -- Generation instructions
  image_prompt      TEXT,
  image_style       VARCHAR(100),
  video_script      TEXT,
  video_scenes      JSONB DEFAULT '[]',  -- [{scene, duration, description, visual}]
  voiceover_script  TEXT,
  -- Platform recommendations
  platform_notes    JSONB DEFAULT '{}',
  -- Hashtags
  hashtags          TEXT[] DEFAULT '{}',
  -- Status
  approved          BOOLEAN DEFAULT FALSE,
  approved_at       TIMESTAMP,
  ai_model          VARCHAR(50) DEFAULT 'gpt-4o',
  generated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id)
);

-- ─── PROJECT ASSETS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_assets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES creative_projects(id) ON DELETE CASCADE,
  asset_type        VARCHAR(50) NOT NULL,  -- text, image, video_scene, voiceover, music, final_video, thumbnail
  asset_subtype     VARCHAR(50),           -- headline, caption, script, poster, banner, scene_1, etc.
  status            VARCHAR(20) DEFAULT 'pending', -- pending, generating, ready, failed, approved, replaced
  -- Content
  content_text      TEXT,                 -- for text assets
  file_url          TEXT,                 -- for media assets
  thumbnail_url     TEXT,
  file_size         BIGINT,
  duration          FLOAT,               -- seconds, for audio/video
  dimensions        JSONB,               -- {width, height}
  -- Generation metadata
  ai_provider       VARCHAR(50),          -- openai, gemini, veo, runway, elevenlabs
  ai_model          VARCHAR(100),
  generation_prompt TEXT,
  generation_params JSONB DEFAULT '{}',
  -- Editing
  is_edited         BOOLEAN DEFAULT FALSE,
  edited_url        TEXT,
  -- Platform
  platform          VARCHAR(50),          -- if platform-specific
  aspect_ratio      VARCHAR(20),          -- 1:1, 9:16, 16:9
  -- Order
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── PRODUCTION JOBS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS production_jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES creative_projects(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id),
  job_type          VARCHAR(50) NOT NULL,  -- full_production, text, images, video, audio, assemble, adapt
  status            VARCHAR(20) DEFAULT 'queued', -- queued, running, completed, failed
  progress          INTEGER DEFAULT 0,
  current_step      TEXT,
  result            JSONB DEFAULT '{}',
  error             TEXT,
  started_at        TIMESTAMP,
  completed_at      TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ─── PLATFORM VERSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_versions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES creative_projects(id) ON DELETE CASCADE,
  platform          VARCHAR(50) NOT NULL,  -- instagram, tiktok, youtube, facebook, x, linkedin
  format            VARCHAR(50),           -- reel, story, post, short, video
  aspect_ratio      VARCHAR(20),           -- 9:16, 1:1, 16:9
  resolution        VARCHAR(20),           -- 1080x1920, 1080x1080
  video_url         TEXT,
  image_url         TEXT,
  caption           TEXT,
  hashtags          TEXT[],
  duration          FLOAT,
  status            VARCHAR(20) DEFAULT 'generating',
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_creative_projects_user ON creative_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_projects_status ON creative_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_project ON production_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status);


-- ─────────────────────────────────────────────────────────────
-- PHASE 6: ADVERTISING MODULE
-- ─────────────────────────────────────────────────────────────

-- ─── AD PLATFORMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_platforms (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(50) UNIQUE NOT NULL, -- meta_ads, tiktok_ads, google_ads, linkedin_ads
  display_name   VARCHAR(100) NOT NULL,
  supported_objectives TEXT[] DEFAULT '{}',   -- ['awareness', 'traffic', 'conversions', 'leads']
  supported_formats TEXT[] DEFAULT '{}',      -- ['image', 'video', 'carousel', 'collection']
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─── AD CAMPAIGNS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform          VARCHAR(50) NOT NULL,     -- meta_ads, tiktok_ads, google_ads
  platform_campaign_id VARCHAR(255),          -- ID from ad platform API
  name              VARCHAR(255) NOT NULL,
  objective         VARCHAR(100) NOT NULL,    -- awareness, traffic, engagement, conversions, leads, sales
  status            VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed, archived
  -- Budget
  budget_type       VARCHAR(20),              -- daily, lifetime
  budget_amount     DECIMAL(10,2),
  currency          VARCHAR(10) DEFAULT 'USD',
  spent_amount      DECIMAL(10,2) DEFAULT 0,
  -- Schedule
  start_date        DATE,
  end_date          DATE,
  -- Target
  target_locations  TEXT[] DEFAULT '{}',
  target_age_min    INTEGER,
  target_age_max    INTEGER,
  target_genders    TEXT[] DEFAULT '{}',      -- ['male', 'female', 'all']
  target_interests  TEXT[] DEFAULT '{}',
  target_behaviors  TEXT[] DEFAULT '{}',
  target_languages  TEXT[] DEFAULT '{}',
  -- Performance
  impressions       BIGINT DEFAULT 0,
  clicks            BIGINT DEFAULT 0,
  conversions       INTEGER DEFAULT 0,
  ctr               FLOAT DEFAULT 0,          -- click-through rate
  cpc               DECIMAL(10,4) DEFAULT 0,  -- cost per click
  cpm               DECIMAL(10,4) DEFAULT 0,  -- cost per mille (1000 impressions)
  cpa               DECIMAL(10,4) DEFAULT 0,  -- cost per acquisition
  roas              FLOAT DEFAULT 0,          -- return on ad spend
  -- Metadata
  last_synced_at    TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── AD SETS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_sets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_campaign_id    UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  platform_ad_set_id VARCHAR(255),            -- ID from platform
  name              VARCHAR(255) NOT NULL,
  status            VARCHAR(20) DEFAULT 'active',
  -- Budget (can override campaign budget)
  budget_type       VARCHAR(20),
  budget_amount     DECIMAL(10,2),
  -- Schedule
  start_time        TIMESTAMP,
  end_time          TIMESTAMP,
  -- Targeting (can override campaign targeting)
  targeting         JSONB DEFAULT '{}',
  -- Optimization
  optimization_goal VARCHAR(100),            -- impressions, link_clicks, conversions, landing_page_views
  bid_strategy      VARCHAR(50),             -- lowest_cost, cost_cap, bid_cap
  bid_amount        DECIMAL(10,4),
  -- Performance
  impressions       BIGINT DEFAULT 0,
  clicks            BIGINT DEFAULT 0,
  spent_amount      DECIMAL(10,2) DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── ADVERTISEMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_set_id         UUID NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
  platform_ad_id    VARCHAR(255),             -- ID from platform
  name              VARCHAR(255) NOT NULL,
  format            VARCHAR(50) NOT NULL,     -- image, video, carousel, collection, stories
  status            VARCHAR(20) DEFAULT 'active', -- active, paused, review, rejected, archived
  -- Creative content
  headline          VARCHAR(255),
  primary_text      TEXT,
  description       TEXT,
  cta_type          VARCHAR(50),              -- learn_more, shop_now, sign_up, download, contact_us
  cta_url           TEXT,
  media_ids         UUID[] DEFAULT '{}',      -- references media_files
  thumbnail_url     TEXT,
  -- A/B Testing
  is_variant        BOOLEAN DEFAULT FALSE,
  parent_ad_id      UUID REFERENCES advertisements(id),
  variant_name      VARCHAR(50),              -- A, B, C, etc.
  -- Performance
  impressions       BIGINT DEFAULT 0,
  clicks            BIGINT DEFAULT 0,
  conversions       INTEGER DEFAULT 0,
  spent_amount      DECIMAL(10,2) DEFAULT 0,
  ctr               FLOAT DEFAULT 0,
  cpc               DECIMAL(10,4) DEFAULT 0,
  cpm               DECIMAL(10,4) DEFAULT 0,
  cpa               DECIMAL(10,4) DEFAULT 0,
  -- Metadata
  review_status     VARCHAR(50),              -- pending, approved, rejected
  rejection_reason  TEXT,
  last_synced_at    TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── AD PERFORMANCE LOGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_performance_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertisement_id  UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  recorded_at       TIMESTAMP DEFAULT NOW(),
  impressions       BIGINT DEFAULT 0,
  clicks            BIGINT DEFAULT 0,
  conversions       INTEGER DEFAULT 0,
  spent_amount      DECIMAL(10,2) DEFAULT 0,
  ctr               FLOAT DEFAULT 0,
  cpc               DECIMAL(10,4) DEFAULT 0,
  cpm               DECIMAL(10,4) DEFAULT 0,
  cpa               DECIMAL(10,4) DEFAULT 0
);

-- ─── A/B TEST RESULTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ab_test_results (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_ad_id      UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  test_name         VARCHAR(255),
  variants          JSONB DEFAULT '[]',       -- [{ad_id, variant_name, impressions, clicks, conversions}]
  winning_variant   UUID REFERENCES advertisements(id),
  confidence_score  FLOAT,                    -- 0-1
  status            VARCHAR(20) DEFAULT 'running', -- running, completed, inconclusive
  started_at        TIMESTAMP DEFAULT NOW(),
  completed_at      TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ─── BUDGET ALERTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_alerts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_campaign_id    UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  alert_type        VARCHAR(50) NOT NULL,     -- budget_85_percent, budget_100_percent, cpa_high, roas_low
  threshold         DECIMAL(10,2),
  current_value     DECIMAL(10,2),
  message           TEXT,
  is_read           BOOLEAN DEFAULT FALSE,
  triggered_at      TIMESTAMP DEFAULT NOW()
);

-- ─── AD ACCOUNT CREDENTIALS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_account_credentials (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform          VARCHAR(50) NOT NULL,
  account_id        VARCHAR(255) NOT NULL,     -- platform account ID
  account_name      VARCHAR(255),
  access_token      TEXT,                      -- encrypted
  refresh_token     TEXT,                      -- encrypted
  business_id       VARCHAR(255),              -- for Meta Business Manager
  status            VARCHAR(20) DEFAULT 'connected',
  expires_at        TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- ─── MONTHLY AD BUDGETS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_ad_budgets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month             DATE NOT NULL,            -- first day of month
  total_budget      DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(10) DEFAULT 'USD',
  -- Platform allocation
  platform_budgets  JSONB DEFAULT '{}',       -- {meta_ads: 500, tiktok_ads: 300, google_ads: 200}
  -- Tracking
  spent_amount      DECIMAL(10,2) DEFAULT 0,
  remaining_amount  DECIMAL(10,2),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user ON ad_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign ON ad_sets(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_ad_set ON advertisements(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_parent ON advertisements(parent_ad_id) WHERE is_variant = TRUE;
CREATE INDEX IF NOT EXISTS idx_ad_performance_logs_ad ON ad_performance_logs(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_unread ON budget_alerts(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_monthly_ad_budgets_user ON monthly_ad_budgets(user_id);

-- ─── SEED AD PLATFORMS ───────────────────────────────────────
INSERT INTO ad_platforms (name, display_name, supported_objectives, supported_formats) VALUES
  ('meta_ads', 'Meta Ads (Facebook & Instagram)', 
   ARRAY['awareness', 'traffic', 'engagement', 'leads', 'conversions', 'sales'],
   ARRAY['image', 'video', 'carousel', 'collection', 'stories']),
  ('tiktok_ads', 'TikTok Ads',
   ARRAY['awareness', 'traffic', 'conversions', 'app_installs'],
   ARRAY['video', 'image', 'spark_ads']),
  ('google_ads', 'Google Ads',
   ARRAY['search', 'display', 'video', 'shopping', 'app_promotion'],
   ARRAY['text', 'image', 'video', 'responsive']),
  ('linkedin_ads', 'LinkedIn Ads',
   ARRAY['awareness', 'consideration', 'conversions'],
   ARRAY['image', 'video', 'carousel', 'text'])
ON CONFLICT (name) DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────────────
-- Competitors Table (for competitor tracking in AI Intelligence)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitors (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  url TEXT,
  followers_estimate INTEGER DEFAULT 0,
  last_post_date TIMESTAMP,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  content_frequency VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_competitors_user ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_platform ON competitors(platform);

-- ──────────────────────────────────────────────────────────────────────────────
-- A/B Tests Table
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ab_tests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  platform VARCHAR(50),
  test_type VARCHAR(50) NOT NULL, -- 'caption', 'image', 'time', 'hashtags'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  winner VARCHAR(10), -- 'A', 'B', or NULL
  results JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

-- ──────────────────────────────────────────────────────────────────────────────
-- Content Approval Workflow Table
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_approvals (
  id SERIAL PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'changes_requested'
  feedback TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_approvals_post ON content_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON content_approvals(status);
CREATE INDEX IF NOT EXISTS idx_content_approvals_approver ON content_approvals(approver_id);
