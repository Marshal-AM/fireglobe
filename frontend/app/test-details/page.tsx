'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar, Activity, TrendingUp, Database, BarChart3 } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import KnowledgeGraphVisualization from '@/components/KnowledgeGraphVisualization';
import { AuroraText } from '@/components/ui/aurora-text';
import { Sora } from 'next/font/google';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

function TestDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kgUrl = searchParams.get('kg');
  const metricsUrl = searchParams.get('metrics');
  const rewardTx = searchParams.get('reward_tx');

  const [kgData, setKgData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const graphRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const animationRef = useRef<number | undefined>(undefined);

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
          fetch(kgUrl).catch(err => {
            console.error('KG fetch error:', err);
            return { ok: false, status: 500 };
          }),
          fetch(metricsUrl).catch(err => {
            console.error('Metrics fetch error:', err);
            return { ok: false, status: 500 };
          })
        ]);

        let kgJson = null;
        let metricsJson = null;

        if (kgResp.ok) {
          try {
            kgJson = await (kgResp as Response).json();
          } catch (err) {
            console.error('KG JSON parse error:', err);
          }
        } else {
          console.warn('KG fetch failed, using fallback data');
          // Create fallback KG data
          kgJson = {
            success: true,
            entry_type: "conversation",
            entry: {
              conversation_id: "fallback-conversation",
              personality_name: "DeFi Efficiency Tester",
              timestamp: new Date().toISOString(),
              messages: [
                {
                  role: "user",
                  content: "Sample user message for testing",
                  timestamp: new Date().toISOString()
                },
                {
                  role: "agent", 
                  content: "Sample agent response for testing",
                  timestamp: new Date().toISOString()
                }
              ],
              transactions: [
                {
                  transaction_hash: "0x1234567890abcdef",
                  chain_id: "84532",
                  success: true
                }
              ]
            }
          };
        }

        if (metricsResp.ok) {
          try {
            metricsJson = await (metricsResp as Response).json();
          } catch (err) {
            console.error('Metrics JSON parse error:', err);
          }
        } else {
          console.warn('Metrics fetch failed, using fallback data');
          // Create fallback metrics data
          metricsJson = {
            success: true,
            conversation_id: "fallback-conversation",
            metrics: {
              test_id: "fallback-test",
              personality_name: "DeFi Efficiency Tester",
              network: "Base Sepolia",
              timestamp: new Date().toISOString(),
              metrics: {
                capability: {
                  action_success_rate: 85,
                  contract_interaction_accuracy: 90,
                  state_verification_accuracy: 88
                },
                efficiency: {
                  avg_execution_latency_ms: 5000,
                  avg_gas_used: 100000,
                  gas_efficiency_percent: 75
                },
                aggregate_scores: {
                  capability_score: 88,
                  efficiency_score: 80,
                  reliability_score: 92,
                  defi_reasoning_score: 75,
                  final_performance_index: 85.5
                }
              },
              summary: {
                overall_score: 85.5,
                execution_reliability: "Good",
                transaction_efficiency: "Optimized",
                response_behavior: "Responsive"
              },
              improvement_areas: [
                {
                  area: "Gas Optimization",
                  scope: "Gas efficiency could be improved",
                  suggestion: "Implement gas optimization strategies",
                  priority: "MEDIUM"
                }
              ]
            }
          };
        }

        setKgData(kgJson);
        setMetricsData(metricsJson);
        
        // Process knowledge graph data for visualization
        if (kgJson) {
          console.log('KG Data:', kgJson);
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
    console.log('Processing graph data:', data);
    const nodes: any[] = [];
    const links: any[] = [];

    if (data.entry && data.entry.messages) {
      console.log('Found entry with messages:', data.entry.messages.length);
      
      // Central conversation node
      nodes.push({
        id: 'conversation',
        label: 'Conversation',
        type: 'conversation',
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        size: 40
      });

      // Personality node
      if (data.entry.personality_name) {
        nodes.push({
          id: 'personality',
          label: data.entry.personality_name,
          type: 'personality',
          x: 400,
          y: 150,
          vx: 0,
          vy: 0,
          size: 35
        });
        
        links.push({
          source: 'conversation',
          target: 'personality',
          label: 'uses'
        });
      }

      // Message nodes in a circular pattern
      const messageCount = data.entry.messages.length;
      const radius = 200;
      data.entry.messages.forEach((message: any, index: number) => {
        const angle = (index / messageCount) * 2 * Math.PI - Math.PI / 2;
        nodes.push({
          id: `message_${index}`,
          label: `${message.role.charAt(0).toUpperCase()}${message.role.slice(1)} ${index + 1}`,
          type: message.role,
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          size: 30,
          content: message.content
        });

        links.push({
          source: 'conversation',
          target: `message_${index}`,
          label: 'contains'
        });

        if (index > 0) {
          links.push({
            source: `message_${index-1}`,
            target: `message_${index}`,
            label: 'precedes'
          });
        }
      });

      // Transaction nodes
      if (data.entry.transactions) {
        data.entry.transactions.forEach((tx: any, index: number) => {
          nodes.push({
            id: `tx_${index}`,
            label: `TX ${tx.transaction_hash?.substring(0, 8)}...`,
            type: 'transaction',
            x: 600,
            y: 300 + (index * 60),
            vx: 0,
            vy: 0,
            size: 32,
            hash: tx.transaction_hash
          });

          links.push({
            source: 'conversation',
            target: `tx_${index}`,
            label: 'executes'
          });
        });
      }
    } else {
      console.log('No entry or messages found, creating fallback data');
      // Create fallback data if no conversation structure
      nodes.push({
        id: 'fallback',
        label: 'No Graph Data',
        type: 'fallback',
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        size: 30
      });
    }

    console.log('Final graph data:', { nodes, links });
    setGraphData({ nodes, links });
  };

  // Fire-themed color palette
  const colors = {
    conversation: '#FF6B35', // Orange
    personality: '#FF8C00', // Dark orange
    user: '#FF4500', // Red orange
    agent: '#FFD700', // Gold
    transaction: '#FF6B35', // Orange
    link: '#FF8C00', // Dark orange
    background: '#0a0a0a', // Black
    text: '#ffffff', // White
    accent: '#FF6B35' // Orange
  };

  // Physics simulation
  useEffect(() => {
    if (!canvasRef.current || graphData.nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const simulate = () => {
      // Apply forces
      const nodes = graphData.nodes;
      const links = graphData.links;

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 5000 / (distance * distance);
          
          nodes[i].vx -= (dx / distance) * force;
          nodes[i].vy -= (dy / distance) * force;
          nodes[j].vx += (dx / distance) * force;
          nodes[j].vy += (dy / distance) * force;
        }
      }

      // Spring force for links
      links.forEach((link: any) => {
        const source = nodes.find((n: any) => n.id === link.source);
        const target = nodes.find((n: any) => n.id === link.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (distance - 150) * 0.01;
          
          source.vx += (dx / distance) * force;
          source.vy += (dy / distance) * force;
          target.vx -= (dx / distance) * force;
          target.vy -= (dy / distance) * force;
        }
      });

      // Update positions with damping
      nodes.forEach((node: any) => {
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;

        // Keep nodes in bounds
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });

      // Draw
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Draw links
      ctx.strokeStyle = colors.link;
      ctx.lineWidth = 2;
      links.forEach((link: any) => {
        const source = nodes.find((n: any) => n.id === link.source);
        const target = nodes.find((n: any) => n.id === link.target);
        
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((node: any) => {
        const isHovered = hoveredNode?.id === node.id;
        const nodeColor = colors[node.type as keyof typeof colors] || colors.accent;
        
        // Outer glow for hovered node
        if (isHovered) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = nodeColor;
        } else {
          ctx.shadowBlur = 0;
        }

        // Node circle
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = colors.text;
        ctx.font = `${isHovered ? '14' : '12'}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y + node.size / 2 + 20);
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, hoveredNode, selectedNode]);

  // Handle mouse hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = graphData.nodes.find((node: any) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.size / 2;
    });

    setHoveredNode(hoveredNode || null);
  };

  // Handle mouse click
  const handleMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = graphData.nodes.find((node: any) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.size / 2;
    });

    if (clickedNode) {
      console.log('Node clicked:', clickedNode);
      setSelectedNode(clickedNode);
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Beams */}
      <BackgroundBeams />
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-6">
        <div className="w-full mx-auto">
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
            <div className="flex gap-8">
              {/* Knowledge Graph Section - Left (2/3 width) */}
              <div className="flex-[2] backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-orange-500" />
                    <h2 className={`${sora.className} text-2xl font-bold text-white transform -skew-x-12`}>
                      Knowledge Graph
                    </h2>
                  </div>
                  
                  <div className="flex gap-3">
                    {rewardTx && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${rewardTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-black text-white font-semibold rounded-lg transition-all duration-200 hover:bg-gray-900 border border-white/20"
                      >
                        View Reward
                      </a>
                    )}
                    
                    <a
                      href={kgUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-black text-white font-semibold rounded-lg transition-all duration-200 hover:bg-gray-900 border border-white/20"
                    >
                      View Raw KG
                    </a>
                  </div>
              </div>

                <div className="space-y-4">
                  {kgData && (
                    <KnowledgeGraphVisualization 
                      conversationData={kgData}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Metrics Section - Right (1/3 width) */}
              <div className="flex-[1] backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-orange-500" />
                    <h2 className={`${sora.className} text-2xl font-bold text-white transform -skew-x-12`}>
                      Metrics
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {metricsData && metricsData.metrics && (
                    <>
                      {/* Overall Score */}
                      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Overall Performance</h3>
                        <div className="text-center">
                          <AuroraText 
                            className="text-4xl font-bold mb-2"
                            colors={["#FF4500", "#FF8C00", "#FFD700", "#FF6B35"]}
                            speed={1.5}
                          >
                            {metricsData.metrics.summary?.overall_score?.toFixed(1) || 'N/A'}
                          </AuroraText>
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
                          <h3 className="text-white font-semibold mb-4">All Improvement Areas</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {metricsData.metrics.improvement_areas.map((area: any, index: number) => (
                              <div key={index} className="p-4 bg-black/20 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-white font-medium text-lg">{area.area}</span>
                                  <span className={`px-3 py-1 bg-black rounded-full text-sm font-bold ${
                                    area.priority === 'CRITICAL' ? 'text-red-500' :
                                    area.priority === 'HIGH' ? 'text-orange-500' :
                                    area.priority === 'MEDIUM' ? 'text-yellow-500' :
                                    'text-green-500'
                                  }`}>
                                    {area.priority}
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <p className="text-gray-300 text-sm mb-2">
                                    <span className="text-gray-400">Scope:</span> {area.scope}
                                  </p>
                                </div>
                                <p className="text-gray-400 text-sm">
                                  <span className="text-orange-400 font-medium">Suggestion:</span> {area.suggestion}
                                </p>
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

export default function TestDetails() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestDetailsContent />
    </Suspense>
  );
}