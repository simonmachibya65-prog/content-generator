---
name: "Creative Studio Specification"
description: "Complete AI Creative Studio - one request produces full professional advertisement"
inclusion: manual
---

# Complete AI Creative Studio Workflow

## Vision
Customer enters ONE request → receives complete professional advertisement with:
- Written content (headlines, captions, scripts, hashtags)
- Images (posters, product shots, banners)
- Videos (scenes, reels, shorts, commercials)
- Voiceovers (male/female, multi-language)
- Background music & sound effects
- Subtitles/captions
- Platform-specific versions (Instagram, TikTok, YouTube, Facebook)
- Ready to publish

## 12-Step Workflow

1. Create new project (category selection)
2. Enter project info (product, brand, audience, objective)
3. AI develops creative strategy (OpenAI brief)
4. Generate written content (captions, scripts, headlines)
5. Generate images (GPT Image / Gemini)
6. Generate videos (Veo / Runway)
7. Generate voiceovers & audio (ElevenLabs / OpenAI TTS)
8. Automatic video production (FFmpeg + Remotion)
9. Quality control (brand, resolution, specs)
10. Final Creative Workspace (preview, edit, approve)
11. Platform-specific adaptation (per-channel versions)
12. Publish automatically

## Creation Categories
- Social Media Content (posts, carousels, stories)
- Image Advertisements (posters, banners, flyers)
- Video Advertisements (commercials, reels, shorts)
- Product Marketing (product promotions & launches)
- Business Marketing (corporate & brand campaigns)
- Educational Content (tutorials & explainers)
- Custom Creation (user-defined)

## Model Router
- Text: OpenAI GPT-4o
- Images: GPT-Image-1 → Gemini fallback → DALL-E-3 fallback
- Video: Google Veo → Runway ML fallback
- Voice: ElevenLabs → OpenAI TTS fallback
- Music: Licensed tracks from library

## Key Feature: One-Click Complete Ad
Single input → full campaign output:
- Marketing strategy & concept
- Ad script & captions
- Promotional images (4 variations)
- Video scenes (assembled)
- Voiceover + subtitles
- Edited final video
- Social media versions (IG/TikTok/YouTube/FB)

## Technical Engines
| Engine | Responsibility |
|--------|---------------|
| Creative Project Engine | Manages projects & requests |
| AI Intelligence Engine | OpenAI orchestration & brief |
| Model Router | Best provider selection |
| Text Generation Engine | Marketing copy |
| Image Generation Engine | Images + editing |
| Video Generation Engine | Scene generation |
| Audio Engine | Voices, music, SFX |
| Media Production Engine | FFmpeg + Remotion assembly |
| Quality Control Engine | Validates assets |
| Platform Adaptation Engine | Channel-specific versions |
| Media Library Engine | Asset storage |
| Publishing Engine | Schedule & publish |

## Independent Editability Principle
Every generated asset must be independently editable:
- Replace one image without regenerating all
- Re-record one voiceover scene only
- Edit one video scene without regenerating
- Update caption for one platform only

## Backend Job Flow (async)
Planning → Generating text → Generating images → Generating video → Adding audio → Editing → Quality checking → Ready for review

## Database
- creative_projects (project metadata)
- creative_briefs (AI-generated strategy)
- project_assets (all generated assets with type, status, url)
- project_versions (platform-specific versions)
- production_jobs (async job tracking with progress)

## Status: TO BUILD (Phase 5 replacement)
