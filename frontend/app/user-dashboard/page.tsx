'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome!</h1>
              <p className="text-gray-400 mt-1">
                {user?.email?.address || user?.wallet?.address || 'User'}
              </p>
            </div>
            <button
              onClick={() => { setAccessToken(null); logout(); router.replace('/'); }}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

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

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-300 text-sm">FGC Balance</p>
                <p className="text-white text-lg font-mono">
                  {fgcBalance === null ? '—' : `${fgcBalance} FGC`}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-3">Your Test Runs</h3>
                {testRuns.length === 0 ? (
                  <p className="text-gray-400 text-sm">No test runs found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testRuns.map((tr) => (
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
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 cursor-pointer"
                      >
                        <div className="text-xs text-gray-400 mb-2">{new Date(tr.created_at).toLocaleString()}</div>
                        <div className="mb-2">
                          <div className="text-sm text-gray-300">KG</div>
                          <a
                            href={`https://gateway.lighthouse.storage/ipfs/${tr.kg_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 break-all"
                          >
                            {tr.kg_hash}
                          </a>
                        </div>
                        <div className="mb-2">
                          <div className="text-sm text-gray-300">Metrics</div>
                          <a
                            href={`https://gateway.lighthouse.storage/ipfs/${tr.metrics_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 break-all"
                          >
                            {tr.metrics_hash}
                          </a>
                        </div>
                        {tr.fgc_reward_tx ? (
                          <div className="mt-2">
                            <div className="text-sm text-gray-300">Reward Tx</div>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${tr.fgc_reward_tx}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-green-400 hover:text-green-300 break-all"
                            >
                              {tr.fgc_reward_tx}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


