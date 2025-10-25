# NPM Publishing Guide for @cdp-agentkit/agent-tester

This guide walks you through publishing the CDP Agent Tester SDK to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Ensure npm is installed (`npm --version`)
3. **Organization (Optional)**: For scoped packages like `@cdp-agentkit/agent-tester`, you may need an organization

## Step-by-Step Publishing Process

### 1. Prepare Your Package

```bash
cd PersonalityGenerator/cdp-agent-tester-sdk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Package

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist` directory.

### 4. Test Locally (Optional but Recommended)

Test your package locally before publishing:

```bash
# In the SDK directory
npm link

# In a test project
npm link @cdp-agentkit/agent-tester

# Test your package
# Then unlink when done
npm unlink @cdp-agentkit/agent-tester
```

### 5. Update package.json

Ensure these fields are correct:

```json
{
  "name": "@cdp-agentkit/agent-tester",
  "version": "1.0.0",
  "description": "Universal testing SDK for CDP AgentKit agents using AI-generated personalities",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/cdp-agent-tester-sdk"
  },
  "keywords": [
    "cdp",
    "agentkit",
    "testing",
    "ai",
    "blockchain",
    "personality-testing",
    "defi"
  ],
  "files": [
    "dist",
    "README.md"
  ]
}
```

### 6. Create .npmignore

Create a `.npmignore` file to exclude unnecessary files:

```
src/
*.test.ts
*.spec.ts
tsconfig.json
.env
.env.*
node_modules/
.git/
.github/
coverage/
*.log
```

### 7. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 8. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

This shows all files that will be included in the package.

### 9. Publish to npm

For first-time publishing:

```bash
npm publish --access public
```

**Note**: Scoped packages (`@scope/package`) are private by default. Use `--access public` to make it public.

### 10. Verify Publication

Check your package on npm:

```bash
npm view @cdp-agentkit/agent-tester
```

Or visit: `https://www.npmjs.com/package/@cdp-agentkit/agent-tester`

## Publishing Updates

### Version Bumping

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.0 → 1.0.1): Bug fixes
  ```bash
  npm version patch
  ```

- **Minor** (1.0.0 → 1.1.0): New features (backward compatible)
  ```bash
  npm version minor
  ```

- **Major** (1.0.0 → 2.0.0): Breaking changes
  ```bash
  npm version major
  ```

These commands automatically:
1. Update package.json
2. Create a git commit
3. Create a git tag

### Publish the Update

```bash
npm publish
```

## Using a Scoped Organization

If you want to publish under an organization:

### 1. Create Organization

Create an organization on npmjs.com (e.g., `@cdp-agentkit`)

### 2. Update package.json

```json
{
  "name": "@cdp-agentkit/agent-tester",
  ...
}
```

### 3. Publish

```bash
npm publish --access public
```

## Setting Up CI/CD (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup npm Token

1. Generate token: `npm token create`
2. Add to GitHub Secrets:
   - Go to repository → Settings → Secrets → Actions
   - Create secret named `NPM_TOKEN`
   - Paste your npm token

## Best Practices

### 1. Changelog

Maintain a `CHANGELOG.md`:

```markdown
# Changelog

## [1.0.1] - 2025-01-15
### Fixed
- Bug fix in message handling

## [1.0.0] - 2025-01-01
### Added
- Initial release
```

### 2. Git Tags

Tag releases:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 3. Pre-publish Checklist

- [ ] All tests pass
- [ ] README is up to date
- [ ] Version number is correct
- [ ] CHANGELOG is updated
- [ ] Build succeeds (`npm run build`)
- [ ] No sensitive data in package
- [ ] License file present

### 4. Deprecation

To deprecate a version:

```bash
npm deprecate @cdp-agentkit/agent-tester@1.0.0 "Security vulnerability, please upgrade to 1.0.1"
```

### 5. Unpublishing (Use Carefully!)

You can only unpublish within 72 hours:

```bash
npm unpublish @cdp-agentkit/agent-tester@1.0.0
```

**Warning**: This can break dependents. Prefer deprecation instead.

## Distribution Tags

### Latest (default)

```bash
npm publish  # Automatically tagged as 'latest'
```

### Beta/Alpha Releases

```bash
npm version prerelease --preid=beta  # 1.0.0-beta.0
npm publish --tag beta
```

Users install with:
```bash
npm install @cdp-agentkit/agent-tester@beta
```

## Troubleshooting

### "Package name too similar"

If your package name is too similar to an existing one, npm may reject it. Choose a more unique name.

### "You do not have permission"

Ensure you're logged in and have permissions:

```bash
npm whoami  # Check who you're logged in as
npm owner ls @cdp-agentkit/agent-tester  # Check package owners
```

### "Package already exists"

The package name is taken. Choose a different name or request access if it's abandoned.

### Build Errors

Ensure TypeScript compiles without errors:

```bash
npm run build
# Check for any compilation errors
```

## Post-Publication

### 1. Test Installation

In a new directory:

```bash
npm install @cdp-agentkit/agent-tester
```

### 2. Update Documentation

Update your main README with installation instructions.

### 3. Announce

- Create GitHub release
- Post on social media
- Update project documentation

## Quick Reference

```bash
# Build
npm run build

# Test package contents
npm pack --dry-run

# Login
npm login

# Publish
npm publish --access public

# Version bump
npm version patch|minor|major

# View published package
npm view @cdp-agentkit/agent-tester

# Check who owns package
npm owner ls @cdp-agentkit/agent-tester
```

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm Package Best Practices](https://docs.npmjs.com/packages-and-modules)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

