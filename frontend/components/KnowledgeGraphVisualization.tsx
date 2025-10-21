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
  const selectedNodeRef = useRef<any>(null); // Use ref to avoid re-running physics
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

  // Sync selectedNode to ref without triggering physics re-render
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);


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
        size: entity.size || 100 // Bigger nodes for better visibility
      };
    });

    let frameCount = 0;
    const stabilizationFrames = 150; // Initial settling period
    const links = graphData.relationships;
    
    // Reset original positions when graphData changes
    originalPositionsRef.current = [];
    
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
          const minDistance = (nodes[i].size! + nodes[j].size!) / 2 + 60;
          
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
          const idealDistance = 300;
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
        
        // Store final positions once after stabilization
        if (frameCount === stabilizationFrames + 1) {
          originalPositionsRef.current = nodes.map(node => ({ x: node.x!, y: node.y! }));
        }
        
        nodes.forEach((node, index) => {
          // Each node has unique floating pattern based on its index
          const offsetX = Math.sin(time + index * 0.5) * 20; // Float left-right (8px range)
          const offsetY = Math.cos(time + index * 0.7) * 15; // Float up-down (6px range)
          
          // Apply smooth floating to stored positions
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
          
          // Draw link label if it exists
          if (link.label) {
            const midX = (source.x! + target.x!) / 2;
            const midY = (source.y! + target.y!) / 2;
            
            // Calculate angle of the line
            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            let angle = Math.atan2(dy, dx);
            
            // Keep text readable (not upside down)
            if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
              angle = angle + Math.PI;
            }
            
            // Set text style
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            
            // Draw background for better readability
            ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textMetrics = ctx.measureText(link.label);
            const padding = 12;
            const bgWidth = textMetrics.width + padding * 2;
            const bgHeight = 28;
            
            // Background box
            ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
            ctx.fillRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight);
            
            // Border
            ctx.strokeStyle = colors.link;
            ctx.lineWidth = 1;
            ctx.strokeRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight);
            
            // Text
            ctx.fillStyle = '#FFD700';
            ctx.fillText(link.label, 0, 0);
            
            ctx.restore();
          }
        }
      });

      // Draw nodes
      nodes.forEach((node: any) => {
        const isSelected = selectedNodeRef.current?.id === node.id;
        const nodeColor = colors[node.type as keyof typeof colors] || colors.accent;
        const nodeSize = isSelected ? node.size! / 2 + 15 : node.size! / 2; // Make selected node bigger
        
        // Debug: log when drawing selected node
        if (isSelected && frameCount % 60 === 0) { // Log every 60 frames to avoid spam
          console.log('🎨 Drawing selected node:', node.label);
        }
        
        // Simple glow for selected node
        if (isSelected) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#FFD700'; // Gold glow
        } else {
          ctx.shadowBlur = 0;
        }

        // Create radial gradient for node
        const gradient = ctx.createRadialGradient(
          node.x!, node.y!, 0, // Inner circle (center)
          node.x!, node.y!, nodeSize // Outer circle
        );
        
        // Define gradient colors based on node type (dark → light)
        if (node.type === 'personality') {
          gradient.addColorStop(0, '#FF69B4'); // Dark pink
          gradient.addColorStop(0.5, '#FFB6C1'); // Mild pink
          gradient.addColorStop(1, '#FFC0CB'); // Light pink
        } else if (node.type === 'conversation') {
          gradient.addColorStop(0, '#4682B4'); // Dark blue
          gradient.addColorStop(0.5, '#87CEEB'); // Mild blue
          gradient.addColorStop(1, '#B0E0E6'); // Light blue
        } else if (node.type === 'timestamp' || node.type === 'balanceState') {
          gradient.addColorStop(0, '#228B22'); // Dark green
          gradient.addColorStop(0.5, '#98FB98'); // Mild green
          gradient.addColorStop(1, '#90EE90'); // Light green
        } else if (node.type === 'action' || node.type === 'agentAnalysis') {
          gradient.addColorStop(0, '#9370DB'); // Dark plum
          gradient.addColorStop(0.5, '#DDA0DD'); // Mild plum
          gradient.addColorStop(1, '#E6C3E6'); // Light plum
        } else if (node.type === 'transaction' || node.type === 'suggestedActions') {
          gradient.addColorStop(0, '#DAA520'); // Dark gold
          gradient.addColorStop(0.5, '#F0E68C'); // Mild khaki
          gradient.addColorStop(1, '#FFFACD'); // Light yellow
        } else {
          // Default gradient
          gradient.addColorStop(0, nodeColor);
          gradient.addColorStop(0.5, nodeColor);
          gradient.addColorStop(1, nodeColor);
        }

        // Node circle with gradient
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Node border - thicker gold border for selected
        ctx.strokeStyle = isSelected ? '#FFD700' : '#000000';
        ctx.lineWidth = isSelected ? 5 : 3;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Label with better positioning and larger font
        ctx.fillStyle = colors.text;
        ctx.font = `${isSelected ? '32' : '24'}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelY = node.y! + node.size! / 2 + 50;
        const labelX = node.x!;
        
        // Just text, no background
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
  }, [graphData]); // Remove selectedNode from dependencies to prevent restart on click


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
      return distance < (node.size! / 2) + 15;
    });

    if (clickedNodes.length > 0) {
      // If multiple nodes overlap, pick the last one (drawn on top)
      const clickedNode = clickedNodes[clickedNodes.length - 1];
      console.log('✅ Node clicked:', clickedNode.label, 'ID:', clickedNode.id);
      setSelectedNode(clickedNode);
      selectedNodeRef.current = clickedNode; // Also update ref directly
    } else {
      console.log('❌ Clicked empty area - deselecting');
      setSelectedNode(null);
      selectedNodeRef.current = null; // Also update ref directly
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
          <p className="text-white text-sm mb-1">Entities</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalEntities}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white text-sm mb-1">Relationships</p>
          <p className="text-white text-xl font-bold">{graphData.metadata.totalRelationships}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white text-sm mb-1">Network</p>
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