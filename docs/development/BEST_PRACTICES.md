# Best Practices

This guide captures practical applications of our core engineering principles across development, deployment, and operations. See also: ../standards/engineering_principles.md

## Core Principles (Applied)
1. Start simple and add complexity only when needed
2. Focus on core functionality first
3. Use built-in tools before adding external services
4. Document decisions and their rationale
5. Privacy/local-first by default
6. SSOT/DRY/SoC across modules
7. Accessibility and testability are non-negotiable

## Initial Deployment Checklist
- [ ] Basic Vercel analytics enabled
- [ ] Core routes tested
- [ ] Environment variables configured
- [ ] Domain setup verified
- [ ] SSL certificates confirmed

## When to Add Additional Tools
Only add error tracking and advanced monitoring when:
1. You have actual users experiencing issues
2. The basic analytics show problems
3. You need more detailed insights than Vercel provides

## Vercel's Built-in Tools
1. **Analytics Dashboard**
   - Page views
   - Performance metrics
   - Error rates
   - Deployment history

2. **Logs**
   - Build logs
   - Runtime logs
   - Error logs

3. **Performance Monitoring**
   - Page load times
   - API response times
   - Build times

## Adding External Tools
Only consider external tools when:
1. Vercel's built-in tools are insufficient
2. You have specific needs not covered by Vercel
3. You have the capacity to maintain additional services

## Documentation
- Keep deployment documentation up to date
- Document any issues and their solutions
- Maintain a changelog
- Update environment variables documentation

## Security
1. Use environment variables for sensitive data; never commit secrets
2. Enable HTTPS and HSTS
3. Set appropriate security headers (CSP, COOP/COEP where needed)
4. Regular dependency updates and scans (SCA)
5. Encrypt user API keys at rest (AES-256-GCM); consider client-only encryption when feasible
6. No logging of sensitive content (chat text, PII)

### Environment Hygiene
- `.env.local` must not be committed. Use `.env.example` as SSOT for keys and add placeholders only.
- If an `.env.local` was tracked historically, scrub contents and remove from git history; rely on local, untracked copies going forward.

## Performance
1. Optimize images
2. Use proper caching
3. Minimize JavaScript bundles
4. Implement lazy loading
5. Prefer streaming responses for incremental UX (AI outputs)

## Maintenance
1. Regular dependency updates
2. Monitor for deprecated features
3. Keep documentation current
4. Regular security audits
5. Maintain ADRs for significant decisions

## AI/Voice Features (Applied Best Practices)
1. Private by default: do not persist private chat content server-side
2. Local-first: support local model runtimes; browser-to-localhost paths only
3. Key handling: encrypt keys at rest; avoid storing unless required; provide client-only mode where practical
4. Rate limiting: per-user where possible; never rely solely on IP in authenticated contexts
5. A11y: clear mic state, aria-labels, visible focus; keyboard and mobile-friendly
6. Testing: mock SpeechRecognition; integration tests for prefill flows; E2E happy paths
7. Feature flags: guard non-critical voices features for gradual rollout

## When to Scale
Add more sophisticated tools only when:
1. You have actual scaling needs
2. Basic tools are insufficient
3. You have the resources to maintain them
4. The benefits outweigh the costs 
