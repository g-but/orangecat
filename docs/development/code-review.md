# 🔍 OrangeCat Code Review Guidelines

**Comprehensive guide to conducting effective code reviews for the OrangeCat platform.**

## 🎯 Code Review Philosophy

**"Code review is collaboration, not criticism"** - Every review should improve code quality while building team knowledge and relationships.

## 📋 Review Process

### 1. **Pre-Review Preparation**
- **Read the PR description** - Understand what the change does
- **Review the code** - Look for obvious issues first
- **Run tests** - Ensure the change doesn't break anything
- **Check dependencies** - Verify no new vulnerabilities introduced

### 2. **Code Review Structure**
```typescript
// ✅ Good review structure
1. **Overall Assessment** - High-level feedback
2. **Code Quality** - Style, patterns, maintainability
3. **Functionality** - Does it work as intended?
4. **Testing** - Are tests adequate?
5. **Security** - Any security concerns?
6. **Performance** - Performance impact?
7. **Documentation** - Updated docs?
8. **Questions** - Points needing clarification
```

### 3. **Review Communication**
- **Be constructive** - Focus on improvement, not criticism
- **Be specific** - Point to exact lines and suggest alternatives
- **Be timely** - Review within 24 hours when possible
- **Ask questions** - Better to ask than assume

## 🔍 Code Review Checklist

### **📝 General Code Quality**
- [ ] **Clear and descriptive** variable and function names
- [ ] **Consistent formatting** - Follow project style guide
- [ ] **Proper TypeScript types** - No `any` types, proper interfaces
- [ ] **Error handling** - Proper try/catch and error responses
- [ ] **Logging** - Appropriate log levels and structured logging

### **🔒 Security**
- [ ] **Input validation** - All user inputs validated and sanitized
- [ ] **Authentication** - Proper auth checks for protected routes
- [ ] **Authorization** - Users can only access allowed resources
- [ ] **SQL injection prevention** - Parameterized queries used
- [ ] **XSS prevention** - User content properly escaped
- [ ] **CSRF protection** - CSRF tokens where needed

### **⚡ Performance**
- [ ] **Database queries optimized** - No N+1 queries, proper indexing
- [ ] **Large data handling** - Pagination, lazy loading implemented
- [ ] **Bundle size impact** - No unnecessary dependencies
- [ ] **Memory usage** - No memory leaks or excessive allocations
- [ ] **Network efficiency** - Proper caching and request optimization

### **🧪 Testing**
- [ ] **Unit tests** - All new functions and components tested
- [ ] **Integration tests** - API endpoints and database interactions tested
- [ ] **E2E tests** - Critical user flows tested
- [ ] **Test coverage** - Maintains or improves coverage
- [ ] **Test quality** - Tests are readable and maintainable

### **📚 Documentation**
- [ ] **Code comments** - Complex logic explained
- [ ] **README updates** - Documentation updated for new features
- [ ] **API documentation** - New endpoints documented
- [ ] **Usage examples** - Code examples provided where helpful

## 🚨 Red Flags to Watch For

### **Critical Issues (Blockers)**
- ❌ **Security vulnerabilities** - Authentication bypasses, injection attacks
- ❌ **Breaking changes** - Changes that break existing functionality
- ❌ **Performance regressions** - Significant performance degradation
- ❌ **Test failures** - Tests not passing, coverage decreasing

### **Major Issues (Need Attention)**
- ⚠️ **Code duplication** - Similar logic in multiple places
- ⚠️ **Large files** - Files over 400 lines that could be split
- ⚠️ **Complex functions** - Functions doing too many things
- ⚠️ **Missing error handling** - Operations that can fail without handling

### **Minor Issues (Suggestions)**
- 📝 **Inconsistent naming** - Variable names not following conventions
- 📝 **Missing comments** - Complex logic not explained
- 📝 **Code style issues** - Formatting or style inconsistencies
- 📝 **Documentation gaps** - Missing or incomplete documentation

## 💬 Review Communication

### **Constructive Feedback**
```typescript
// ❌ Bad: Vague criticism
"This is wrong"

// ✅ Good: Specific, actionable feedback
// Line 45: Consider using a more descriptive variable name
// Current: `data` 
// Suggestion: `userProfileData` to be more specific
```

