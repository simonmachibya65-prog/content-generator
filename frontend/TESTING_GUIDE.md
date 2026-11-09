# Testing & Quality Assurance Guide

## Overview

This document provides comprehensive testing procedures for the Cotents platform across devices, browsers, and accessibility requirements.

---

## 🌐 Browser Compatibility Testing

### Supported Browsers
- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

### Testing Checklist

#### Visual Rendering
- [ ] All colors display correctly
- [ ] Gradients render smoothly
- [ ] Shadows and blur effects work
- [ ] Dark mode toggles properly
- [ ] Animations run smoothly (no jank)
- [ ] Icons and emojis display correctly

#### Layout & Responsiveness
- [ ] No horizontal scrolling on mobile
- [ ] Navigation is accessible on all screen sizes
- [ ] Modals/dropdowns position correctly
- [ ] Forms are usable on touch devices
- [ ] Tables scroll horizontally on mobile

#### Functionality
- [ ] All buttons are clickable
- [ ] Forms submit correctly
- [ ] Navigation works (no broken links)
- [ ] Dropdowns open/close properly
- [ ] File uploads work
- [ ] Search functions correctly

---

## 📱 Device Testing

### Desktop Testing (1920x1080, 1366x768)
```bash
# Test in browser dev tools
# Chrome: F12 → Toggle Device Toolbar → Responsive
```

- [ ] Sidebar navigation is fully visible
- [ ] Charts render at appropriate sizes
- [ ] Multi-column layouts display correctly
- [ ] Tooltips don't overflow viewport

### Tablet Testing (iPad: 768x1024, iPad Pro: 1024x1366)
- [ ] Sidebar collapses to hamburger menu
- [ ] Touch targets are at least 44x44px
- [ ] Forms are easy to fill out
- [ ] Cards stack appropriately
- [ ] Horizontal scrolling where intended

### Mobile Testing (iPhone: 375x667, Android: 360x640)
- [ ] All content is readable without zooming
- [ ] Buttons are easily tappable
- [ ] Forms are thumb-friendly
- [ ] Navigation menu is accessible
- [ ] No content hidden behind UI elements

---

## ♿ Accessibility Testing (WCAG 2.1 AA)

### Automated Testing Tools
```bash
# Install and run accessibility checks
npm install -g pa11y
pa11y http://localhost:5173

# Or use browser extensions:
# - axe DevTools (Chrome)
# - WAVE Evaluation Tool
# - Lighthouse (Chrome DevTools)
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are focusable
- [ ] Focus order is logical (top-to-bottom, left-to-right)
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (can escape modals/menus)
- [ ] Skip to main content link works
- [ ] Dropdown menus work with keyboard

**Test Commands:**
- `Tab` - Move forward
- `Shift + Tab` - Move backward
- `Enter` - Activate buttons/links
- `Space` - Toggle checkboxes
- `Esc` - Close modals/dropdowns
- `Arrow keys` - Navigate dropdowns/lists

#### Screen Reader Testing

**VoiceOver (macOS/iOS):**
```bash
# Enable: System Preferences → Accessibility → VoiceOver
# Keyboard: Cmd + F5
```

**NVDA (Windows - Free):**
```bash
# Download from: https://www.nvaccess.org/download/
# Start: Ctrl + Alt + N
```

**JAWS (Windows - Paid):**
- Professional screen reader for comprehensive testing

**Checklist:**
- [ ] All images have alt text
- [ ] Form fields have associated labels
- [ ] Error messages are announced
- [ ] Page titles are descriptive
- [ ] Headings create logical hierarchy (h1 → h6)
- [ ] Links have descriptive text (not "click here")
- [ ] ARIA labels on icon buttons
- [ ] Dynamic content updates are announced

#### Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Large text contrast ratio ≥ 3:1 (18pt+)
- [ ] Button/link contrast meets requirements
- [ ] Placeholder text is readable
- [ ] Focus indicators have sufficient contrast
- [ ] Error messages are not color-only

**Testing Tools:**
- Chrome DevTools → Lighthouse
- WebAIM Contrast Checker
- Accessible Colors extension

#### Form Accessibility
- [ ] All inputs have visible labels
- [ ] Required fields are clearly marked
- [ ] Error messages are descriptive
- [ ] Success messages are announced
- [ ] Form validation is accessible
- [ ] Multi-step forms show progress

---

## 🔄 Functionality Testing

### Authentication Flow
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Registration with validation
- [ ] Password strength indicator works
- [ ] Forgot password link (if implemented)
- [ ] Session persistence
- [ ] Logout functionality

### Dashboard
- [ ] Stats cards load correctly
- [ ] Charts render with data
- [ ] Quick actions are functional
- [ ] Recent activity displays
- [ ] Loading states show properly
- [ ] Empty states show when no data

### Content Creation
- [ ] AI content generation works
- [ ] Form validation triggers correctly
- [ ] Character counters update
- [ ] Platform selection works
- [ ] Media upload functions
- [ ] Preview displays correctly

### Social Accounts
- [ ] Connect account flow works
- [ ] Disconnect account works
- [ ] Account status displays correctly
- [ ] Platform icons render
- [ ] Error handling for failed connections

### Publishing Queue
- [ ] Posts display with correct status
- [ ] Filtering works (all/scheduled/published)
- [ ] Edit/delete actions function
- [ ] Pagination works
- [ ] Status badges display correctly

### Analytics
- [ ] Charts load with data
- [ ] Date range picker works
- [ ] Platform filter functions
- [ ] Export button works (if implemented)
- [ ] Metrics calculate correctly

### Settings
- [ ] Profile update works
- [ ] Avatar upload works
- [ ] Preference changes save
- [ ] Theme toggle persists
- [ ] Danger zone actions require confirmation

---

## ⚡ Performance Testing

### Load Time Benchmarks
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.9s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

**Testing Tools:**
```bash
# Lighthouse in Chrome DevTools
# Performance tab → Reload

