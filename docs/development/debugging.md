# 🐛 OrangeCat Debugging Guide

**Comprehensive guide to debugging OrangeCat applications, from development to production.**

## 🎯 Debugging Philosophy

**"Debug with purpose"** - Every debugging session should have a clear goal and systematic approach.

## 🔍 Debugging Workflow

### 1. **Identify the Problem**
- **Reproduce consistently** - Can you make it happen every time?
- **Isolate variables** - What changed recently?
- **Gather context** - Error messages, stack traces, user reports

### 2. **Choose Your Tools**
- **Browser DevTools** - Frontend issues
- **Server Logs** - Backend problems
- **Database Tools** - Data issues
- **Network Tools** - API problems

### 3. **Systematic Investigation**
- **Binary search** - Isolate the problematic component
- **Hypothesis testing** - Form and test theories
- **Root cause analysis** - Find the underlying issue

### 4. **Implement & Verify**
- **Fix the issue** - Implement the solution
- **Test thoroughly** - Ensure fix works and doesn't break anything
- **Document findings** - Help future debugging

## 🛠️ Development Debugging Tools

### Browser DevTools (Frontend)

#### Console Tab
```javascript
// Check for errors
console.error('Debug message');

// Log variables
console.log('User data:', userData);

// Monitor performance
console.time('Operation');
someOperation();
console.timeEnd('Operation');
```

#### Network Tab
- Monitor API requests and responses
- Check response times and status codes
- Inspect request headers and payloads

#### Application Tab (React DevTools)
- Inspect component state and props
- Monitor component lifecycle
- Check for unnecessary re-renders

#### Performance Tab
- Record performance profiles
- Identify slow operations
- Check memory usage

### VS Code Debugging

#### Breakpoints
```typescript
// Set breakpoint on line
const user = await getUser(id); // ← Set breakpoint here

// Conditional breakpoints
if (user.email === 'test@example.com') {
  debugger; // ← Break only for specific condition
}
```

#### Debug Console
```javascript
// Execute code in debug context
user.email
user.profile.verified
```

### Node.js Debugging

#### Built-in Debugger
```bash
# Start with debugging
node --inspect-brk scripts/debug-script.js

# Connect with Chrome DevTools
# Go to chrome://inspect
```

#### VS Code Node.js Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Current File",
      "type": "node",
      "request": "launch",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## 🗄️ Database Debugging

### Supabase Dashboard
1. **Go to your project** - supabase.com/dashboard
2. **Table Editor** - View and edit data directly
3. **SQL Editor** - Run queries and view results
4. **Logs** - Monitor database activity

### Local Database Debugging
```bash
# Start local Supabase
supabase start

# Connect with any PostgreSQL client
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Check logs
supabase logs
```

### Common Database Issues
```sql
-- Check for constraint violations
SELECT * FROM profiles WHERE email IS NULL;

-- Find slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct
FROM pg_stats 
WHERE schemaname = 'public';
```

## 🔗 API Debugging

### Network Tab Inspection
- **Request Headers** - Check authentication and content-type
- **Response Headers** - Look for caching and security headers
- **Request Payload** - Inspect data being sent
- **Response Body** - Check API responses

### API Endpoint Testing
```bash
# Test API endpoints directly
curl -X GET http://localhost:3003/api/health

# Test with authentication
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3003/api/profile

# Test with POST data
curl -X POST http://localhost:3003/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Campaign"}'
```

### API Error Debugging
```typescript
// Client-side API debugging
try {
  const response = await fetch('/api/campaigns');
  if (!response.ok) {
    console.error('API Error:', response.status, response.statusText);
    const errorBody = await response.text();
    console.error('Error body:', errorBody);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## 🚨 Common Issues & Solutions

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3003
lsof -i :54322

# Kill processes
kill -9 <PID>

# Alternative: Use different ports
PORT=3004 npm run dev
```

