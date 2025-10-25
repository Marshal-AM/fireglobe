# 🚀 Quick Publish to npm - 5 Commands

Your SDK is ready to publish! Here's all you need:

## 📦 Publishing Commands

```bash
# 1. Navigate to SDK
cd PersonalityGenerator/cdp-agent-tester-sdk

# 2. Install dependencies
npm install

# 3. Build package
npm run build

# 4. Login to npm
npm login

# 5. Publish!
npm publish --access public
```

## ✅ Done!

Your package is now live at:
```
https://www.npmjs.com/package/@cdp-agentkit/agent-tester
```

Users can install with:
```bash
npm install @cdp-agentkit/agent-tester
```

---

## 🎯 What's Configured

✅ **Backend**: https://backend-739298578243.us-central1.run.app  
✅ **Default URL**: Built into SDK  
✅ **Zero Setup**: Users just `npm install` and use!  
✅ **Package Name**: `@cdp-agentkit/agent-tester`  
✅ **Version**: 1.0.0  
✅ **License**: MIT  

---

## 📝 After Publishing

Test it works:

```bash
# In a new directory
mkdir test-install && cd test-install
npm init -y
npm install @cdp-agentkit/agent-tester

# Create test.ts
# import { AgentTester } from "@cdp-agentkit/agent-tester";
# ... test code
```

---

## 🔄 Updating Later

```bash
# Make changes, then:
npm version patch  # or minor or major
npm publish
git push --tags
```

---

## 📚 Full Guide

For detailed instructions, see `NPM_PUBLISHING_GUIDE.md`

---

**That's it! Ready to publish? Run those 5 commands above!** 🚀

