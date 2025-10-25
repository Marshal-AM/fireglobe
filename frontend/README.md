# fireGlobe Frontend Dashboard

A comprehensive Next.js dashboard for managing on-chain agent testing, viewing test results, and accessing detailed analytics with Privy authentication.

## 🌟 Features

### 🔐 **Authentication & User Management**
- **Privy Authentication**: Login with email, wallet, or social accounts
- **Embedded Wallets**: Automatic wallet creation for users
- **User Profiles**: Secure user account management

### 🎟️ **Access Token Management**
- **Automatic Generation**: Access tokens created on first login
- **Secure Storage**: Tokens saved locally for returning users
- **Copy to Clipboard**: Easy token copying for use in tests
- **Token History**: View all generated tokens

### 📊 **Test Run Dashboard**
- **Run History**: View all your test runs in chronological order
- **Real-time Status**: Live updates on running tests
- **Quick Overview**: Summary cards showing key metrics
- **Search & Filter**: Find specific test runs easily

### 💰 **FGC Balance & Rewards**
- **Balance Display**: View your current FGC token balance
- **Reward History**: Track earned rewards from test runs
- **Transaction History**: Complete record of FGC transactions
- **Reward Notifications**: Alerts when new rewards are earned

### 📈 **Detailed Analytics & Metrics**
- **Performance Metrics**: Comprehensive agent performance analysis
- **Conversation Analytics**: Detailed conversation breakdowns
- **Transaction Analysis**: Blockchain transaction insights
- **Personality Testing**: Results from AI-generated test personalities
- **Export Options**: Download reports in various formats

### 🔍 **Advanced Features**
- **IPFS Integration**: Direct access to stored test data
- **Knowledge Graph**: Visual representation of test relationships
- **Comparative Analysis**: Compare different test runs
- **Trend Analysis**: Performance trends over time


## 🚀 How It Works

### Dashboard User Flow

1. **Authentication**: User logs in with Privy (email/wallet/social)
2. **Dashboard Access**: User gains access to comprehensive testing dashboard
3. **Token Management**: Access token automatically generated and displayed
4. **Test Execution**: User can initiate new tests or view existing results
5. **Analytics Review**: Detailed metrics and performance analysis available
6. **Reward Tracking**: FGC balance and reward history displayed

### Test Run Management

1. **Run Initiation**: Users can start new agent tests from the dashboard
2. **Real-time Monitoring**: Live updates on test progress and status
3. **Result Storage**: All test data automatically stored in IPFS and Supabase
4. **Analytics Generation**: Comprehensive metrics calculated and displayed
5. **Reward Distribution**: FGC tokens automatically minted for completed tests

### Data Integration

**Backend Integration**:
- Fetches test run data from fireGlobe backend services
- Retrieves Knowledge Graph data for detailed analysis
- Accesses metrics from Metrics Generator service

**Blockchain Integration**:
- Displays FGC token balance from user's wallet
- Shows transaction history and reward details
- Integrates with Base Sepolia for test execution

**Storage Integration**:
- IPFS data retrieval for test results and conversations
- Supabase integration for user data and test run metadata
- Local storage for user preferences and cached data

### Tech Stack

- **Next.js 15** - React framework with App Router
- **Privy** - Authentication & embedded wallets
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety and better DX
- **Supabase** - Database and real-time subscriptions
- **IPFS** - Decentralized storage for test data
- **Viem** - Ethereum library for blockchain interactions
- **Chart.js/Recharts** - Data visualization and analytics
- **React Query** - Data fetching and caching
- **Framer Motion** - Smooth animations and transitions

## 📁 File Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts           # User authentication API
│   │   ├── fgc-balance/
│   │   │   └── route.ts           # FGC balance API
│   │   └── test-runs/
│   │       └── route.ts           # Test runs management API
│   ├── dashboard/                 # Main dashboard pages
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── test-runs/
│   │   │   └── page.tsx          # Test runs list
│   │   └── analytics/
│   │       └── page.tsx          # Detailed analytics
│   ├── test-details/
│   │   └── [id]/
│   │       └── page.tsx          # Individual test run details
│   ├── user-dashboard/
│   │   └── page.tsx              # User profile and settings
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing/login page
│   ├── providers.tsx             # App providers configuration
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   └── ...
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── TestRunCard.tsx
│   │   ├── MetricsChart.tsx
│   │   ├── FGCBalance.tsx
│   │   └── ...
│   ├── analytics/                # Analytics components
│   │   ├── PerformanceMetrics.tsx
│   │   ├── ConversationViewer.tsx
│   │   └── TransactionAnalysis.tsx
│   └── ...
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # Utility functions
│   ├── api.ts                    # API client functions
│   └── types.ts                  # TypeScript type definitions
├── public/                       # Static assets
├── .env.local                    # Environment variables
└── package.json                  # Dependencies
```

## 🎯 Dashboard Features

### Test Run Management
- **Run History**: Complete list of all test runs with status indicators
- **Detailed Views**: Individual test run pages with comprehensive data

### Analytics & Metrics
- **Performance Dashboard**: Visual charts showing agent performance over time
- **Conversation Analytics**: Detailed breakdown of test conversations
- **Transaction Analysis**: Blockchain transaction insights and gas usage
- **Personality Testing**: Results from AI-generated test personalities
- **Comparative Analysis**: Side-by-side comparison of different test runs

### FGC Token Management
- **Balance Display**: Real-time FGC token balance from user's wallet
- **Transaction Details**: Detailed view of all FGC transactions


## ⚙️ Configuration

### Environment Variables

Create `.env.local` with the following variables:

```env
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# FireGlobe Backend Services
NEXT_PUBLIC_BACKEND_URL=https://backend-739298578243.us-central1.run.app
NEXT_PUBLIC_DB_SERVER_URL=https://fireglobedb-739298578243.us-central1.run.app
NEXT_PUBLIC_METRICS_URL=https://metricsgen-739298578243.us-central1.run.app

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=your_base_sepolia_rpc_url
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth` - User authentication and token generation
- `GET /api/auth/me` - Get current user information

### Test Runs
- `GET /api/test-runs` - Fetch user's test runs
- `POST /api/test-runs` - Create new test run
- `GET /api/test-runs/[id]` - Get specific test run details
- `DELETE /api/test-runs/[id]` - Delete test run

### FGC Balance
- `GET /api/fgc-balance` - Get user's FGC token balance
- `GET /api/fgc-balance/history` - Get FGC transaction history

### Analytics
- `GET /api/analytics/overview` - Get performance overview
- `GET /api/analytics/metrics/[runId]` - Get detailed metrics for test run
- `GET /api/analytics/export/[runId]` - Export test run data

## 💻 Development

### Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run format       # Format code with Prettier
npm run lint:fix     # Fix ESLint issues automatically
```

### Development Guidelines
- Use TypeScript for all new files
- Follow the existing component structure
- Write tests for new components and utilities
- Use Tailwind CSS for styling
- Follow the established naming conventions
- Update documentation for new features

## License

Apache-2.0
