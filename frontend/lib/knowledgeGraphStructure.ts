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
    conversationId: string;
    personalityName: string;
    timestamp: string;
    network: string;
    totalEntities: number;
    totalRelationships: number;
  };
}

export const createKnowledgeGraphFromConversation = (conversationData: any): KnowledgeGraphData => {
  const entities: KnowledgeGraphEntity[] = [];
  const relationships: KnowledgeGraphRelationship[] = [];

  // 1. PERSONALITY Entity
  entities.push({
    id: 'personality',
    type: 'personality',
    label: 'DeFi Efficiency Tester',
    attributes: {
      name: conversationData.entry?.personality_name || 'DeFi Efficiency Tester',
      role: 'AI Agent',
      specialization: 'DeFi Operations',
      capabilities: ['Transaction Analysis', 'Gas Optimization', 'DeFi Strategy'],
      status: 'Active'
    },
    relationships: ['conversation']
  });

  // 2. CONVERSATION Entity
  entities.push({
    id: 'conversation',
    type: 'conversation',
    label: 'Conversation',
    attributes: {
      id: conversationData.entry?.conversation_id || 'unknown',
      messageCount: conversationData.entry?.messages?.length || 0,
      transactionCount: conversationData.entry?.transactions?.length || 0,
      duration: 'Active Session',
      status: 'Ongoing'
    },
    relationships: ['personality', 'timestamp', 'transaction']
  });

  // 3. TIMESTAMP Entity
  const timestamp = new Date(conversationData.entry?.timestamp || Date.now());
  entities.push({
    id: 'timestamp',
    type: 'timestamp',
    label: 'Timestamp',
    attributes: {
      date: timestamp.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      iso: conversationData.entry?.timestamp,
      timezone: 'UTC',
      relative: getRelativeTime(timestamp)
    },
    relationships: ['conversation']
  });

  // 4. TRANSACTION Entity (Central)
  const transaction = conversationData.entry?.transactions?.[0];
  if (transaction) {
    entities.push({
      id: 'transaction',
      type: 'transaction',
      label: 'Transaction',
      attributes: {
        hash: transaction.transaction_hash,
        chain: 'Base Sepolia (84532)',
        status: transaction.success ? 'SUCCESS' : 'FAILED',
        method: 'claim()',
        action: 'Faucet Claim',
        network: 'Base Sepolia',
        blockNumber: 'Latest',
        gasUsed: '117,000',
        gasPrice: '117,015 gwei'
      },
      relationships: ['conversation', 'action', 'amount', 'gasMetrics', 'balanceState', 'confirmations']
    });

    // 5. ACTION Entity
    entities.push({
      id: 'action',
      type: 'action',
      label: 'Action',
      attributes: {
        method: 'claim()',
        type: 'Faucet Claim',
        description: 'Claim ETH from faucet',
        contractAddress: 'Faucet Contract',
        functionSignature: 'claim(address receiver, uint256 amount)',
        parameters: {
          receiver: 'Agent Address',
          amount: '0.0001 ETH'
        }
      },
      relationships: ['transaction']
    });

    // 6. AMOUNT Entity
    entities.push({
      id: 'amount',
      type: 'amount',
      label: 'Amount',
      attributes: {
        value: '0.0001 ETH',
        wei: '100000000000000 wei',
        description: 'Claimed amount',
        currency: 'ETH',
        precision: 18,
        displayValue: '0.0001 ETH'
      },
      relationships: ['transaction']
    });

    // 7. GAS METRICS Entity
    entities.push({
      id: 'gasMetrics',
      type: 'gasMetrics',
      label: 'Gas Metrics',
      attributes: {
        used: '117,000 gas',
        cost: '117,015 gwei',
        efficiency: 'Optimal',
        description: 'Transaction gas analysis',
        gasLimit: '200,000',
        gasPrice: '1 gwei',
        totalCost: '0.000117015 ETH',
        efficiencyScore: 95
      },
      relationships: ['transaction', 'agentAnalysis']
    });

    // 8. BALANCE STATE Entity
    entities.push({
      id: 'balanceState',
      type: 'balanceState',
      label: 'Balance State',
      attributes: {
        before: '0.0 ETH',
        after: '0.0001 ETH',
        network: 'Base Sepolia',
        change: '+0.0001 ETH',
        walletAddress: 'Agent Wallet',
        balanceHistory: ['0.0 ETH', '0.0001 ETH'],
        lastUpdated: timestamp.toISOString()
      },
      relationships: ['transaction', 'agentAnalysis', 'suggestedActions']
    });

    // 9. CONFIRMATIONS Entity
    entities.push({
      id: 'confirmations',
      type: 'confirmations',
      label: 'Confirmations',
      attributes: {
        count: '13 blocks',
        time: '~2 seconds',
        status: 'Secure',
        description: 'Block confirmations',
        finality: 'Final',
        blockTime: '2 seconds',
        securityLevel: 'High'
      },
      relationships: ['transaction', 'agentAnalysis']
    });

    // 10. AGENT ANALYSIS Entity
    entities.push({
      id: 'agentAnalysis',
      type: 'agentAnalysis',
      label: 'Agent Analysis',
      attributes: {
        transaction: 'Successful claim',
        efficiency: 'No wastage, optimal gas',
        speed: 'Fast confirmation (<2s)',
        security: '13 confirmations verified',
        summary: 'Transaction executed efficiently',
        recommendations: [
          'Gas usage optimal',
          'Fast confirmation time',
          'Secure transaction'
        ],
        confidence: 95
      },
      relationships: ['gasMetrics', 'balanceState', 'confirmations', 'userRequest']
    });

    // 11. SUGGESTED NEXT ACTIONS Entity
    entities.push({
      id: 'suggestedActions',
      type: 'suggestedActions',
      label: 'Suggested Actions',
      attributes: {
        actions: [
          'DEX Swap (test liquidity & speed)',
          'Staking/Lending (gauge returns)',
          'ERC-4337 (account abstraction)'
        ],
        goal: 'Optimize gas efficiency',
        priority: 'Medium',
        feasibility: 'High',
        estimatedGas: 'Variable'
      },
      relationships: ['balanceState']
    });

    // 12. USER REQUEST Entity
    entities.push({
      id: 'userRequest',
      type: 'userRequest',
      label: 'User Request',
      attributes: {
        request: 'Wrap 0.0005 ETH -> WETH',
        status: 'INSUFFICIENT BALANCE',
        target: '0x2514844f312c02ae3c9d4feb40db4ec8830b6844',
        issue: 'Balance too low for requested amount',
        requiredAmount: '0.0005 ETH',
        availableAmount: '0.0001 ETH',
        shortfall: '0.0004 ETH',
        alternative: 'Wrap entire 0.0001 ETH'
      },
      relationships: ['agentAnalysis', 'targetContract']
    });

    // 13. TARGET CONTRACT Entity
    entities.push({
      id: 'targetContract',
      type: 'targetContract',
      label: 'Target Contract',
      attributes: {
        address: '0x2514844f312c02ae3c9d4feb40db4ec8830b6844',
        type: 'WETH Wrapper',
        network: 'Base Sepolia',
        function: 'deposit()',
        purpose: 'ETH to WETH conversion',
        interface: 'ERC-20 Wrapper',
        verified: true
      },
      relationships: ['userRequest']
    });

    // Create relationships
    relationships.push(
      // Personality -> Conversation
      {
        id: 'rel_1',
        source: 'personality',
        target: 'conversation',
        type: 'completed',
        label: 'assigned to',
        weight: 1
      },
      // Conversation -> Timestamp
      {
        id: 'rel_2',
        source: 'conversation',
        target: 'timestamp',
        type: 'temporal',
        label: 'recorded_at',
        weight: 1
      },
      // Conversation -> Transaction
      {
        id: 'rel_3',
        source: 'conversation',
        target: 'transaction',
        type: 'completed',
        label: 'contains',
        weight: 1
      },
      // Action -> Transaction
      {
        id: 'rel_4',
        source: 'action',
        target: 'transaction',
        type: 'causal',
        label: 'method',
        weight: 1
      },
      // Transaction -> Amount
      {
        id: 'rel_5',
        source: 'transaction',
        target: 'amount',
        type: 'completed',
        label: 'value',
        weight: 1
      },
      // Gas Metrics -> Transaction
      {
        id: 'rel_6',
        source: 'gasMetrics',
        target: 'transaction',
        type: 'completed',
        label: 'consumed',
        weight: 1
      },
      // Transaction -> Balance State
      {
        id: 'rel_7',
        source: 'transaction',
        target: 'balanceState',
        type: 'completed',
        label: 'updated',
        weight: 1
      },
      // Transaction -> Confirmations
      {
        id: 'rel_8',
        source: 'transaction',
        target: 'confirmations',
        type: 'completed',
        label: 'verified by',
        weight: 1
      },
      // Gas Metrics -> Agent Analysis
      {
        id: 'rel_9',
        source: 'gasMetrics',
        target: 'agentAnalysis',
        type: 'analysis',
        label: 'analyzed by',
        weight: 0.8
      },
      // Balance State -> Agent Analysis
      {
        id: 'rel_10',
        source: 'balanceState',
        target: 'agentAnalysis',
        type: 'analysis',
        label: 'analyzes',
        weight: 0.8
      },
      // Confirmations -> Agent Analysis
      {
        id: 'rel_11',
        source: 'confirmations',
        target: 'agentAnalysis',
        type: 'analysis',
        label: 'verified by',
        weight: 0.8
      },
      // Balance State -> Suggested Actions
      {
        id: 'rel_12',
        source: 'balanceState',
        target: 'suggestedActions',
        type: 'completed',
        label: 'requires',
        weight: 0.7
      },
      // Agent Analysis -> User Request (blocked)
      {
        id: 'rel_13',
        source: 'agentAnalysis',
        target: 'userRequest',
        type: 'blocked',
        label: 'analyzes',
        weight: 0.6
      },
      // User Request -> Target Contract (blocked)
      {
        id: 'rel_14',
        source: 'userRequest',
        target: 'targetContract',
        type: 'blocked',
        label: 'destination',
        weight: 0.5
      }
    );
  }

  return {
    entities,
    relationships,
    metadata: {
      conversationId: conversationData.entry?.conversation_id || 'unknown',
      personalityName: conversationData.entry?.personality_name || 'Unknown',
      timestamp: conversationData.entry?.timestamp || new Date().toISOString(),
      network: 'Base Sepolia',
      totalEntities: entities.length,
      totalRelationships: relationships.length
    }
  };
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
export const exportKnowledgeGraphAsJSON = (conversationData: any): string => {
  const kgData = createKnowledgeGraphFromConversation(conversationData);
  return JSON.stringify(kgData, null, 2);
};