# WebPageTest
# https://www.webpagetest.org/
```

### Bundle Size
```bash
npm run build
npx vite-bundle-visualizer

# Target: Main bundle < 250KB gzipped
```

### Network Conditions
Test on throttled connections:
- [ ] Fast 3G (750ms RTT, 1.5Mbps down)
- [ ] Slow 3G (2000ms RTT, 400Kbps down)
- [ ] Offline (service worker if implemented)

---

## 🐛 Error Handling Testing

### Error Scenarios
- [ ] Network disconnection
- [ ] API timeout
- [ ] 401 Unauthorized (redirect to login)
- [ ] 403 Forbidden (show error)
- [ ] 404 Not Found
- [ ] 500 Server Error
- [ ] Invalid form submissions
- [ ] File upload failures
- [ ] Session expiration

### Error Boundary Testing
```javascript
// Trigger React Error Boundary
// Add to any component temporarily:
throw new Error('Test error boundary');
```

- [ ] Error boundary catches errors
- [ ] User sees friendly error message
- [ ] "Try Again" button works
- [ ] "Go Home" button works
- [ ] Console logs error (dev mode)

---

## 🎨 UI/UX Testing

### Visual Regression
- [ ] Components match design system
- [ ] Spacing is consistent
- [ ] Typography hierarchy is correct
- [ ] Colors match brand guidelines
- [ ] Hover states are smooth
- [ ] Active states are clear

### Interaction Testing
- [ ] Buttons provide visual feedback
- [ ] Forms show validation immediately
- [ ] Toasts appear and dismiss
- [ ] Modals open/close smoothly
- [ ] Dropdowns position correctly
- [ ] Loading spinners appear for async actions

### Animation Testing
- [ ] Animations run smoothly (60fps)
- [ ] No animation jank on low-end devices
- [ ] Respect `prefers-reduced-motion`
- [ ] Transitions are purposeful
- [ ] Skeleton loaders display while loading

---

## 🔐 Security Testing

### Client-Side Security
- [ ] No sensitive data in localStorage
- [ ] Tokens are stored securely
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection on forms
- [ ] No credentials in source code
- [ ] No console errors revealing secrets

### Testing Commands
```bash
# Check for exposed secrets
grep -r "VITE_.*=" .env*

# Scan dependencies for vulnerabilities
npm audit
npm audit fix
```

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] ESLint errors resolved
- [ ] Build completes without warnings
- [ ] TypeScript errors fixed (if applicable)

### Environment
- [ ] Environment variables set correctly
- [ ] API URLs point to production
- [ ] Analytics/tracking configured
- [ ] Error reporting configured (Sentry, etc.)

### Final Tests
- [ ] Test all critical user flows
- [ ] Verify dark mode works everywhere
- [ ] Check mobile responsiveness
- [ ] Run Lighthouse audit (score >90)
- [ ] Test with screen reader
- [ ] Verify keyboard navigation
- [ ] Check all external links open correctly

---

## 🚀 Testing Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview

# Lint code
npm run lint

# Type check (if using TypeScript)
npm run type-check
```

---

## 📝 Bug Reporting Template

```markdown
**Bug Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Device: [e.g., iPhone 14]
- Screen Size: [e.g., 375x667]

**Console Errors:**
[Paste any console errors]

**Additional Context:**
Any other relevant information
```

---

## ✅ Testing Sign-Off

Before marking testing complete, ensure:
- [ ] All automated tests pass
- [ ] Manual testing completed on 3+ browsers
- [ ] Mobile testing completed on 2+ devices
- [ ] Keyboard navigation verified
- [ ] Screen reader testing completed
- [ ] Performance benchmarks met
- [ ] No critical bugs remaining
- [ ] Accessibility score >90 (Lighthouse)

---

## 📚 Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Keyboard Accessibility](https://webaim.org/articles/keyboard/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
