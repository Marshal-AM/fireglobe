'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar, Activity, TrendingUp, Database, BarChart3 } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { Sora } from 'next/font/google';
import dynamic from 'next/dynamic';

// Dynamically import the force graph to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function TempTestDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kgUrl = searchParams.get('kg');
  const metricsUrl = searchParams.get('metrics');

  const [kgData, setKgData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const graphRef = useRef<any>(null);

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
        
        // Process knowledge graph data for visualization
        if (kgJson) {
          processGraphData(kgJson);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kgUrl, metricsUrl]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const processGraphData = (data: any) => {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeMap = new Map();

    // Process conversation data as knowledge graph
    if (data.entry && data.entry.messages) {
      // Add conversation node
      const conversationNode = {
        id: 'conversation',
        name: 'Conversation',
        type: 'conversation',
        group: 'conversation',
        size: 20,
        color: '#FF6B35'
      };
      nodes.push(conversationNode);
      nodeMap.set('conversation', conversationNode);

      // Add personality node
      if (data.entry.personality_name) {
        const personalityNode = {
          id: 'personality',
          name: data.entry.personality_name,
          type: 'personality',
          group: 'personality',
          size: 18,
          color: '#FF8C00'
        };
        nodes.push(personalityNode);
        nodeMap.set('personality', personalityNode);
        
        // Link personality to conversation
        links.push({
          id: 'conv_personality',
          source: 'conversation',
          target: 'personality',
          label: 'has personality',
          strength: 1,
          color: '#FFD700'
        });
      }

      // Process messages as nodes
      data.entry.messages.forEach((message: any, index: number) => {
        const messageNode = {
          id: `message_${index}`,
          name: `${message.role} ${index + 1}`,
          type: message.role,
          group: message.role,
          size: 12,
          color: message.role === 'user' ? '#FF4500' : '#FF6B35',
          content: message.content?.substring(0, 50) + '...'
        };
        nodes.push(messageNode);
        nodeMap.set(`message_${index}`, messageNode);

        // Link message to conversation
        links.push({
          id: `conv_msg_${index}`,
          source: 'conversation',
          target: `message_${index}`,
          label: 'contains',
          strength: 0.8,
          color: '#FF8C00'
        });

        // Link consecutive messages
        if (index > 0) {
          links.push({
            id: `msg_${index-1}_${index}`,
            source: `message_${index-1}`,
            target: `message_${index}`,
            label: 'follows',
            strength: 0.6,
            color: '#FFD700'
          });
        }
      });

      // Process transactions as nodes
      if (data.entry.transactions) {
        data.entry.transactions.forEach((tx: any, index: number) => {
          const txNode = {
            id: `tx_${index}`,
            name: `TX: ${tx.transaction_hash?.substring(0, 8)}...`,
            type: 'transaction',
            group: 'transaction',
            size: 15,
            color: '#FFD700',
            hash: tx.transaction_hash
          };
          nodes.push(txNode);
          nodeMap.set(`tx_${index}`, txNode);

          // Link transaction to conversation
          links.push({
            id: `conv_tx_${index}`,
            source: 'conversation',
            target: `tx_${index}`,
            label: 'includes',
            strength: 0.9,
            color: '#FF6B35'
          });
        });
      }
    }

    setGraphData({ nodes, links });
  };

  const getNodeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'person': '#FF6B35',
      'organization': '#FF8C00', 
      'location': '#FFD700',
      'concept': '#FF4500',
      'entity': '#FF6B35',
      'default': '#FF6B35'
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  const getLinkColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'related': '#FF6B35',
      'connected': '#FF8C00',
      'influences': '#FFD700',
      'default': '#FF6B35'
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Beams */}
      <BackgroundBeams />
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className={`${sora.className} text-4xl font-bold text-white mb-2 transform -skew-x-12`}>
              Test Run Analysis
            </h1>
            <p className="text-gray-400">Knowledge Graph & Metrics Visualization</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading Analysis...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center">
              <p className="text-red-400 text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Knowledge Graph Section - Left */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-orange-500" />
                    <h2 className={`${sora.className} text-2xl font-bold text-white transform -skew-x-12`}>
                      Knowledge Graph
                    </h2>
                  </div>
                  {kgUrl && (
                    <a
                      href={kgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Source
                    </a>
                  )}
                </div>

                <div className="space-y-4">
                  {kgData && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-gray-400 text-sm mb-1">Entities</p>
                          <p className="text-white text-xl font-bold">
                            {graphData.nodes.length}
                          </p>
                        </div>
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-gray-400 text-sm mb-1">Connections</p>
                          <p className="text-white text-xl font-bold">
                            {graphData.links.length}
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Interactive Knowledge Graph</h3>
                        <div className="h-96 rounded-xl overflow-hidden bg-black/20">
                          {graphData.nodes.length > 0 ? (
                            <ForceGraph2D
                              ref={graphRef}
                              graphData={graphData}
                              nodeLabel={(node: any) => `${node.name} (${node.type})`}
                              linkLabel={(link: any) => link.label}
                              nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
                                const label = node.name;
                                const fontSize = 12/globalScale;
                                ctx.font = `${fontSize}px Sans-Serif`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = node.color;
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
                                ctx.fill();
                                
                                ctx.fillStyle = 'white';
                                ctx.fillText(label, node.x, node.y);
                              }}
                              linkColor={(link: any) => link.color}
                              linkWidth={(link: any) => link.strength * 2}
                              backgroundColor="transparent"
                              nodeRelSize={8}
                              cooldownTicks={100}
                              onNodeHover={(node: any) => {
                                if (node) {
                                  document.body.style.cursor = 'pointer';
                                } else {
                                  document.body.style.cursor = 'default';
                                }
                              }}
                              onNodeClick={(node: any) => {
                                console.log('Node clicked:', node);
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <div className="text-center">
                                <Database className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p>No graph data available</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Metrics Section - Right */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-orange-500" />
                    <h2 className={`${sora.className} text-2xl font-bold text-white transform -skew-x-12`}>
                      Metrics
                    </h2>
                  </div>
                  {metricsUrl && (
                    <a
                      href={metricsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Source
                    </a>
                  )}
                </div>

                <div className="space-y-4">
                  {metricsData && metricsData.metrics && (
                    <>
                      {/* Overall Score */}
                      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Overall Performance</h3>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-orange-500 mb-2">
                            {metricsData.metrics.summary?.overall_score?.toFixed(1) || 'N/A'}
                          </div>
                          <p className="text-gray-400">Final Performance Index</p>
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-gray-400 text-sm mb-1">Capability Score</p>
                          <p className="text-white text-xl font-bold">
                            {metricsData.metrics.metrics?.aggregate_scores?.capability_score || 'N/A'}%
                          </p>
                        </div>
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-gray-400 text-sm mb-1">Efficiency Score</p>
                          <p className="text-white text-xl font-bold">
                            {metricsData.metrics.metrics?.aggregate_scores?.efficiency_score?.toFixed(1) || 'N/A'}%
                          </p>
                        </div>
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-gray-400 text-sm mb-1">Reliability Score</p>
                          <p className="text-white text-xl font-bold">
                            {metricsData.metrics.metrics?.aggregate_scores?.reliability_score || 'N/A'}%
                          </p>
                        </div>
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-gray-400 text-sm mb-1">DeFi Reasoning</p>
                          <p className="text-white text-xl font-bold">
                            {metricsData.metrics.metrics?.aggregate_scores?.defi_reasoning_score?.toFixed(1) || 'N/A'}%
                          </p>
                        </div>
                      </div>

                      {/* Detailed Metrics */}
                      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Detailed Performance</h3>
                        <div className="space-y-4">
                          {/* Capability Metrics */}
                          <div>
                            <h4 className="text-orange-400 font-medium mb-2">Capability</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Action Success Rate:</span>
                                <span className="text-white">{metricsData.metrics.metrics?.capability?.action_success_rate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Contract Accuracy:</span>
                                <span className="text-white">{metricsData.metrics.metrics?.capability?.contract_interaction_accuracy}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Efficiency Metrics */}
                          <div>
                            <h4 className="text-orange-400 font-medium mb-2">Efficiency</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Avg Latency:</span>
                                <span className="text-white">{metricsData.metrics.metrics?.efficiency?.avg_execution_latency_ms?.toFixed(0)}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Gas Efficiency:</span>
                                <span className="text-white">{metricsData.metrics.metrics?.efficiency?.gas_efficiency_percent?.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* DeFi Metrics */}
                          <div>
                            <h4 className="text-orange-400 font-medium mb-2">DeFi Performance</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">DeFi Success Rate:</span>
                                <span className="text-white">{metricsData.metrics.metrics?.defi_reasoning?.defi_action_success_rate?.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Protocol Selection:</span>
                                <span className="text-white">{metricsData.metrics.metrics?.defi_reasoning?.protocol_selection_accuracy}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Improvement Areas */}
                      {metricsData.metrics.improvement_areas && (
                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                          <h3 className="text-white font-semibold mb-4">Improvement Areas</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {metricsData.metrics.improvement_areas.slice(0, 3).map((area: any, index: number) => (
                              <div key={index} className="p-3 bg-black/20 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">{area.area}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    area.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                    area.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {area.priority}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm">{area.suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


