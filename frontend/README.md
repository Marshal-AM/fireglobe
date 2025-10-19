# CDP Agent Tester - Frontend

A Next.js application for managing CDP Agent Tester access tokens with Privy authentication.

## Features

- 🔐 **Privy Authentication**: Login with email, wallet, or social accounts
- 💼 **Embedded Wallets**: Automatic wallet creation for users
- 🎟️ **Access Token Management**: Automatically generates and displays access tokens
- 📋 **Copy to Clipboard**: Easy token copying for use in tests
- 💾 **Local Storage**: Tokens saved locally for returning users

## Setup

### 1. Install Dependencies

```bash
cd /Users/sam/fireglobe/frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:

```bash
cp env.local.example .env.local
```

Update with your credentials:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Get Privy App ID

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app or use existing one
3. Enable login methods:
   - ✅ Email
   - ✅ Wallet
   - ✅ Google
   - ✅ Twitter
   - ✅ Discord  
   - ✅ GitHub
4. Enable **Embedded Wallets** in settings:
   - Set to "Create on login"
   - Disable password requirement
5. Copy your App ID

### 4. Set Up Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Run the SQL schema from `/Users/sam/fireglobe/SDK/db-server/schema.sql` in the SQL Editor
4. Get your Project URL and anon key from Settings → API
5. Add them to `.env.local`

### 5. Start the Frontend

```bash
npm run dev
```

Visit http://localhost:3000

## How It Works

### User Flow

1. **Login**: User clicks "Login with Privy"
2. **Authentication**: Privy handles authentication (email/wallet/social)
3. **Token Generation**: Frontend calls db-server to create user and get access token
4. **Display**: Access token is displayed and saved to localStorage
5. **Use**: User copies token for use in CDP Agent Tester

### DB Integration

When a user logs in:
- Frontend sends user email/wallet to internal API route (`/api/auth`)
- API route checks if user exists in Supabase
- If new user, Supabase auto-generates access token
- Token is returned and displayed to user
- Token is cached in localStorage for returning users

### Tech Stack

- **Next.js 15** - React framework
- **Privy** - Authentication & embedded wallets
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── route.ts    # API route for user auth
│   ├── layout.tsx          # Root layout with Privy provider
│   ├── page.tsx            # Main page (login/dashboard)
│   ├── providers.tsx       # Privy configuration
│   └── globals.css         # Global styles
├── lib/
│   └── supabase.ts         # Supabase client
├── public/                 # Static assets
├── .env.local              # Environment variables (create this)
└── package.json            # Dependencies
```

## Configuration

### Privy Settings

Update `app/providers.tsx` to customize:

```typescript
loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
appearance: {
  theme: 'light',
  accentColor: '#676FFF',
  logo: 'https://your-logo-url.com/logo.png',
},
embeddedWallets: {
  createOnLogin: 'users-without-wallets',
},
```

### Supported Chains

Currently configured for:
- Base Sepolia (testnet) - default
- Base (mainnet)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

### "NEXT_PUBLIC_PRIVY_APP_ID is not set"
- Make sure you created `.env.local` file
- Add your Privy App ID to the file
- Restart the dev server

### "Failed to create user"
- Check that Supabase URL and anon key are correct in `.env.local`
- Verify the SQL schema was applied in Supabase
- Check browser console and Network tab for detailed errors

### Token not showing after login
- Check browser console for errors
- Verify Supabase is accessible
- Check network tab for failed API requests to `/api/auth`

## License

Apache-2.0
