'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, LogOut, TrendingUp, Activity, ExternalLink, Home, Archive } from 'lucide-react';
import { AuroraText } from '@/components/ui/aurora-text';
import { Sora } from 'next/font/google';
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack';
import Dock from '@/components/Dock';

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function UserDashboard() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fgcBalance, setFgcBalance] = useState<string | null>(null);
  const [testRuns, setTestRuns] = useState<Array<{
    run_id: string;
    kg_hash: string;
    metrics_hash: string;
    fgc_reward_tx?: string | null;
    created_at: string;
  }>>([]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated && user) {
      fetchOrCreateAccessToken();
    } else {
      setAccessToken(null);
    }
  }, [authenticated, user]);

  const fetchOrCreateAccessToken = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const email = user.email?.address || null;
      const walletAddress = user.wallet?.address || null;

      const storedToken = localStorage.getItem(`access_token_${user.id}`);
      if (storedToken) {
        const verifyResponse = await fetch(`/api/auth?access_token=${storedToken}`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          setAccessToken(storedToken);
          setUserId(verifyData.user_id ?? null);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email, walletAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate');
      }

      const data = await response.json();
      if (data.success && data.access_token) {
        setAccessToken(data.access_token);
        setUserId(data.user_id ?? null);
        localStorage.setItem(`access_token_${user.id}`, data.access_token);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
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

  useEffect(() => {
    const loadBalance = async () => {
      try {
        if (!user?.wallet?.address) {
          setFgcBalance(null);
          return;
        }
        const resp = await fetch(`/api/fgc-balance?address=${user.wallet.address}`);
        if (!resp.ok) {
          setFgcBalance(null);
          return;
        }
        const data = await resp.json();
        setFgcBalance(data.balance ?? null);
      } catch {
        setFgcBalance(null);
      }
    };
    if (authenticated) {
      loadBalance();
    } else {
      setFgcBalance(null);
    }
  }, [authenticated, user]);

  useEffect(() => {
    const fetchTestRuns = async () => {
      try {
        if (!userId) {
          setTestRuns([]);
          return;
        }
        const resp = await fetch(`/api/test-runs?user_id=${userId}`);
        if (!resp.ok) {
          setTestRuns([]);
          return;
        }
        const data = await resp.json();
        setTestRuns(Array.isArray(data.test_runs) ? data.test_runs : []);
      } catch {
        setTestRuns([]);
      }
    };
    if (authenticated && userId) {
      fetchTestRuns();
    }
  }, [authenticated, userId]);

  const formatAddress = (addr: string) => {
    return addr; // Show full address
  };

  const successRate = testRuns.length > 0 
    ? Math.round((testRuns.filter(tr => tr.fgc_reward_tx).length / testRuns.length) * 100) 
    : 0;

  if (!ready) {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="text-center">
          <div className="min-h-screen bg-black py-8 px-4"></div>
          <p className="mt-6 text-purple-300 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const dockItems = [
    { 
      icon: <Home size={18} color="white" />, 
      label: 'Home', 
      onClick: () => { setAccessToken(null); logout(); router.replace('/'); } 
    },
    { 
      icon: <Archive size={18} color="white" />, 
      label: 'Dashboard', 
      onClick: () => router.push('/user-dashboard') 
    },
  ];

  return (
    <div className="min-h-screen bg-black py-8 px-4 flex">
      {/* Left Dock */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col gap-4">
          {dockItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
               className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-black rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:scale-110"
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex-1">
        {/* Header Section */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className={`${sora.className} text-3xl font-bold tracking-tight flex items-center transform -skew-x-12`}>
                  <span className="text-white">Welcome</span>
                  <span className="mx-2"></span>
                  <AuroraText 
                    className="text-3xl font-bold tracking-tight"
                    colors={["#FF4500", "#FF8C00", "#FFD700", "#FF6B35"]}
                    speed={1.5}
                  >
                    <span className="text-white">Back!</span>
                  </AuroraText>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {user?.wallet?.address && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-mono">
                      {formatAddress(user.wallet.address)}
                    </span>
                  )}
                  {user?.email?.address && (
                    <span className="text-gray-400 text-sm">{user.email.address}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setAccessToken(null); logout(); router.replace('/'); }}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* FGC Balance Card */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl shadow-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
            <p className="text-gray-400 text-sm mb-1">FGC Balance</p>
            <p className="text-3xl font-bold text-white font-mono">
              {fgcBalance === null ? '—' : fgcBalance}
            </p>
            <p className="text-purple-400 text-xs mt-1">FGC</p>
          </div>

          {/* Total Test Runs Card */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-2xl shadow-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105">
            <p className="text-gray-400 text-sm mb-1">Total Test Runs</p>
            <p className="text-3xl font-bold text-white">{testRuns.length}</p>
            <p className="text-cyan-400 text-xs mt-1">All time</p>
          </div>

          {/* Success Rate Card */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl shadow-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105">
            <p className="text-gray-400 text-sm mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-white">{successRate}%</p>
            <p className="text-green-400 text-xs mt-1">Rewarded runs</p>
          </div>
        </div>

        {/* Access Token Section */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Access Token
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
              <p className="ml-4 text-gray-300">Generating your access token...</p>
            </div>
          )}

          {error && (
            <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
              <p className="text-red-300 mb-3">{error}</p>
              <button
                onClick={fetchOrCreateAccessToken}
                className="text-red-400 hover:text-red-300 font-medium underline"
              >
                Try again
              </button>
            </div>
          )}

          {accessToken && !loading && (
            <div className="space-y-4">
              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 group hover:border-purple-500/50 transition-all duration-300">
                <code className="text-sm text-gray-300 break-all font-mono block">
                  {accessToken}
                </code>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Access Token
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Test Runs Section */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Test Runs History
          </h2>

          {testRuns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No test runs yet</p>
              <p className="text-gray-500 text-sm mt-2">Your test runs will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {testRuns.map((tr, idx) => (
                <div
                  key={tr.run_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/temp-test-details?kg=${encodeURIComponent(`https://gateway.lighthouse.storage/ipfs/${tr.kg_hash}`)}&metrics=${encodeURIComponent(`https://gateway.lighthouse.storage/ipfs/${tr.metrics_hash}`)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      router.push(`/temp-test-details?kg=${encodeURIComponent(`https://gateway.lighthouse.storage/ipfs/${tr.kg_hash}`)}&metrics=${encodeURIComponent(`https://gateway.lighthouse.storage/ipfs/${tr.metrics_hash}`)}`);
                    }
                  }}
                  className="backdrop-blur-xl bg-slate-900/30 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/30">
                        <span className="text-purple-400 font-bold">#{testRuns.length - idx}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Test Run</p>
                        <p className="text-xs text-gray-400">{new Date(tr.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {tr.fgc_reward_tx ? (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
                        Rewarded
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Data Links */}
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-400 font-medium">Knowledge Graph</p>
                        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <p className="text-xs text-purple-400 font-mono break-all">{tr.kg_hash.slice(0, 20)}...</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-400 font-medium">Metrics</p>
                        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-xs text-cyan-400 font-mono break-all">{tr.metrics_hash.slice(0, 20)}...</p>
                    </div>

                    {tr.fgc_reward_tx && (
                      <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-400 font-medium">Reward Transaction</p>
                          <ExternalLink className="w-3 h-3 text-green-400" />
                        </div>
                        <p className="text-xs text-green-400 font-mono break-all">{tr.fgc_reward_tx.slice(0, 20)}...</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}