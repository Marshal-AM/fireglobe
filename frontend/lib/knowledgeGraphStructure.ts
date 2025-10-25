// Knowledge Graph Structure for DeFi Transaction Analysis
// Based on the block diagram format with comprehensive entity relationships

export interface KnowledgeGraphEntity {
  id: string;
  type: string;
  label: string;
  attributes: Record<string, any>;
  relationships: string[];
}

export interface KnowledgeGraphRelationship {
  id: string;
  source: string;
  target: string;
  type: 'completed' | 'blocked' | 'analysis' | 'temporal' | 'causal';
  label: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeGraphData {
  entities: KnowledgeGraphEntity[];
  relationships: KnowledgeGraphRelationship[];
  metadata: {
    conversationId?: string; // Legacy field
    personalityName?: string; // Legacy field
    testRunId?: string; // New field for comprehensive test runs
    totalConversations?: number; // New field for comprehensive test runs
    totalTransactions?: number; // New field for comprehensive test runs
    personalities?: string[]; // New field for comprehensive test runs
    timestamp: string;
    network: string;
    totalEntities: number;
    totalRelationships: number;
  };
}

export const createKnowledgeGraphFromComprehensiveTestRun = (testRunData: any): KnowledgeGraphData => {
  const entities: KnowledgeGraphEntity[] = [];
  const relationships: KnowledgeGraphRelationship[] = [];

  // 1. TEST RUN Entity (Central hub)
  entities.push({
    id: 'testRun',
    type: 'testRun',
    label: 'Test Run',
    attributes: {
      id: testRunData.entry?.test_run_id || 'unknown',
      totalConversations: testRunData.entry?.total_conversations || 0,
      totalTransactions: testRunData.entry?.total_transactions || 0,
      personalities: testRunData.entry?.personalities || [],
      timestamp: testRunData.entry?.test_run_timestamp || new Date().toISOString(),
      status: 'Completed'
    },
    relationships: []
  });

  // Process each conversation
  const conversations = testRunData.entry?.conversations || [];
  conversations.forEach((conversation: any, convIndex: number) => {
    const convId = `conversation_${convIndex}`;
    
    // 2. PERSONALITY Entity for each conversation
    entities.push({
      id: `personality_${convIndex}`,
      type: 'personality',
      label: conversation.personality_name || 'Unknown Personality',
      attributes: {
        name: conversation.personality_name || 'Unknown Personality',
        role: 'AI Agent',
        specialization: 'DeFi Operations',
        capabilities: ['Transaction Analysis', 'Gas Optimization', 'DeFi Strategy'],
        status: 'Active',
        conversationIndex: convIndex
      },
      relationships: [convId]
    });

    // 3. CONVERSATION Entity
    entities.push({
      id: convId,
      type: 'conversation',
      label: conversation.personality_name || 'Unknown Personality',
      attributes: {
        id: conversation.conversation_id || 'unknown',
        personality: conversation.personality_name || 'Unknown',
        messageCount: conversation.messages?.length || 0,
        transactionCount: conversation.transactions?.length || 0,
        duration: 'Active Session',
        status: 'Completed',
        conversationIndex: convIndex,
        timestamp: conversation.timestamp
      },
      relationships: [`personality_${convIndex}`, `testRun`]
    });

    // 4. TIMESTAMP Entity for each conversation
    const convTimestamp = new Date(conversation.timestamp || Date.now());
    entities.push({
      id: `timestamp_${convIndex}`,
      type: 'timestamp',
      label: 'Timestamp',
      attributes: {
        date: convTimestamp.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: convTimestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        iso: conversation.timestamp,
        timezone: 'UTC',
        relative: getRelativeTime(convTimestamp),
        conversationIndex: convIndex
      },
      relationships: [convId]
    });

    // 5. Process transactions for this conversation
    const convTransactions = conversation.transactions || [];
    convTransactions.forEach((transaction: any, txIndex: number) => {
      const txId = `transaction_${convIndex}_${txIndex}`;
      
      // TRANSACTION Entity
      entities.push({
        id: txId,
        type: 'transaction',
        label: `TX ${transaction.transaction_hash?.substring(0, 8)}...`,
        attributes: {
          hash: transaction.transaction_hash,
          chain: 'Base Sepolia (84532)',
          status: transaction.success ? 'SUCCESS' : 'FAILED',
          method: transaction.raw_data?.data?.method || 'Unknown',
          action: 'Transaction',
          network: 'Base Sepolia',
          blockNumber: transaction.raw_data?.data?.block_number || 'Unknown',
          gasUsed: transaction.raw_data?.data?.gas_used || 'Unknown',
          gasPrice: transaction.raw_data?.data?.gas_price || 'Unknown',
          conversationIndex: convIndex,
          transactionIndex: txIndex,
          analysis: transaction.analysis
        },
        relationships: [convId, `testRun`]
      });
    });
  });

  // Process global transactions (if any)
  const globalTransactions = testRunData.entry?.transactions || [];
  globalTransactions.forEach((transaction: any, txIndex: number) => {
    const txId = `global_transaction_${txIndex}`;
    
    entities.push({
      id: txId,
      type: 'transaction',
      label: `Global TX ${transaction.transaction_hash?.substring(0, 8)}...`,
      attributes: {
        hash: transaction.transaction_hash,
        chain: 'Base Sepolia (84532)',
        status: transaction.success ? 'SUCCESS' : 'FAILED',
        method: transaction.raw_data?.data?.method || 'Unknown',
        action: 'Transaction',
        network: 'Base Sepolia',
        blockNumber: transaction.raw_data?.data?.block_number || 'Unknown',
        gasUsed: transaction.raw_data?.data?.gas_used || 'Unknown',
        gasPrice: transaction.raw_data?.data?.gas_price || 'Unknown',
        isGlobal: true,
        analysis: transaction.analysis
      },
      relationships: ['testRun']
    });
  });

  // Create relationships
  let relationshipId = 1;
  
  // Test Run -> Conversations
  conversations.forEach((conversation: any, convIndex: number) => {
    const convId = `conversation_${convIndex}`;
    
    // Test Run -> Conversation
    relationships.push({
      id: `rel_${relationshipId++}`,
      source: 'testRun',
      target: convId,
      type: 'completed',
      label: 'contains',
      weight: 1
    });
    
    // Personality -> Conversation
    relationships.push({
      id: `rel_${relationshipId++}`,
      source: `personality_${convIndex}`,
      target: convId,
      type: 'completed',
      label: 'assigned to',
      weight: 1
    });
    
    // Conversation -> Timestamp
    relationships.push({
      id: `rel_${relationshipId++}`,
      source: convId,
      target: `timestamp_${convIndex}`,
      type: 'temporal',
      label: 'recorded_at',
      weight: 1
    });
    
    // Conversation -> Transactions
    const convTransactions = conversation.transactions || [];
    convTransactions.forEach((transaction: any, txIndex: number) => {
      const txId = `transaction_${convIndex}_${txIndex}`;
      
      relationships.push({
        id: `rel_${relationshipId++}`,
        source: convId,
        target: txId,
        type: 'completed',
        label: 'contains',
        weight: 1
      });
    });
  });
  
  // Test Run -> Global Transactions
  globalTransactions.forEach((transaction: any, txIndex: number) => {
    const txId = `global_transaction_${txIndex}`;
    
    relationships.push({
      id: `rel_${relationshipId++}`,
      source: 'testRun',
      target: txId,
      type: 'completed',
      label: 'contains',
      weight: 1
    });
  });

  return {
    entities,
    relationships,
    metadata: {
      testRunId: testRunData.entry?.test_run_id || 'unknown',
      totalConversations: testRunData.entry?.total_conversations || 0,
      totalTransactions: testRunData.entry?.total_transactions || 0,
      personalities: testRunData.entry?.personalities || [],
      timestamp: testRunData.entry?.test_run_timestamp || new Date().toISOString(),
      network: 'Base Sepolia',
      totalEntities: entities.length,
      totalRelationships: relationships.length
    }
  };
};

// Legacy function for backward compatibility (deprecated)
export const createKnowledgeGraphFromConversation = (conversationData: any): KnowledgeGraphData => {
  console.warn('createKnowledgeGraphFromConversation is deprecated. Use createKnowledgeGraphFromComprehensiveTestRun instead.');
  
  // Convert single conversation to comprehensive test run format
  const testRunData = {
    success: true,
    entry_type: "comprehensive_test_run",
    entry: {
      conversations: [conversationData.entry],
      transactions: conversationData.entry?.transactions || [],
      total_conversations: 1,
      total_transactions: conversationData.entry?.transactions?.length || 0,
      personalities: [conversationData.entry?.personality_name || 'Unknown'],
      test_run_timestamp: conversationData.entry?.timestamp || new Date().toISOString(),
      test_run_id: conversationData.entry?.conversation_id || 'legacy'
    }
  };
  
  return createKnowledgeGraphFromComprehensiveTestRun(testRunData);
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Export the knowledge graph structure as JSON
export const exportKnowledgeGraphAsJSON = (testRunData: any): string => {
  const kgData = createKnowledgeGraphFromComprehensiveTestRun(testRunData);
  return JSON.stringify(kgData, null, 2);
};
