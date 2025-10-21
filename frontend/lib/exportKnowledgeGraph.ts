// Export Knowledge Graph as comprehensive JSON structure
// This creates a full knowledge graph representation matching the block diagram format

import { createKnowledgeGraphFromConversation } from './knowledgeGraphStructure';

export interface ExportableKnowledgeGraph {
  metadata: {
    version: string;
    type: 'DeFi Transaction Knowledge Graph';
    generatedAt: string;
    source: 'IPFS Conversation Data';
    conversationId: string;
    personalityName: string;
    network: string;
    totalEntities: number;
    totalRelationships: number;
  };
  entities: Array<{
    id: string;
    type: string;
    label: string;
    attributes: Record<string, any>;
    position?: { x: number; y: number };
    relationships: string[];
  }>;
  relationships: Array<{
    id: string;
    source: string;
    target: string;
    type: 'completed' | 'blocked' | 'analysis' | 'temporal' | 'causal';
    label: string;
    weight: number;
    metadata?: Record<string, any>;
  }>;
  visualization: {
    layout: 'force-directed' | 'hierarchical' | 'circular';
    colors: Record<string, string>;
    nodeSizes: Record<string, number>;
    linkStyles: Record<string, any>;
  };
  analysis: {
    transactionFlow: string[];
    blockedOperations: string[];
    efficiencyMetrics: Record<string, any>;
    recommendations: string[];
  };
}

export const exportKnowledgeGraphAsFullJSON = (conversationData: any): ExportableKnowledgeGraph => {
  const kgData = createKnowledgeGraphFromConversation(conversationData);
  
  // Enhanced entity data with positions
  const entitiesWithPositions = kgData.entities.map((entity, index) => ({
    ...entity,
    position: {
      x: 400 + Math.cos((index / kgData.entities.length) * 2 * Math.PI) * 200,
      y: 300 + Math.sin((index / kgData.entities.length) * 2 * Math.PI) * 200
    }
  }));

  // Enhanced relationship data
  const enhancedRelationships = kgData.relationships.map(rel => ({
    ...rel,
    metadata: {
      strength: rel.weight,
      direction: 'bidirectional',
      category: rel.type,
      description: `${rel.source} ${rel.label} ${rel.target}`
    }
  }));

  // Analysis data
  const transactionFlow = [
    'Personality assigned to Conversation',
    'Conversation recorded at Timestamp',
    'Conversation contains Transaction',
    'Action method executed on Transaction',
    'Transaction value transferred to Amount',
    'Gas Metrics consumed by Transaction',
    'Transaction updated Balance State',
    'Transaction verified by Confirmations',
    'Agent Analysis performed on Gas Metrics, Balance State, and Confirmations',
    'Balance State requires Suggested Actions',
    'User Request blocked due to insufficient balance',
    'Target Contract destination blocked'
  ];

  const blockedOperations = [
    'User Request: Wrap 0.0005 ETH -> WETH (INSUFFICIENT BALANCE)',
    'Target Contract: WETH Wrapper interaction blocked'
  ];

  const efficiencyMetrics = {
    gasEfficiency: 95,
    transactionSpeed: 'Fast (<2s)',
    securityLevel: 'High (13 confirmations)',
    costOptimization: 'Optimal',
    successRate: 100
  };

  const recommendations = [
    'DEX Swap (test liquidity & speed)',
    'Staking/Lending (gauge returns)',
    'ERC-4337 (account abstraction)',
    'Optimize gas efficiency strategies'
  ];

  return {
    metadata: {
      version: '1.0.0',
      type: 'DeFi Transaction Knowledge Graph',
      generatedAt: new Date().toISOString(),
      source: 'IPFS Conversation Data',
      conversationId: kgData.metadata.conversationId,
      personalityName: kgData.metadata.personalityName,
      network: kgData.metadata.network,
      totalEntities: kgData.metadata.totalEntities,
      totalRelationships: kgData.metadata.totalRelationships
    },
    entities: entitiesWithPositions,
    relationships: enhancedRelationships,
    visualization: {
      layout: 'force-directed',
      colors: {
        personality: '#FF8C00',
        conversation: '#FF6B35',
        timestamp: '#FFD700',
        action: '#FF4500',
        transaction: '#FF6B35',
        amount: '#FF8C00',
        gasMetrics: '#FF6B35',
        balanceState: '#FFD700',
        confirmations: '#00FF7F',
        agentAnalysis: '#FF6B35',
        suggestedActions: '#FF8C00',
        userRequest: '#FF4500',
        targetContract: '#FF6B35'
      },
      nodeSizes: {
        personality: 40,
        conversation: 45,
        transaction: 50,
        agentAnalysis: 40,
        userRequest: 40,
        default: 35
      },
      linkStyles: {
        completed: { width: 3, style: 'solid', color: '#FF8C00' },
        blocked: { width: 2, style: 'dashed', color: '#FF4500' },
        analysis: { width: 2, style: 'solid', color: '#FF6B35' },
        temporal: { width: 2, style: 'solid', color: '#FFD700' },
        causal: { width: 3, style: 'solid', color: '#00FF7F' }
      }
    },
    analysis: {
      transactionFlow,
      blockedOperations,
      efficiencyMetrics,
      recommendations
    }
  };
};

// Export as downloadable JSON file
export const downloadKnowledgeGraphJSON = (conversationData: any, filename: string = 'knowledge-graph.json') => {
  const kgJSON = exportKnowledgeGraphAsFullJSON(conversationData);
  const dataStr = JSON.stringify(kgJSON, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = filename;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Export as RDF/Turtle format for semantic web
export const exportKnowledgeGraphAsRDF = (conversationData: any): string => {
  const kgData = createKnowledgeGraphFromConversation(conversationData);
  
  let rdf = `@prefix kg: <https://fireglobe.ai/knowledge-graph#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# DeFi Transaction Knowledge Graph
# Generated: ${new Date().toISOString()}
# Conversation: ${kgData.metadata.conversationId}

`;

  // Add entities
  kgData.entities.forEach(entity => {
    rdf += `kg:${entity.id} a kg:${entity.type} ;
    rdfs:label "${entity.label}" ;
`;
    
    Object.entries(entity.attributes).forEach(([key, value]) => {
      const valueStr = Array.isArray(value) ? value.join(', ') : String(value);
      rdf += `    kg:${key} "${valueStr}" ;
`;
    });
    
    rdf += `    .\n\n`;
  });

  // Add relationships
  kgData.relationships.forEach(rel => {
    rdf += `kg:${rel.source} kg:${rel.label} kg:${rel.target} ;
    a kg:${rel.type} ;
    kg:weight ${rel.weight} .
`;
  });

  return rdf;
};
