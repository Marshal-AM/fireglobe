'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { Globe } from '@/components/ui/globe';
import { ShineBorder } from '@/components/ui/shine-border';
import { SparklesText } from '@/components/ui/sparkles-text';


export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authenticated && user) {
      fetchOrCreateAccessToken();
    } else {
      setAccessToken(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user]);

  const fetchOrCreateAccessToken = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Get user's email and wallet address
      const email = user.email?.address || null;
      const walletAddress = user.wallet?.address || null;

      // Check if user already exists in our system (stored in localStorage)
      const storedToken = localStorage.getItem(`access_token_${user.id}`);
      
      if (storedToken) {
        // Verify token is still valid
        const verifyResponse = await fetch(`/api/auth?access_token=${storedToken}`);
        if (verifyResponse.ok) {
          setAccessToken(storedToken);
          setLoading(false);
          return;
        }
      }

      // Create or get user via API route
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email,
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate');
      }

      const data = await response.json();
      
      if (data.success && data.access_token) {
        setAccessToken(data.access_token);
        // Store token locally
        localStorage.setItem(`access_token_${user.id}`, data.access_token);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching access token:', err);
      setError(err instanceof Error ? err.message : 'Failed to get access token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (accessToken) {
      await navigator.clipboard.writeText(accessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    setAccessToken(null);
    logout();
  };

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Login page
  if (!authenticated) {
    return (
      <div className="min-h-screen flex bg-black p-4 gap-4">
        {/* Left Side - Content Canvas */}
        <div className="flex-1 border-2 border-black rounded-lg p-4 backdrop-blur-xl bg-white/10 shadow-2xl relative overflow-hidden group hover:bg-white/15 transition-all duration-500">
          {/* Liquid glass overlay with animated gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-lg animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-white/10 via-transparent to-white/5 rounded-lg group-hover:from-white/15 transition-all duration-700"></div>
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
          <div className="flex flex-col items-center justify-center text-center p-8 h-full relative z-10">
            {/* FireGlobe Title */}
            <div className="mb-8">
              <SparklesText
                className="text-6xl font-bold"
                sparklesCount={3}
                colors={{ first: "#ff6b35", second: "#ffffff" }}
              >
                <span className="text-orange-500">Fire</span><span className="text-white">Globe</span>
              </SparklesText>
            </div>

            {/* Login Section */}
            <div className="max-w-md w-full">
              <p className="text-gray-400 mb-6">
                Get your access token to start testing
              </p>

              <button
                onClick={login}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Login with Privy
              </button>

              <p className="mt-6 text-sm text-gray-500">
                Connect with email, wallet, or social accounts
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Globe Canvas */}
        <div className="flex-1 border-2 border-black rounded-lg p-4 backdrop-blur-xl bg-white/10 shadow-2xl relative overflow-hidden group hover:bg-white/15 transition-all duration-500">
          {/* Liquid glass overlay with animated gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-lg animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-white/10 via-transparent to-white/5 rounded-lg group-hover:from-white/15 transition-all duration-700"></div>
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="w-[500px] h-[500px] relative">
              <Globe className="!absolute !inset-0 !w-full !h-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard page (logged in)
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome!</h1>
              <p className="text-gray-400 mt-1">
                {user?.email?.address || user?.wallet?.address || 'User'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Access Token Card */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Your Access Token</h2>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="ml-3 text-gray-400">Generating your access token...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-200">{error}</p>
              <button
                onClick={fetchOrCreateAccessToken}
                className="mt-2 text-red-400 hover:text-red-300 font-medium underline"
              >
                Try again
              </button>
            </div>
          )}

          {accessToken && !loading && (
            <>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                <code className="text-sm text-gray-200 break-all font-mono">
                  {accessToken}
                </code>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl mb-4"
              >
                {copied ? '✓ Copied!' : 'Copy Access Token'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}