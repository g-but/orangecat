# Blog Tagging Strategy

## Overview
Consistent tagging is crucial for our blog's discoverability and user experience. This document defines our standardized tag categories and naming conventions.

## Core Tag Categories

### 1. **Primary Topics** (Main subject matter)
- `Security` - Security features, audits, vulnerability fixes
- `Building in Public` - Transparency, development process, behind-the-scenes
- `Platform Updates` - Feature releases, improvements, announcements
- `Bitcoin Education` - Educational content about Bitcoin
- `Community` - Community building, user stories, ecosystem
- `Development` - Technical development topics
- `Fundraising` - Crowdfunding strategies, success stories

### 2. **Content Types** (Format/approach)
- `Tutorial` - Step-by-step guides
- `Case Study` - Real examples and analysis
- `Technical Deep Dive` - Advanced technical content
- `Announcement` - Official announcements
- `Opinion` - Editorial and opinion pieces

### 3. **Security Specific** (For security-related content)
- `Anti-Fraud` - Fraud prevention measures
- `User Safety` - User protection features
- `Transparency` - Security transparency initiatives
- `Audit Results` - Security audit findings

### 4. **Technical Specific** (For technical content)
- `API` - API-related content
- `Performance` - Performance improvements
- `Architecture` - System architecture topics

## Tagging Rules

### Do's ✅
- Use **3-5 tags maximum** per post
- Always include one **Primary Topic** tag
- Use title case for all tags (`Building in Public`, not `building in public`)
- Be specific but not overly granular
- Keep tags focused on what users would want to filter by

### Don'ts ❌
- Don't create tags for one-off topics
- Don't use abbreviations unless widely known (`API` is OK, `OC` is not)
- Don't duplicate meaning (`Security` and `Safety` overlap)
- Don't use very long tag names (max 3 words)

## Current Tag Inventory

### Security Content
- `Security`
- `Building in Public` 
- `Anti-Fraud`
- `User Safety`
- `Transparency`
- `Platform Updates`

### Future Planned Tags
- `Bitcoin Education`
- `Community`
- `Tutorial`
- `Case Study`
- `Technical Deep Dive`
- `Fundraising`

## Tag Assignment Examples

### Security-focused posts:
- Primary: `Security`
- Secondary: `Building in Public`, `Anti-Fraud`, `User Safety`

### Development posts:
- Primary: `Development`
- Secondary: `Building in Public`, `Technical Deep Dive`

### Educational posts:
- Primary: `Bitcoin Education`
- Secondary: `Tutorial`, `Community`

## Review Process

1. **Before publishing**: Verify tags match this strategy
2. **Monthly review**: Analyze tag usage and adjust strategy if needed
3. **New tag requests**: Must be approved and added to this document

## Implementation

When writing new blog posts, use this frontmatter template:

```yaml
---
title: "Your Post Title"
excerpt: "Brief description of the post"
date: "2025-06-04"
tags: ["Primary Topic", "Secondary Topic", "Content Type"]
featured: false
author: "Author Name"
published: true
---
```

Remember: Tags should serve our readers, not just our organization. Think about what categories users would want to filter by. 