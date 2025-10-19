# Changelog

## [1.5.0] - 2025-01-19

### 🚀 Major Updates

#### Backend Integration
- **Updated default backend URL** to use deployed service: `https://backend-739298578243.us-central1.run.app`
- **Removed localhost dependency** - SDK now works out-of-the-box with hosted backend
- **Enhanced reliability** with production-grade backend infrastructure

#### Knowledge Graph Integration
- **Added Knowledge Graph support** for conversation and transaction storage
- **Automatic BlockScout analysis linking** to conversations
- **Enhanced data persistence** with MeTTa-powered graph storage

#### Documentation Updates
- **Updated README.md** with new backend URL
- **Updated all documentation files** to reflect deployed backend
- **Added Knowledge Graph usage examples**

### 🔧 Technical Changes

#### Backend Client
- Updated default `backendUrl` in `AgentTester` constructor
- Maintained backward compatibility with custom backend URLs
- Enhanced error handling for deployed backend

#### Package Configuration
- **Version bump**: 1.4.1 → 1.5.0
- **Updated description** to include deployed backend integration
- **Maintained all existing functionality**

### 📦 Published to npm
- **Package**: `cdp-agent-tester@1.5.0`
- **Registry**: https://registry.npmjs.org/
- **Access**: Public
- **Size**: 20.5 kB (85.8 kB unpacked)

### 🎯 Benefits for Users
- **Zero setup required** - just `npm install` and use
- **Production-ready backend** with high availability
- **Enhanced data storage** with Knowledge Graph capabilities
- **Automatic transaction analysis** with BlockScout integration
- **Real-time conversation logging** and evaluation

### 🔄 Migration Guide
No breaking changes! Existing code will work without modification.

**Before (1.4.1):**
```typescript
// Required custom backend URL
const tester = new AgentTester({
  backendUrl: "http://localhost:8000", // Required
  // ... other config
});
```

**After (1.5.0):**
```typescript
// Uses deployed backend by default
const tester = new AgentTester({
  // backendUrl is optional - uses deployed backend
  // ... other config
});
```

### 🚀 Installation
```bash
npm install cdp-agent-tester@1.5.0
```

### 📚 Documentation
- **README**: Updated with new backend URL
- **Knowledge Graph Guide**: Added usage examples
- **API Reference**: All endpoints documented

---

## Previous Versions

### [1.4.1] - Previous Release
- Initial release with localhost backend
- Basic transaction detection
- Real-time conversation logging
