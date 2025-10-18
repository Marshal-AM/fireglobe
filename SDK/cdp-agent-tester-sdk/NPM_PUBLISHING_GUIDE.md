# 📦 Publishing @cdp-agentkit/agent-tester to npm

## ✅ Pre-Flight Checklist

Before publishing, ensure:
- [x] Backend deployed at `https://fireglobe-backend.onrender.com`
- [x] SDK configured to use hosted backend
- [ ] GitHub repository created and code pushed
- [ ] npm account created
- [ ] All code tested locally

---

## 🚀 Quick Publishing Steps

### 1. Navigate to SDK Directory

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

This will:
- Compile TypeScript to JavaScript
- Generate type definitions (.d.ts files)
- Output to `dist/` directory

Verify build succeeded:
```bash
ls dist/
# Should show: index.js, index.d.ts, types.js, types.d.ts, etc.
```

### 4. Test Package Locally (Optional but Recommended)

```bash
# Create a link
npm link

# In a test project
cd /path/to/test-project
npm link @cdp-agentkit/agent-tester

# Test it works
npm unlink @cdp-agentkit/agent-tester
```

### 5. Login to npm

```bash
npm login
```

You'll be prompted for:
- **Username**: Your npm username
- **Password**: Your npm password
- **Email**: Your public email
- **OTP**: If you have 2FA enabled

### 6. Verify Package Contents

See what will be published:

```bash
npm pack --dry-run
```

This shows all files that will be included. Should see:
- `dist/` files
- `README.md`
- `package.json`
- `PUBLISHING_GUIDE.md`

### 7. Publish to npm!

For scoped packages (names starting with `@`):

```bash
npm publish --access public
```

**Note**: Scoped packages are private by default, so we need `--access public`

---

## 🎉 Success!

If successful, you'll see:

```
+ @cdp-agentkit/agent-tester@1.0.0
```

Your package is now live at:
- **npm**: https://www.npmjs.com/package/@cdp-agentkit/agent-tester
- **Install**: `npm install @cdp-agentkit/agent-tester`

---

## 📝 Post-Publishing

### 1. Verify Publication

```bash
npm view @cdp-agentkit/agent-tester
```

### 2. Test Installation

In a new directory:

```bash
mkdir test-install
cd test-install
npm init -y
npm install @cdp-agentkit/agent-tester
```

### 3. Update Documentation

Add installation badge to README:

```markdown
[![npm version](https://badge.fury.io/js/@cdp-agentkit%2Fagent-tester.svg)](https://www.npmjs.com/package/@cdp-agentkit/agent-tester)
[![npm downloads](https://img.shields.io/npm/dm/@cdp-agentkit/agent-tester.svg)](https://www.npmjs.com/package/@cdp-agentkit/agent-tester)
```

### 4. Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: List of features
6. Publish release

---

## 🔄 Publishing Updates

### Patch Release (Bug Fixes: 1.0.0 → 1.0.1)

```bash
npm version patch
npm publish
git push --tags
```

### Minor Release (New Features: 1.0.0 → 1.1.0)

```bash
npm version minor
npm publish
git push --tags
```

### Major Release (Breaking Changes: 1.0.0 → 2.0.0)

```bash
npm version major
npm publish
git push --tags
```

---

## 🏢 Using an Organization

If you want `@your-org/agent-tester` instead of `@cdp-agentkit/agent-tester`:

### 1. Create npm Organization

1. Go to https://www.npmjs.com
2. Click your profile → "Add Organization"
3. Create organization (e.g., `your-org`)

### 2. Update package.json

```json
{
  "name": "@your-org/agent-tester",
  ...
}
```

### 3. Publish

```bash
npm publish --access public
```

---

## 🛡️ Security Best Practices

### 1. Enable 2FA

```bash
npm profile enable-2fa auth-and-writes
```

### 2. Use .npmignore

Already created - ensures only necessary files are published.

### 3. Verify Before Publishing

Always run `npm pack --dry-run` first!

---

## 📊 Package Analytics

### View Download Stats

```bash
npm view @cdp-agentkit/agent-tester
```

### npm Website

Visit: https://www.npmjs.com/package/@cdp-agentkit/agent-tester

See:
- Weekly downloads
- Dependencies
- Dependents
- Version history

---

## 🐛 Troubleshooting

### "Package name too similar"

Choose a more unique name or request ownership if abandoned.

### "You do not have permission"

Ensure you're logged in:
```bash
npm whoami
```

### "Package already exists"

Two options:
1. Choose different name
2. Request package transfer if abandoned

### "Cannot publish over existing version"

Bump version first:
```bash
npm version patch
npm publish
```

---

## 📋 Publishing Checklist

Before each publish:

- [ ] Code is tested and working
- [ ] `npm run build` succeeds
- [ ] Version bumped appropriately
- [ ] CHANGELOG updated (if you have one)
- [ ] README is current
- [ ] `npm pack --dry-run` shows correct files
- [ ] Logged into npm (`npm whoami`)
- [ ] Git changes committed
- [ ] Ready to push tags

---

## 🎯 Quick Commands Reference

```bash
# Build
npm run build

# Test what will be published
npm pack --dry-run

# Login
npm login

# Publish (first time)
npm publish --access public

# Publish update (after version bump)
npm publish

# Version bumps
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# View package info
npm view @cdp-agentkit/agent-tester

# Check who you're logged in as
npm whoami

# Unpublish (within 72 hours only!)
npm unpublish @cdp-agentkit/agent-tester@1.0.0
```

---

## 🌟 Promotion Tips

After publishing:

### 1. Share on Social Media

- Twitter/X
- LinkedIn
- Reddit (r/web3, r/cryptocurrency, r/defi)
- Discord communities

### 2. Create Demo Video

Show how easy it is:
```bash
npm install @cdp-agentkit/agent-tester
# Then run test in < 2 minutes
```

### 3. Write Blog Post

Topics:
- "Testing AI Agents Made Easy"
- "How to Test CDP AgentKit Agents"
- "Building a Universal Agent Testing Framework"

### 4. Submit to Directories

- npm trending
- GitHub topics
- Awesome lists

---

## 📞 Support

### npm Documentation
- https://docs.npmjs.com/
- https://docs.npmjs.com/cli/v9/commands/npm-publish

### Questions?
- npm support: https://www.npmjs.com/support
- Create GitHub issue in your repo

---

## ✅ You're Ready!

Your SDK is configured to:
- ✅ Use hosted backend (https://fireglobe-backend.onrender.com)
- ✅ Zero setup for users
- ✅ Ready for npm publishing
- ✅ Professional package structure

Just run:
```bash
cd PersonalityGenerator/cdp-agent-tester-sdk
npm install
npm run build
npm login
npm publish --access public
```

**That's it! Your SDK will be live on npm!** 🚀

---

## 🎉 After Publishing

Users can now do:

```bash
npm install @cdp-agentkit/agent-tester
```

And it just works - connecting to your hosted backend with zero configuration!

**Congratulations on publishing your first npm package!** 🎊

