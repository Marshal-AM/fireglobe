'use client';

import { useEffect, useState, useRef } from 'react';
import { Database, Activity, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { createKnowledgeGraphFromConversation, KnowledgeGraphData } from '@/lib/knowledgeGraphStructure';

// Use the imported types from knowledgeGraphStructure

interface KnowledgeGraphVisualizationProps {
  conversationData: any;
  className?: string;
}

export default function KnowledgeGraphVisualization({ 
  conversationData, 
  className = "" 
}: KnowledgeGraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const currentNodesRef = useRef<any[]>([]);
  const originalPositionsRef = useRef<{ x: number; y: number }[]>([]);

  // Light color palette
  const colors = {
    personality: '#FFB6C1', // Light Pink
    conversation: '#87CEEB', // Sky Blue
    timestamp: '#98FB98', // Light Green
    action: '#DDA0DD', // Plum
    transaction: '#F0E68C', // Khaki
    amount: '#FFB6C1', // Light Pink
    gasMetrics: '#87CEEB', // Sky Blue
    balanceState: '#98FB98', // Light Green
    confirmations: '#90EE90', // Light Green
    agentAnalysis: '#DDA0DD', // Plum
    suggestedActions: '#F0E68C', // Khaki
    userRequest: '#FFB6C1', // Light Pink
    targetContract: '#87CEEB', // Sky Blue
    link: '#DDA0DD', // Plum
    background: '#1a1a1a', // Dark background
    text: '#ffffff', // White
    accent: '#FFB6C1' // Light Pink
  };

  useEffect(() => {
    if (conversationData) {
      const processedData = createKnowledgeGraphFromConversation(conversationData);
      setGraphData(processedData);
    }
  }, [conversationData]);


  // Physics simulation
  useEffect(() => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Calculate grid dimensions for even distribution
    const nodeCount = graphData.entities.length;
    const cols = Math.ceil(Math.sqrt(nodeCount * (width / height)));
    const rows = Math.ceil(nodeCount / cols);
    
    // Calculate spacing
    const paddingX = 150;
    const paddingY = 150;
    const spaceX = (width - 2 * paddingX) / (cols - 1 || 1);
    const spaceY = (height - 2 * paddingY) / (rows - 1 || 1);

    // Convert entities to nodes with grid-based positioning
    const nodes = graphData.entities.map((entity: any, index: number) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      // Add some randomness to avoid perfect grid
      const randomOffsetX = (Math.random() - 0.5) * 50;
      const randomOffsetY = (Math.random() - 0.5) * 50;
      
      return {
        ...entity,
        x: entity.x || paddingX + col * spaceX + randomOffsetX,
        y: entity.y || paddingY + row * spaceY + randomOffsetY,
        vx: entity.vx || 0,
        vy: entity.vy || 0,
        size: entity.size || 70 // Larger nodes for better visibility and easier clicking
      };
    });

    let frameCount = 0;
    const stabilizationFrames = 150; // Initial settling period
    const links = graphData.relationships;
    
    // Store original positions for floating animation in ref (only once)
    if (originalPositionsRef.current.length === 0) {
      originalPositionsRef.current = nodes.map(node => ({ x: node.x!, y: node.y! }));
    }
    
    const simulate = () => {
      frameCount++;
      
      // Store current node positions for click detection
      currentNodesRef.current = nodes;
      
      const isStabilized = frameCount > stabilizationFrames;

      if (!isStabilized) {
        // Initial physics simulation to settle nodes
        // MUCH WEAKER repulsion to keep grid-like structure
        for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x! - nodes[i].x!;
          const dy = nodes[j].y! - nodes[i].y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDistance = (nodes[i].size! + nodes[j].size!) / 2 + 40;
          
          // Only apply force if too close
          if (distance < minDistance) {
            const force = 3000 / (distance * distance);
            nodes[i].vx! -= (dx / distance) * force;
            nodes[i].vy! -= (dy / distance) * force;
            nodes[j].vx! += (dx / distance) * force;
            nodes[j].vy! += (dy / distance) * force;
          }
        }
      }

      // VERY WEAK spring force for links - just to suggest connections
      links.forEach((link: any) => {
        const source = nodes.find((n: any) => n.id === link.source);
        const target = nodes.find((n: any) => n.id === link.target);
        
        if (source && target) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDistance = 250;
          const force = (distance - idealDistance) * 0.005; // Very weak force
          
          source.vx! += (dx / distance) * force;
          source.vy! += (dy / distance) * force;
          target.vx! -= (dx / distance) * force;
          target.vy! -= (dy / distance) * force;
        }
      });

        // Update positions with strong damping to stabilize quickly
        nodes.forEach((node) => {
          node.vx! *= 0.92; // Strong damping
          node.vy! *= 0.92;
          node.x! += node.vx!;
          node.y! += node.vy!;

          // Keep nodes in bounds with padding
          node.x = Math.max(100, Math.min(width - 100, node.x!));
          node.y = Math.max(100, Math.min(height - 100, node.y!));
        });
      } else {
        // After stabilization: smooth floating animation
        const time = frameCount * 0.02; // Slow time progression
        
        nodes.forEach((node, index) => {
          // Update original positions from ref after settling (once)
          if (frameCount === stabilizationFrames + 1) {
            originalPositionsRef.current[index] = { x: node.x!, y: node.y! };
          }
          
          // Each node has unique floating pattern based on its index
          const offsetX = Math.sin(time + index * 0.5) * 8; // Float left-right (8px range)
          const offsetY = Math.cos(time + index * 0.7) * 6; // Float up-down (6px range)
          
          // Apply smooth floating to original positions from ref
          node.x = originalPositionsRef.current[index].x + offsetX;
          node.y = originalPositionsRef.current[index].y + offsetY;
        });
      }

      // Draw the graph
      drawGraph();

      animationRef.current = requestAnimationFrame(simulate);
    };
    
    // Separate drawing function
    const drawGraph = () => {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Draw links
      links.forEach((link: any) => {
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
        const isSelected = selectedNode?.id === node.id;
        const nodeColor = colors[node.type as keyof typeof colors] || colors.accent;
        
        // Outer glow for selected node only
        if (isSelected) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = nodeColor;
        } else {
          ctx.shadowBlur = 0;
        }

        // Node circle
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, node.size! / 2, 0, Math.PI * 2);
        ctx.fill();

        // Node border - black outline for all nodes
        ctx.strokeStyle = isSelected ? '#FFD700' : '#000000';
        ctx.lineWidth = isSelected ? 4 : 3;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Label with better positioning and larger font
        ctx.fillStyle = colors.text;
        ctx.font = `${isSelected ? '26' : '20'}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelY = node.y! + node.size! / 2 + 42;
        const labelX = node.x!;
        
        // Add background for better readability
        const textMetrics = ctx.measureText(node.label);
        const textWidth = textMetrics.width;
        const textHeight = 18;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(labelX - textWidth/2 - 5, labelY - textHeight/2 - 3, textWidth + 10, textHeight + 6);
        
        ctx.fillStyle = colors.text;
        ctx.fillText(node.label, labelX, labelY);
      });
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, selectedNode]);


  // Handle mouse click
  const handleMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    // Use current node positions from the physics simulation
    const nodes = currentNodesRef.current;

    // Find ALL nodes under the click point
    const clickedNodes = nodes.filter((node: any) => {
      const dx = scaledX - node.x!;
      const dy = scaledY - node.y!;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Larger click radius for easier selection
      return distance < (node.size! / 2) + 10;
    });

    if (clickedNodes.length > 0) {
      // If multiple nodes overlap, pick the last one (drawn on top)
      const clickedNode = clickedNodes[clickedNodes.length - 1];
      console.log('Node clicked:', clickedNode);
      setSelectedNode(clickedNode);
    } else {
      setSelectedNode(null);
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
      <div className="grid grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm mb-1">Entities</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalEntities}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm mb-1">Relationships</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalRelationships}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm mb-1">Network</p>
          <p className="text-white text-sm font-mono">Base Sepolia</p>
        </div>
      </div>

      {/* Interactive Knowledge Graph */}
      <div className="w-full">
        <h3 className="text-white font-semibold mb-4">DeFi Transaction Knowledge Graph</h3>
        <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden mb-6">
            <canvas
              ref={canvasRef}
              width={1600}
              height={900}
              className="w-full h-auto cursor-pointer"
              onClick={handleMouseClick}
            />
        </div>
        
        {/* Legend - Outside graph container */}
        <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-4">
          <h4 className="text-white font-medium mb-3 text-sm">Legend</h4>
          <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.personality }} />
          <span className="text-sm text-gray-400">Personality</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.conversation }} />
          <span className="text-sm text-gray-400">Conversation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.transaction }} />
          <span className="text-sm text-gray-400">Transaction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.agentAnalysis }} />
          <span className="text-sm text-gray-400">Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.userRequest }} />
          <span className="text-sm text-gray-400">User Request</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            <span className="inline-block w-4 h-0.5 bg-purple-400 mr-2"></span>
            Completed
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            <span className="inline-block w-4 h-0.5 border-dashed border-pink-400 mr-2"></span>
            Blocked/Failed
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mt-4 backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[selectedNode.type as keyof typeof colors] }} />
            {selectedNode.label}
          </h3>
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
    </div>
  );
}