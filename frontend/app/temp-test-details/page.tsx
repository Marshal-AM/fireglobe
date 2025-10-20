'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function TempTestDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kgUrl = searchParams.get('kg');
  const metricsUrl = searchParams.get('metrics');

  const [kgData, setKgData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!kgUrl || !metricsUrl) {
        setError('Missing kg or metrics URL');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const [kgResp, metricsResp] = await Promise.all([
          fetch(kgUrl),
          fetch(metricsUrl)
        ]);

        if (!kgResp.ok) throw new Error(`KG fetch failed: ${kgResp.status}`);
        if (!metricsResp.ok) throw new Error(`Metrics fetch failed: ${metricsResp.status}`);

        const [kgJson, metricsJson] = await Promise.all([
          kgResp.json().catch(() => null),
          metricsResp.json().catch(() => null)
        ]);

        setKgData(kgJson);
        setMetricsData(metricsJson);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kgUrl, metricsUrl]);

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-300 hover:text-white"
          >
            ← Back
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-800 mb-6">
          <h1 className="text-2xl font-bold text-white">Temp Test Details</h1>
          <p className="text-gray-400 text-sm mt-1">Automatically fetched from Lighthouse URLs</p>
        </div>

        {loading && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-gray-300">Loading...</div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-2xl p-6 text-red-200">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-white">Knowledge Graph (KG)</h2>
                {kgUrl && (
                  <a
                    href={kgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Open
                  </a>
                )}
              </div>
              <pre className="text-xs text-gray-200 whitespace-pre-wrap overflow-auto max-h-[60vh]">
{kgData ? JSON.stringify(kgData, null, 2) : 'No JSON content'}
              </pre>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-white">Metrics</h2>
                {metricsUrl && (
                  <a
                    href={metricsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Open
                  </a>
                )}
              </div>
              <pre className="text-xs text-gray-200 whitespace-pre-wrap overflow-auto max-h-[60vh]">
{metricsData ? JSON.stringify(metricsData, null, 2) : 'No JSON content'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