### **Questions for Clarification**
```typescript
// ✅ Good: Ask specific questions
// Line 123: I'm not sure why we're using a Map here instead of an object.
// Could you explain the reasoning?

// Line 234: This seems to duplicate logic from the ProfileService.
// Is there a reason for the duplication?
```

### **Approval with Suggestions**
```typescript
// ✅ Good: Approve with minor suggestions
"LGTM! Just a couple of minor suggestions:

1. Line 45: Consider adding a comment explaining the complex regex
2. Line 67: Could extract this into a separate utility function

Overall, this is a solid implementation!"
```

## 🛠️ Code Review Tools

### **Automated Checks**
- **ESLint** - Code style and potential bugs
- **TypeScript** - Type checking and type safety
- **Prettier** - Code formatting consistency
- **Security scanners** - Vulnerability detection

### **Manual Review Tools**
- **GitHub PR interface** - Line-by-line comments
- **IDE diff tools** - Visual diff comparison
- **Code search** - Find similar patterns in codebase

## 📊 Review Metrics

### **Review Quality Indicators**
- **Response time** - Reviews completed within 24 hours
- **Comment quality** - Specific, actionable feedback
- **Issue resolution** - Problems identified and fixed
- **Knowledge sharing** - Team learning from reviews

### **Code Quality Metrics**
- **Defect density** - Bugs found per lines of code
- **Technical debt** - Code quality improvements identified
- **Security issues** - Vulnerabilities discovered
- **Performance impact** - Performance improvements suggested

## 🎯 Best Practices

### **For Reviewers**
1. **Understand the change** - Read PR description and test the functionality
2. **Focus on important issues** - Prioritize security, functionality, performance
3. **Be specific** - Point to exact lines and suggest concrete improvements
4. **Ask questions** - Better to ask than make wrong assumptions
5. **Be constructive** - Frame feedback as improvement opportunities
6. **Review in context** - Consider the broader codebase and architecture

### **For Authors**
1. **Write clear descriptions** - Explain what the change does and why
2. **Test thoroughly** - Ensure all tests pass before requesting review
3. **Address feedback** - Respond to all comments and make requested changes
4. **Explain decisions** - If you disagree with feedback, explain your reasoning
5. **Update documentation** - Keep docs current with code changes

### **For Teams**
1. **Establish standards** - Consistent review practices across team
2. **Share knowledge** - Use reviews as learning opportunities
3. **Track improvements** - Monitor code quality over time
4. **Celebrate good work** - Recognize high-quality contributions

## 🔄 Review Workflow

### **Standard PR Process**
1. **Author creates PR** with clear description and tests
2. **CI/CD runs** - Automated checks for style, tests, security
3. **Reviewer assigned** - Code review begins
4. **Review completed** - Feedback provided, changes requested if needed
5. **Author addresses feedback** - Makes requested changes
6. **Re-review** - Reviewer verifies changes
7. **Approval** - PR approved and merged

### **Large PR Handling**
- **Break into smaller PRs** if possible
- **Focus on critical changes first** - Core functionality before nice-to-have
- **Use draft PRs** for early feedback on large changes
- **Consider architectural impact** of significant changes

## 📚 Review Documentation

### **Documenting Review Decisions**
- **Architectural decisions** - Document in architecture docs
- **Security decisions** - Document in security docs
- **Performance decisions** - Document in performance docs
- **Testing decisions** - Document in testing docs

### **Review Templates**
```markdown
## Code Review: [PR Title]

### ✅ **Strengths**
- Well-structured and readable code
- Good test coverage
- Proper error handling
- Follows established patterns

### 🔧 **Suggestions**
- Line 45: Consider more descriptive variable name
- Line 67: Could extract into utility function
- Line 123: Add comment explaining complex logic

### ❓ **Questions**
- Why was Map chosen over object for this data structure?
- How does this interact with the existing ProfileService?

### 🚨 **Issues (if any)**
- None identified

**Overall**: LGTM with minor suggestions! 🎉
```

## 🆘 Getting Help

### **Review Resources**
- **Code Review Handbook** - Best practices and guidelines
- **Team Standards** - Project-specific conventions
- **Architecture Docs** - System design context
- **Security Guidelines** - Security review checklist

### **Escalation Path**
1. **Self-review** using this guide
2. **Peer discussion** for clarification
3. **Technical lead** for architectural questions
4. **Team meeting** for complex decisions

---

**Last Updated:** October 17, 2025
**Code Review Philosophy:** "Every review is an opportunity to learn and improve"
