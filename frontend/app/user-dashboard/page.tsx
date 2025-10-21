'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, LogOut, TrendingUp, Activity, ExternalLink, Home, Archive, Eye } from 'lucide-react';
import { AuroraText } from '@/components/ui/aurora-text';
import { Sora } from 'next/font/google';
import StarBorder from '@/components/StarBorder';
import { HoverEffect } from '@/components/ui/card-hover-effect';

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
            <div className="flex items-center gap-8">
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
            
            <div className="flex items-center gap-6">
              {/* Access Token Section */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">Access Token</p>
                <div className="flex items-center justify-center h-8">
                  {loading && (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                    </div>
                  )}
                  
                  {error && (
                    <button
                      onClick={fetchOrCreateAccessToken}
                      className="text-red-400 hover:text-red-300 font-medium underline text-sm"
                    >
                      Retry
                    </button>
                  )}
                  
                  {accessToken && !loading && (
                    <button
                      onClick={copyToClipboard}
                      className="text-white hover:text-gray-300 font-medium text-sm transition-all duration-200 hover:scale-110"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
              </div>

              {/* FGC Balance Section */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">FGC Balance</p>
                <div className="h-8 flex items-center justify-center">
                  <p className="text-white text-xl font-bold font-mono">
                    {fgcBalance === null ? '—' : fgcBalance}
                  </p>
                </div>
              </div>

              {/* Test Runs Section */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">Test Runs</p>
                <div className="h-8 flex items-center justify-center">
                  <p className="text-white text-xl font-bold">{testRuns.length}</p>
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
        </div>



        {/* Test Runs Section */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-8 border border-white/10">
          <h2 className={`${sora.className} text-2xl font-bold text-white mb-6 text-center`}>
            Test Runs History
          </h2>

          {testRuns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No test runs yet</p>
              <p className="text-gray-500 text-sm mt-2">Your test runs will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testRuns.map((tr, idx) => (
                <a
                  key={tr.run_id}
                  href={`/temp-test-details?kg=${encodeURIComponent(`https://gateway.lighthouse.storage/ipfs/${tr.kg_hash}`)}&metrics=${encodeURIComponent(`https://gateway.lighthouse.storage/ipfs/${tr.metrics_hash}`)}`}
                  className="relative group block p-2 h-full w-full"
                >
                  <div className="rounded-2xl h-full w-full p-6 overflow-hidden bg-black border border-transparent dark:border-white/[0.2] group-hover:border-orange-500 transition-all duration-300">
                    {/* Header with title and date */}
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-zinc-100 font-bold tracking-wide text-xl">
                        Test Run #{idx + 1}
                      </h4>
                      <span className="text-zinc-400 text-sm">
                        {new Date(tr.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Knowledge and Metrics */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">Knowledge Id:</p>
                        <p className="text-zinc-100 font-mono text-sm break-all">
                          {tr.kg_hash.slice(0, 12)}...
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">Metrics:</p>
                        <p className="text-zinc-100 font-mono text-sm break-all">
                          {tr.metrics_hash.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}