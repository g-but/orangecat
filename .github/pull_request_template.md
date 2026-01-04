## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Other (please describe)

## Checklist
- [ ] I have tested these changes locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] I have updated the documentation accordingly
- [ ] I have followed the project's coding standards
- [ ] I have added necessary environment variables to the deployment configuration

## Type Safety Checklist
- [ ] No new `as any` casts (unless absolutely necessary with explanation)
- [ ] No `@ts-ignore` or `@ts-expect-error` (unless justified with description)
- [ ] All new functions have proper return types
- [ ] All parameters are properly typed
- [ ] Database queries use generated types from `@/types/database`
- [ ] New code passes `tsc --project tsconfig.strict.json --noEmit`
- [ ] Type guards used instead of `as any` for runtime validation

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

## Related Issues
<!-- Link to any related issues using the format: Fixes #123 -->

## Additional Notes
<!-- Add any additional notes about the changes --> 