'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
        appearance: {
          theme: 'dark',
        },
        embeddedWallets: 
        {
            ethereum: {
                createOnLogin: 'users-without-wallets'
            },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

