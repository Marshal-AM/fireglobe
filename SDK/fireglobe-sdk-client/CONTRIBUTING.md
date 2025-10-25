# Contributing to fireGlobe

Thank you for your interest in contributing to fireGlobe! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

1. **Agent Framework Adapters** - Create adapters for new agent frameworks
2. **Testing Improvements** - Enhance testing capabilities and metrics
3. **Documentation** - Improve guides, examples, and API documentation
4. **Bug Fixes** - Report and fix issues
5. **Feature Requests** - Suggest new features and improvements
6. **Performance Optimizations** - Improve system performance and efficiency

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/fireglobe.git
   cd fireglobe
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes** and add tests if applicable
5. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request** on GitHub

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.8+
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/fireglobe.git
   cd fireglobe
   ```

2. **Install SDK dependencies**:
   ```bash
   cd SDK/cdp-agent-tester-sdk
   npm install
   ```

3. **Install Backend dependencies**:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Install Database Server dependencies**:
   ```bash
   cd ../db-server
   npm install
   ```

5. **Install Metrics Generator dependencies**:
   ```bash
   cd ../metricsgen
   pip install -r requirements.txt
   ```

### Environment Setup

Create `.env` files in each component directory with the required environment variables:

#### SDK (.env)
```bash
# Optional - override default backend URL
TEST_BACKEND_URL=http://localhost:8000
```

#### Backend (.env)
```bash
# Required
ASI_ONE_API_KEY=your_asi_one_api_key
AGENTVERSE_API_KEY=your_agentverse_api_key
```

#### Database Server (.env)
```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
LIGHTHOUSE_API_KEY=your_lighthouse_api_key

# Optional
BACKEND_URL=https://backend-739298578243.us-central1.run.app
METRICS_URL=https://metricsgen-739298578243.us-central1.run.app

# FGC Minting (optional)
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_private_key
DATACOIN_ADDRESS=0x3D2f760c3Bb59BC74B6BE357e3c20Aad708a9667
```

### Running Tests

```bash
# SDK tests
cd SDK/cdp-agent-tester-sdk
npm test

# Backend tests
cd ../backend
python test.py

# Database Server tests
cd ../db-server
npm test
```

## 🔌 Creating Agent Framework Adapters

### Understanding the Universal Agent Interface

All agent frameworks must implement the `IUniversalAgent` interface:

```typescript
interface IUniversalAgent {
  sendMessage(message: string): Promise<string>;
  reset(): Promise<void>;
  getMetadata?(): {
    name: string;
    description: string;
    framework: string;
    version: string;
  };
  cleanup?(): Promise<void>;
}
```

### Adapter Development Steps

1. **Study existing adapters** in `/SDK/cdp-agent-tester-sdk/src/adapters/`
2. **Create your adapter class**:
   ```typescript
   export class YourFrameworkAdapter implements IUniversalAgent {
     private agent: YourFrameworkAgent;
     private config: YourFrameworkConfig;
     private metadata: AgentMetadata;

     constructor(config: YourFrameworkAdapterConfig) {
       this.agent = config.agent;
       this.config = config.config;
       this.metadata = config.metadata || {
         name: "Your Framework Agent",
         description: "Agent built with Your Framework",
         framework: "YourFramework",
         version: "1.0.0"
       };
     }

     async sendMessage(message: string): Promise<string> {
       // Implement message handling for your framework
       const response = await this.agent.processMessage(message);
       return response;
     }

     async reset(): Promise<void> {
       // Reset conversation state
       await this.agent.reset();
     }

     getMetadata() {
       return this.metadata;
     }

     async cleanup(): Promise<void> {
       // Cleanup resources if needed
     }
   }
   ```

3. **Add configuration interface**:
   ```typescript
   export interface YourFrameworkAdapterConfig {
     agent: YourFrameworkAgent;
     config: YourFrameworkConfig;
     metadata?: AgentMetadata;
   }
   ```

4. **Add tests**:
   ```typescript
   describe('YourFrameworkAdapter', () => {
     it('should send messages correctly', async () => {
       const adapter = new YourFrameworkAdapter(mockConfig);
       const response = await adapter.sendMessage('Hello');
       expect(response).toBeDefined();
     });

     it('should reset conversation state', async () => {
       const adapter = new YourFrameworkAdapter(mockConfig);
       await adapter.reset();
       // Add assertions for reset behavior
     });
   });
   ```

5. **Update exports** in `/SDK/cdp-agent-tester-sdk/src/index.ts`:
   ```typescript
   export { YourFrameworkAdapter } from "./adapters/your-framework-adapter";
   ```

6. **Add documentation** with usage examples

### Adapter Best Practices

- **Error Handling**: Implement robust error handling and provide meaningful error messages
- **Async Operations**: Ensure all async operations are properly awaited
- **Resource Management**: Implement proper cleanup in the `cleanup()` method
- **State Management**: Handle conversation state reset properly
- **Type Safety**: Use TypeScript strictly and provide proper type definitions
- **Testing**: Write comprehensive tests covering all methods and edge cases

## 📝 Code Style Guidelines

### TypeScript/JavaScript

- Use **strict TypeScript** with proper type annotations
- Follow **ESLint** rules (run `npm run lint`)
- Use **Prettier** for code formatting (run `npm run format`)
- Use **meaningful variable names** and add JSDoc comments for complex functions
- Follow **conventional commit messages**

### Python

- Follow **PEP 8** guidelines
- Use **type hints** for function parameters and return values
- Add **docstrings** for classes and functions
- Use **meaningful variable names**

### General

- **Write tests** for new features
- **Update documentation** when adding new features
- **Keep commits atomic** - one logical change per commit
- **Write clear commit messages** following conventional commits format

## 🐛 Reporting Issues

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** and examples
3. **Try the latest version** to see if the issue is already fixed

### Issue Template

When reporting issues, please include:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Node.js version: [e.g. 18.17.0]
- Python version: [e.g. 3.9.0]
- fireGlobe version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

### Before Requesting

1. **Check existing issues** and roadmap
2. **Consider the scope** - is it within fireGlobe's goals?
3. **Think about implementation** - how would you approach it?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request.
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure tests pass** locally
2. **Update documentation** if needed
3. **Add tests** for new features
4. **Follow code style** guidelines
5. **Write clear commit messages**

### PR Template

```markdown
**Description**
Brief description of changes.

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Manual testing completed

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated checks** must pass (tests, linting, etc.)
2. **Code review** by maintainers
3. **Testing** in staging environment
4. **Approval** and merge

## 📚 Documentation

### Types of Documentation

1. **API Documentation** - JSDoc comments and TypeScript interfaces
2. **User Guides** - Step-by-step tutorials and examples
3. **Developer Guides** - Architecture and contribution guidelines
4. **README Files** - Component-specific documentation

### Documentation Guidelines

- **Write for your audience** - consider who will read it
- **Use clear, concise language**
- **Include code examples** where helpful
- **Keep it up to date** with code changes
- **Use proper markdown formatting**

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Release notes prepared
- [ ] Tagged and published

## 🤔 Questions?

- **GitHub Discussions** - For questions and community discussions
- **GitHub Issues** - For bug reports and feature requests
- **Discord** - Join our community server (link coming soon)
- **Email** - Contact maintainers directly

## 📄 License

By contributing to fireGlobe, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to fireGlobe! 🚀
