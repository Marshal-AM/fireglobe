'use client';

import { useEffect, useState, useRef } from 'react';
import { Database, Activity, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { createKnowledgeGraphFromComprehensiveTestRun, createKnowledgeGraphFromConversation, KnowledgeGraphData } from '@/lib/knowledgeGraphStructure';

// Use the imported types from knowledgeGraphStructure

interface KnowledgeGraphVisualizationProps {
  conversationData: any; // Can be single conversation or comprehensive test run
  className?: string;
}

interface RawTransactionData {
  timestamp: string;
  raw_data: any;
  success: boolean;
}

export default function KnowledgeGraphVisualization({ 
  conversationData, 
  className = "" 
}: KnowledgeGraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const selectedNodeRef = useRef<any>(null);
  const currentNodesRef = useRef<any[]>([]);
  const [showRawTxModal, setShowRawTxModal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [copiedConversation, setCopiedConversation] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const [expandedConversations, setExpandedConversations] = useState<Set<number>>(new Set());
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedTransactionHash, setSelectedTransactionHash] = useState<string | null>(null);
  
  // Drag and zoom state
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Use refs for immediate updates without re-renders
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPanOffsetRef = useRef({ x: 0, y: 0 });

  // Light color palette - All unique colors with gradient style
  const colors = {
    testRun: '#FF6B35', // Orange - Central hub
    personality: '#FFB6C1', // Light Pink
    conversation: '#87CEEB', // Sky Blue
    timestamp: '#98FB98', // Pale Green
    action: '#DDA0DD', // Plum
    transaction: '#F0E68C', // Khaki
    amount: '#FFD700', // Gold
    gasMetrics: '#FF4500', // Orange Red
    balanceState: '#7FFFD4', // Aquamarine
    confirmations: '#32CD32', // Lime Green (darker)
    agentAnalysis: '#BA55D3', // Medium Orchid
    suggestedActions: '#FFA07A', // Light Salmon
    userRequest: '#FF69B4', // Deep Pink
    targetContract: '#4169E1', // Royal Blue
    link: '#DDA0DD', // Plum
    background: '#1a1a1a', // Dark background
    text: '#ffffff', // White
    accent: '#FFB6C1' // Light Pink
  };

  useEffect(() => {
    if (conversationData) {
      // Detect if this is a comprehensive test run or single conversation
      const isComprehensiveTestRun = conversationData.entry_type === 'comprehensive_test_run' || 
                                   (conversationData.entry && conversationData.entry.conversations);
      
      let processedData: KnowledgeGraphData;
      
      if (isComprehensiveTestRun) {
        processedData = createKnowledgeGraphFromComprehensiveTestRun(conversationData);
      } else {
        // Legacy single conversation format
        processedData = createKnowledgeGraphFromConversation(conversationData);
      }
      
      setGraphData(processedData);
    }
  }, [conversationData]);

  // Sync selectedNode to ref without triggering physics re-render
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);


  // Static rendering - no physics
  useEffect(() => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Filter entities to show only conversation nodes initially, plus test run
    const visibleEntities = graphData.entities.filter((entity: any) => {
      // Always show test run node
      if (entity.type === 'testRun') return true;
      
      // Show conversation nodes
      if (entity.type === 'conversation') return true;
      
      // Show connected nodes only if conversation is expanded
      if (entity.attributes?.conversationIndex !== undefined) {
        const convIndex = entity.attributes.conversationIndex;
        return expandedConversations.has(convIndex);
      }
      
      // Don't show global entities (including global transactions)
      return false;
    });

    // Calculate static positions
    const nodes = visibleEntities.map((entity: any, index: number) => {
      let x, y;
      
      if (entity.type === 'testRun') {
        // Test run node in center
        x = width / 2;
        y = height / 2;
      } else if (entity.attributes?.conversationIndex !== undefined) {
        // Conversation group positioning - evenly distributed around test run
        const convIndex = entity.attributes.conversationIndex;
        
        // Calculate total conversations for even distribution
        const totalConversations = Math.max(1, graphData.entities.filter(e => e.type === 'conversation').length);
        
        // Position conversations in a circle around the test run node
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 400; // Distance from center (increased for better spacing)
        
        let baseX, baseY;
        if (totalConversations === 1) {
          // Single conversation - position to the right of test run
          baseX = centerX + radius;
          baseY = centerY;
        } else {
          // Multiple conversations - distribute in circle
          const angle = (convIndex * 2 * Math.PI) / totalConversations;
          baseX = centerX + Math.cos(angle) * radius;
          baseY = centerY + Math.sin(angle) * radius;
        }
        
        // Don't apply pan offset to conversation nodes - keep distance constant
        // Pan offset will be applied during rendering via canvas transformations
        
        // Offset within the group based on entity type
        if (entity.type === 'conversation') {
          x = baseX; y = baseY; // Center of group
        } else if (entity.type === 'personality') {
          x = baseX - 140; y = baseY - 120; // Top-left of conversation
        } else if (entity.type === 'timestamp') {
          x = baseX + 140; y = baseY - 120; // Top-right of conversation
        } else if (entity.type === 'transaction') {
          x = baseX; y = baseY + 190; // Below conversation
        } else {
          x = baseX + (index % 2 === 0 ? -80 : 80); 
          y = baseY + 60;
        }
      } else {
          // Global entities around the test run
          const angle = (index * 2 * Math.PI) / Math.max(visibleEntities.length - 1, 1);
          const distance = 250;
          x = width / 2 + Math.cos(angle) * distance;
          y = height / 2 + Math.sin(angle) * distance;
        }
      
        return {
          ...entity,
          x,
          y,
          size: entity.type === 'testRun' ? 120 : 80
        };
    });

    // Store nodes for click detection
    currentNodesRef.current = nodes;

    // Draw the graph once
    const drawGraph = () => {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Apply transformations for zoom and pan
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      // Draw links
      graphData.relationships.forEach((link: any) => {
        const source = nodes.find((n: any) => n.id === link.source);
        const target = nodes.find((n: any) => n.id === link.target);
        
        if (source && target) {
          ctx.strokeStyle = colors.link;
          ctx.lineWidth = link.type === 'blocked' ? 2 : 3;
          ctx.setLineDash(link.type === 'blocked' ? [5, 5] : []);
          
          ctx.beginPath();
          ctx.moveTo(source.x!, source.y!);
          ctx.lineTo(target.x!, target.y!);
          ctx.stroke();
          
          ctx.setLineDash([]);
        }
      });

      // Draw nodes
      nodes.forEach((node: any) => {
        const isSelected = selectedNodeRef.current?.id === node.id;
        const nodeColor = colors[node.type as keyof typeof colors] || colors.accent;
        const nodeSize = isSelected ? node.size! + 10 : node.size!;
        
        // Simple glow for selected node
        if (isSelected) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#FFD700';
        } else {
          ctx.shadowBlur = 0;
        }

        // Node circle
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = isSelected ? '#FFD700' : '#000000';
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = colors.text;
        ctx.font = `${isSelected ? '24' : '18'}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x!, node.y! + nodeSize + 30);
        
        // Add expansion indicator for conversation nodes
        if (node.type === 'conversation' && node.attributes?.conversationIndex !== undefined) {
          const convIndex = node.attributes.conversationIndex;
          const isExpanded = expandedConversations.has(convIndex);
          
          ctx.fillStyle = isExpanded ? '#32CD32' : '#FFD700';
          ctx.font = '20px system-ui, -apple-system, sans-serif';
          ctx.fillText(isExpanded ? '−' : '+', node.x!, node.y! - nodeSize - 15);
        }
      });

      // Restore transformations
      ctx.restore();
    };

    drawGraph();
  }, [graphData, expandedConversations, panOffset, zoomLevel, selectedNode]);


  // Handle mouse click
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Mark mouse as pressed down
    setIsMouseDown(true);
    setIsDragging(false);
    setHasDragged(false);
    
    // Store drag start position in ref for immediate access
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    lastPanOffsetRef.current = { ...panOffset };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle mouse move if mouse is pressed down
    if (!isMouseDown) return;
    
    if (!isDragging) {
      // Check if we've moved enough to start dragging
      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) { // Small threshold for dragging
        setIsDragging(true);
        setHasDragged(true);
      }
    }
    
    if (isDragging) {
      // Calculate new pan offset based on last known position + current drag
      const newPanOffset = {
        x: lastPanOffsetRef.current.x + (event.clientX - dragStartRef.current.x),
        y: lastPanOffsetRef.current.y + (event.clientY - dragStartRef.current.y)
      };
      setPanOffset(newPanOffset);
    }
  };

  const handleMouseUp = () => {
    // Reset all dragging states immediately
    setIsMouseDown(false);
    setIsDragging(false);
    setHasDragged(false);
    
    // Update the last pan offset ref to current state
    lastPanOffsetRef.current = { ...panOffset };
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    // More responsive zoom for trackpad
    const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel * zoomFactor));
    setZoomLevel(newZoom);
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't handle clicks if we were dragging
    if (hasDragged) return;
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates based on canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    // Convert to world coordinates (account for pan and zoom)
    const worldX = (scaledX - panOffset.x) / zoomLevel;
    const worldY = (scaledY - panOffset.y) / zoomLevel;

    // Use current node positions
    const nodes = currentNodesRef.current;

    // Find clicked node with generous hit detection
    const clickedNode = nodes.find((node: any) => {
      if (node.x === undefined || node.y === undefined) return false;
      
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Generous hit detection
      const threshold = (node.size! / 2) + 40;
      return distance < threshold;
    });

    if (clickedNode) {
      // Immediate state update
      setSelectedNode(clickedNode);
      selectedNodeRef.current = clickedNode;
      
      // Handle conversation expansion
      if (clickedNode.type === 'conversation' && clickedNode.attributes?.conversationIndex !== undefined) {
        const convIndex = clickedNode.attributes.conversationIndex;
        setExpandedConversations(prev => {
          const newSet = new Set(prev);
          if (newSet.has(convIndex)) {
            newSet.delete(convIndex); // Collapse if already expanded
    } else {
            newSet.add(convIndex); // Expand if collapsed
          }
          return newSet;
        });
      }
      
      // Set selected IDs for modal filtering
      if (clickedNode.type === 'conversation') {
        setSelectedConversationId(clickedNode.attributes?.id || null);
      } else if (clickedNode.type === 'transaction') {
        setSelectedTransactionHash(clickedNode.attributes?.hash || null);
      }
    } else {
      console.log('Clicked empty area - deselecting');
      setSelectedNode(null);
      selectedNodeRef.current = null;
    }
  };

  if (!graphData) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Loading Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Graph Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white text-sm mb-1">Entities</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalEntities}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white text-sm mb-1">Relationships</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalRelationships}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white text-sm mb-1">Conversations</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalConversations || 1}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white text-sm mb-1">Network</p>
          <p className="text-white text-sm font-mono">Base Sepolia</p>
        </div>
      </div>

      {/* Interactive Knowledge Graph */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">
            {graphData.metadata.totalConversations && graphData.metadata.totalConversations > 1 
              ? `Multi-Conversation DeFi Knowledge Graph` 
              : `DeFi Transaction Knowledge Graph`}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {expandedConversations.size} of {graphData.metadata.totalConversations || 1} conversations expanded
            </span>
            <button
              onClick={() => setExpandedConversations(new Set())}
              className="px-3 py-1 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-600 transition-all"
            >
              Collapse All
            </button>
          </div>
        </div>
        {graphData.metadata.personalities && graphData.metadata.personalities.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">Personalities:</p>
            <div className="flex flex-wrap gap-2">
              {graphData.metadata.personalities.map((personality: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs border border-orange-500/30">
                  {personality}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden mb-6">
            <canvas
              ref={canvasRef}
              width={1600}
              height={900}
              className="w-full h-auto cursor-grab active:cursor-grabbing"
              onClick={handleMouseClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
        </div>
        
        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mb-4">
          <p>Click conversation nodes to expand/collapse their details. Click other nodes to view their information.</p>
          <p>Drag to pan the graph. Use mouse wheel to zoom in/out.</p>
        </div>
        
        {/* Legend - Outside graph container */}
        <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-4">
          <h4 className="text-white font-medium mb-3 text-sm">Legend</h4>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {/* Only show node types that are currently visible */}
            {graphData && Array.from(new Set(graphData.entities.map(e => e.type))).map((nodeType) => {
              if (!colors[nodeType as keyof typeof colors]) return null;
              
              return (
                <div key={nodeType} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[nodeType as keyof typeof colors] }} />
                  <span className="text-sm text-gray-300 capitalize">
                    {nodeType === 'testRun' ? 'Test Run' : 
                     nodeType === 'gasMetrics' ? 'Gas Metrics' :
                     nodeType === 'balanceState' ? 'Balance State' :
                     nodeType === 'agentAnalysis' ? 'Agent Analysis' :
                     nodeType === 'suggestedActions' ? 'Suggested Actions' :
                     nodeType === 'userRequest' ? 'User Request' :
                     nodeType === 'targetContract' ? 'Target Contract' :
                     nodeType}
                  </span>
            </div>
              );
            })}
            
            {/* Relationship Lines - always show */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-300">
                <span className="inline-block w-8 h-0.5 bg-purple-400 mr-2"></span>
                Completed
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-300 flex items-center">
                <span className="inline-block w-8 h-0.5 border-t-2 border-dashed border-purple-400 mr-2"></span>
                Blocked/Failed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mt-4 backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[selectedNode.type as keyof typeof colors] }} />
              {selectedNode.label}
            </h3>
            {selectedNode.type === 'transaction' && (
              <button
                onClick={() => setShowRawTxModal(true)}
                className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg transition-all duration-200 hover:bg-gray-900 border border-white/20"
              >
                Raw tx data
              </button>
            )}
            {selectedNode.type === 'conversation' && (
              <button
                onClick={() => setShowConversationModal(true)}
                className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg transition-all duration-200 hover:bg-gray-900 border border-white/20"
              >
                View Conversation
              </button>
            )}
            {selectedNode.type === 'agentAnalysis' && (
              <button
                onClick={() => setShowAnalysisModal(true)}
                className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg transition-all duration-200 hover:bg-gray-900 border border-white/20"
              >
                View Analysis
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-3">Type: {selectedNode.type}</p>
          <div className="space-y-2">
            {Object.entries(selectedNode.attributes).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="text-white">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Transaction Data Modal */}
      {showRawTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-[90vh] backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white transform -skew-x-12">
                Raw Transaction Data
              </h3>
              <button
                onClick={() => setShowRawTxModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {(() => {
                  // Get transactions based on data structure
                  const isComprehensiveTestRun = conversationData.entry_type === 'comprehensive_test_run' || 
                                               (conversationData.entry && conversationData.entry.conversations);
                  
                  let transactions: any[] = [];
                  if (isComprehensiveTestRun) {
                    // Get all transactions from all conversations plus global transactions
                    const convTransactions = conversationData.entry?.conversations?.flatMap((conv: any) => 
                      (conv.transactions || []).map((tx: any, index: number) => ({
                        ...tx,
                        conversationId: conv.conversation_id,
                        personality: conv.personality_name,
                        isFromConversation: true
                      }))
                    ) || [];
                    const globalTransactions = (conversationData.entry?.transactions || []).map((tx: any) => ({
                      ...tx,
                      isGlobal: true
                    }));
                    transactions = [...convTransactions, ...globalTransactions];
                  } else {
                    // Legacy single conversation format
                    transactions = conversationData.entry?.transactions || [];
                  }
                  
                  // Filter to show only selected transaction if one is selected
                  const filteredTransactions = selectedTransactionHash 
                    ? transactions.filter(tx => tx.transaction_hash === selectedTransactionHash)
                    : transactions;
                  
                  return filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx: any, index: number) => (
                    <div key={index} className="space-y-4">
                      {/* Transaction Header */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/20 rounded-xl p-4">
                        <div>
                          <h4 className="text-orange-400 font-bold text-lg">Transaction #{index + 1}</h4>
                          <p className="text-gray-400 text-xs mt-1">
                            {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                          </p>
                          {tx.personality && (
                            <p className="text-blue-400 text-xs mt-1">
                              Personality: {tx.personality}
                            </p>
                          )}
                          {tx.conversationId && (
                            <p className="text-purple-400 text-xs mt-1">
                              Conversation: {tx.conversationId.substring(0, 12)}...
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            tx.success ? 'bg-black text-green-400 border border-white/20' : 'bg-black text-red-400 border border-white/20'
                          }`}>
                            {tx.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(tx.raw_data, null, 2));
                              setCopiedIndex(index);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className="px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-all border border-white/20"
                          >
                            {copiedIndex === index ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* Raw Data Display */}
                      {tx.raw_data && (
                        <div className="bg-black/50 rounded-xl p-4 border border-white/10">
                          <pre className="text-xs text-green-400 font-mono overflow-auto max-h-[500px]">
                            {JSON.stringify(tx.raw_data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Transaction Summary Cards */}
                      {tx.raw_data?.data && (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Basic Info */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h5 className="text-orange-400 font-semibold mb-3">Basic Information</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Block:</span>
                                <span className="text-white font-mono">{tx.raw_data.data.block_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Position:</span>
                                <span className="text-white">{tx.raw_data.data.position}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Confirmations:</span>
                                <span className="text-white">{tx.raw_data.data.confirmations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Type:</span>
                                <span className="text-white">{tx.raw_data.data.type}</span>
                              </div>
                            </div>
                          </div>

                          {/* Gas Info */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h5 className="text-orange-400 font-semibold mb-3">Gas Details</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Gas Used:</span>
                                <span className="text-white font-mono">{tx.raw_data.data.gas_used}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Gas Limit:</span>
                                <span className="text-white font-mono">{tx.raw_data.data.gas_limit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Gas Price:</span>
                                <span className="text-white font-mono">{tx.raw_data.data.gas_price}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Fee:</span>
                                <span className="text-white font-mono">{tx.raw_data.data.fee?.value}</span>
                              </div>
                            </div>
                          </div>

                          {/* Method Call */}
                          {tx.raw_data.data.decoded_input && (
                            <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/10">
                              <h5 className="text-orange-400 font-semibold mb-3">Decoded Method Call</h5>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-gray-400 text-sm">Method:</span>
                                  <p className="text-white font-mono text-sm mt-1">{tx.raw_data.data.decoded_input.method_call}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400 text-sm">Parameters:</span>
                                  <div className="mt-2 space-y-2">
                                    {tx.raw_data.data.decoded_input.parameters?.map((param: any, pIndex: number) => (
                                      <div key={pIndex} className="bg-black/30 rounded p-2">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-blue-400">{param.name} ({param.type}):</span>
                                          <span className="text-white font-mono">{param.value}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {index < transactions.length - 1 && (
                        <div className="border-t border-white/10 my-6"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No raw transaction data available</p>
                  </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {showConversationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-[90vh] backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white transform -skew-x-12">
                Conversation History
              </h3>
              <button
                onClick={() => setShowConversationModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {(() => {
                  // Get conversations based on data structure
                  const isComprehensiveTestRun = conversationData.entry_type === 'comprehensive_test_run' || 
                                               (conversationData.entry && conversationData.entry.conversations);
                  
                  let conversations: any[] = [];
                  if (isComprehensiveTestRun) {
                    conversations = conversationData.entry?.conversations || [];
                  } else {
                    // Legacy single conversation format
                    conversations = conversationData.entry?.messages ? [conversationData.entry] : [];
                  }
                  
                  // Filter to show only selected conversation if one is selected
                  const filteredConversations = selectedConversationId 
                    ? conversations.filter(conv => conv.conversation_id === selectedConversationId)
                    : conversations;
                  
                  return filteredConversations.length > 0 ? (
                    filteredConversations.map((conv: any, convIndex: number) => (
                      <div key={convIndex} className="space-y-4">
                    {/* Conversation Header */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/20 rounded-xl p-4">
                      <div>
                        <h4 className="text-blue-400 font-bold text-lg">
                              Conversation {convIndex + 1}: {conv.conversation_id?.substring(0, 8)}...
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">
                              {conv.messages?.length || 0} messages
                        </p>
                            {conv.personality_name && (
                              <p className="text-purple-400 text-xs mt-1">
                                Personality: {conv.personality_name}
                              </p>
                            )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg text-sm font-bold bg-black text-blue-400 border border-white/20">
                          ACTIVE
                        </span>
                        <button
                          onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(conv.messages, null, 2));
                            setCopiedConversation(true);
                            setTimeout(() => setCopiedConversation(false), 2000);
                          }}
                          className="px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-all border border-white/20"
                        >
                          {copiedConversation ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Messages Display */}
                    <div className="space-y-4">
                          {conv.messages?.map((message: any, index: number) => (
                        <div 
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${
                            message.role === 'user' 
                              ? 'bg-white/10 border-orange-400/40' 
                              : 'bg-white/5 border-blue-400/40'
                          } backdrop-blur-xl rounded-2xl p-4 border`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold transform -skew-x-12 ${
                                message.role === 'user' ? 'text-orange-400' : 'text-blue-400'
                              }`}>
                                {message.role === 'user' ? 'User' : 'Agent'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-white text-sm leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                        
                        {convIndex < conversations.length - 1 && (
                          <div className="border-t border-white/10 my-6"></div>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No conversation data available</p>
                  </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-[90vh] backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white transform -skew-x-12">
                Agent Analysis
              </h3>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {(() => {
                  // Get transactions with analysis based on data structure
                  const isComprehensiveTestRun = conversationData.entry_type === 'comprehensive_test_run' || 
                                               (conversationData.entry && conversationData.entry.conversations);
                  
                  let transactions: any[] = [];
                  if (isComprehensiveTestRun) {
                    // Get all transactions from all conversations plus global transactions
                    const convTransactions = conversationData.entry?.conversations?.flatMap((conv: any) => 
                      (conv.transactions || []).map((tx: any) => ({
                        ...tx,
                        conversationId: conv.conversation_id,
                        personality: conv.personality_name,
                        isFromConversation: true
                      }))
                    ) || [];
                    const globalTransactions = (conversationData.entry?.transactions || []).map((tx: any) => ({
                      ...tx,
                      isGlobal: true
                    }));
                    transactions = [...convTransactions, ...globalTransactions];
                  } else {
                    // Legacy single conversation format
                    transactions = conversationData.entry?.transactions || [];
                  }
                  
                  // Filter to show only selected transaction if one is selected
                  const filteredTransactions = selectedTransactionHash 
                    ? transactions.filter(tx => tx.transaction_hash === selectedTransactionHash)
                    : transactions;
                  
                  return filteredTransactions.length > 0 ? (
                  <>
                    {/* Analysis Header */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/20 rounded-xl p-4">
                      <div>
                        <h4 className="text-purple-400 font-bold text-lg">Transaction Analysis Report</h4>
                        <p className="text-gray-400 text-xs mt-1">
                            {filteredTransactions.length} transaction(s) analyzed
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg text-sm font-bold bg-black text-purple-400 border border-white/20">
                          COMPLETE
                        </span>
                        <button
                          onClick={() => {
                              const analysisText = transactions.map((tx: any) => 
                              tx.analysis || 'No analysis available'
                            ).join('\n\n');
                            navigator.clipboard.writeText(analysisText);
                            setCopiedAnalysis(true);
                            setTimeout(() => setCopiedAnalysis(false), 2000);
                          }}
                          className="px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-all border border-white/20"
                        >
                          {copiedAnalysis ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Analysis Display */}
                    <div className="space-y-4">
                        {filteredTransactions.map((tx: any, index: number) => (
                        <div key={index} className="bg-white/5 border-purple-400/40 backdrop-blur-xl rounded-2xl p-5 border">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-bold transform -skew-x-12 text-purple-400">
                              Analysis
                            </span>
                            <span className="text-xs text-gray-400">
                              Transaction #{index + 1}
                            </span>
                              {tx.personality && (
                                <span className="text-xs text-blue-400">
                                  ({tx.personality})
                                </span>
                              )}
                          </div>
                          <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                            {tx.analysis || 'No analysis data available for this transaction.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No analysis data available</p>
                  </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}