### Database Connection Issues
```bash
# Check Supabase status
supabase status

# Restart local Supabase
supabase stop && supabase start

# Check connection string in .env.local
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Authentication Issues
```typescript
// Debug auth state
console.log('Auth state:', {
  user: user,
  session: session,
  loading: loading
});

// Check RLS policies
// Go to Supabase dashboard > Authentication > Policies
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Test Failures
```bash
# Run specific test with debugging
npm test -- --testNamePattern="specific test" --verbose

# Check test environment
npm run test:env

# Debug test database
npm run test:db:debug
```

## 📊 Performance Debugging

### React Performance Profiler
```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id, // the "id" prop of the Profiler tree
  phase, // either "mount" or "update"
  actualDuration, // time spent rendering
  baseDuration, // estimated time without memoization
  startTime, // when React began rendering
  commitTime, // when React committed the changes
) {
  console.log('Render:', { id, phase, actualDuration, baseDuration });
}

// Wrap components with Profiler
<Profiler id="Navigation" onRender={onRenderCallback}>
  <Navigation />
</Profiler>
```

### Database Query Performance
```sql
-- Enable query timing
\timing on

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze specific query
EXPLAIN ANALYZE SELECT * FROM campaigns WHERE status = 'active';
```

### Bundle Size Analysis
```bash
# Analyze bundle size
npm run analyze

# Check for large dependencies
npm run bundle:check
```

## 🔒 Security Debugging

### Input Validation Issues
```typescript
// Debug validation failures
console.log('Validation input:', inputData);
console.log('Validation result:', validationResult);

// Check sanitization
console.log('Before sanitization:', rawInput);
console.log('After sanitization:', sanitizedInput);
```

### Authentication Flow
```typescript
// Debug auth flow
console.log('Auth attempt:', { email, password });
console.log('Auth response:', authResponse);

// Check token validity
console.log('Token payload:', jwt.decode(token));
```

## 🧪 Testing Debugging

### Jest Debugging
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
npm test -- --testNamePattern="test name" --verbose
```

### Playwright Debugging
```bash
# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# UI mode (visual test runner)
npm run test:e2e:ui
```

## 📝 Logging & Monitoring

### Structured Logging
```typescript
// Use the logger utility, not console.log
import { logger } from '@/utils/logger';

// Different log levels
logger.debug('Debug information', { userId, action });
logger.info('User action completed', { userId, action });
logger.warn('Potential issue detected', { error, context });
logger.error('Critical error occurred', { error, stack, context });
```

### Error Tracking
- **Development**: Console errors + logger
- **Production**: Sentry + monitoring service
- **Database**: Query performance tracking

## 🚨 Production Debugging

### Remote Debugging
```typescript
// Enable remote debugging in production
if (process.env.NODE_ENV === 'production') {
  // Log to monitoring service
  logger.error('Production error', { error, userId, url });
}
```

### Performance Monitoring
```bash
# Check production metrics
npm run monitor:metrics

# View production logs
npm run monitor:logs
```

## 📚 Related Documentation

- **[Development Setup](./SETUP.md)** - Environment configuration
- **[Testing Guide](../testing/README.md)** - Testing strategies
- **[Performance Guide](./performance-debugging.md)** - Performance optimization
- **[Error Handling](./error-handling.md)** - Error management
- **[Browser DevTools](./devtools.md)** - Browser debugging

## 🆘 Getting Help

### **Quick Debug Checklist**
- [ ] Can you reproduce the issue consistently?
- [ ] What changed recently (code, environment, data)?
- [ ] Check console/network tabs in browser
- [ ] Verify environment variables
- [ ] Check database connectivity
- [ ] Review recent commits/deployments

### **Escalation Path**
1. **Self-debug** using this guide
2. **Team chat** - #dev-orangecat channel
3. **GitHub Issues** - Document and track
4. **Code review** - Get second opinion

---

**Last Updated:** October 17, 2025
**Debugging Philosophy:** "Debug with purpose - every investigation should have a clear goal"
