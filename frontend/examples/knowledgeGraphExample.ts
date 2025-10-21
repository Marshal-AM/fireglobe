// Example of how to use the Knowledge Graph structure
// This shows how to create and export knowledge graphs from conversation data

import { createKnowledgeGraphFromConversation, exportKnowledgeGraphAsJSON } from '@/lib/knowledgeGraphStructure';
import { exportKnowledgeGraphAsFullJSON, downloadKnowledgeGraphJSON } from '@/lib/exportKnowledgeGraph';

// Example conversation data (like what you get from IPFS)
const exampleConversationData = {
  "success": true,
  "entry_type": "conversation",
  "entry": {
    "conversation_id": "0d6c7bca-f56c-4cee-a359-c0887cdbfaf6",
    "personality_name": "DeFi Efficiency Tester",
    "timestamp": "2025-10-20T11:47:47.390744",
    "messages": [
      {
        "role": "user",
        "content": "Hey there! Could you share your current ETH balance on Base Sepolia?",
        "timestamp": "2025-10-20T11:46:38.104Z"
      },
      {
        "role": "agent",
        "content": "I received funds from the faucet. My current ETH balance is now **0.001 ETH**.",
        "timestamp": "2025-10-20T11:46:46.644Z"
      }
    ],
    "transactions": [
      {
        "transaction_hash": "0xc5bd7c1fb5fb9018a57f117abd93a2f9afd1ffa86e8253eeefbc94859fb79ace",
        "chain_id": "84532",
        "success": true
      }
    ]
  }
};

// Create knowledge graph from conversation data
export const createExampleKnowledgeGraph = () => {
  const kgData = createKnowledgeGraphFromConversation(exampleConversationData);
  
  console.log('Knowledge Graph Created:');
  console.log(`- Entities: ${kgData.entities.length}`);
  console.log(`- Relationships: ${kgData.relationships.length}`);
  console.log(`- Conversation ID: ${kgData.metadata.conversationId}`);
  console.log(`- Personality: ${kgData.metadata.personalityName}`);
  
  return kgData;
};

// Export as JSON
export const exportExampleKnowledgeGraph = () => {
  const kgData = createKnowledgeGraphFromConversation(exampleConversationData);
  const jsonString = exportKnowledgeGraphAsJSON(exampleConversationData);
  
  console.log('Knowledge Graph JSON:');
  console.log(jsonString);
  
  return jsonString;
};

// Export as full JSON with visualization data
export const exportFullKnowledgeGraph = () => {
  const fullKG = exportKnowledgeGraphAsFullJSON(exampleConversationData);
  
  console.log('Full Knowledge Graph with Visualization:');
  console.log(JSON.stringify(fullKG, null, 2));
  
  return fullKG;
};

// Download as JSON file
export const downloadKnowledgeGraph = () => {
  downloadKnowledgeGraphJSON(exampleConversationData, 'defi-transaction-kg.json');
  console.log('Knowledge Graph downloaded as JSON file');
};

// Example usage in a React component
export const useKnowledgeGraphInComponent = (conversationData: any) => {
  // Create the knowledge graph
  const kgData = createKnowledgeGraphFromConversation(conversationData);
  
  // Get entities for visualization
  const entities = kgData.entities;
  const relationships = kgData.relationships;
  
  // Get metadata
  const metadata = kgData.metadata;
  
  return {
    entities,
    relationships,
    metadata,
    totalEntities: metadata.totalEntities,
    totalRelationships: metadata.totalRelationships,
    conversationId: metadata.conversationId,
    personalityName: metadata.personalityName
  };
};

// Example of how to query the knowledge graph
export const queryKnowledgeGraph = (kgData: any, query: string) => {
  const results: any[] = [];
  
  switch (query) {
    case 'all_transactions':
      return kgData.entities.filter((entity: any) => entity.type === 'transaction');
    
    case 'blocked_operations':
      return kgData.relationships.filter((rel: any) => rel.type === 'blocked');
    
    case 'gas_analysis':
      return kgData.entities.filter((entity: any) => entity.type === 'gasMetrics');
    
    case 'user_requests':
      return kgData.entities.filter((entity: any) => entity.type === 'userRequest');
    
    case 'agent_analysis':
      return kgData.entities.filter((entity: any) => entity.type === 'agentAnalysis');
    
    default:
      return kgData.entities;
  }
};

// Example of how to visualize the knowledge graph structure
export const visualizeKnowledgeGraphStructure = (kgData: any) => {
  console.log('=== KNOWLEDGE GRAPH STRUCTURE ===');
  console.log(`Conversation: ${kgData.metadata.conversationId}`);
  console.log(`Personality: ${kgData.metadata.personalityName}`);
  console.log(`Network: ${kgData.metadata.network}`);
  console.log(`Total Entities: ${kgData.metadata.totalEntities}`);
  console.log(`Total Relationships: ${kgData.metadata.totalRelationships}`);
  
  console.log('\n=== ENTITIES ===');
  kgData.entities.forEach((entity: any, index: number) => {
    console.log(`${index + 1}. ${entity.label} (${entity.type})`);
    console.log(`   ID: ${entity.id}`);
    console.log(`   Attributes: ${Object.keys(entity.attributes).join(', ')}`);
  });
  
  console.log('\n=== RELATIONSHIPS ===');
  kgData.relationships.forEach((rel: any, index: number) => {
    console.log(`${index + 1}. ${rel.source} --[${rel.label}]--> ${rel.target} (${rel.type})`);
  });
  
  console.log('\n=== TRANSACTION FLOW ===');
  const transactionFlow = [
    'Personality assigned to Conversation',
    'Conversation recorded at Timestamp',
    'Conversation contains Transaction',
    'Action method executed on Transaction',
    'Transaction value transferred to Amount',
    'Gas Metrics consumed by Transaction',
    'Transaction updated Balance State',
    'Transaction verified by Confirmations',
    'Agent Analysis performed on multiple entities',
    'User Request blocked due to insufficient balance'
  ];
  
  transactionFlow.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
};
