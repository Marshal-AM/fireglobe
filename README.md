# fireGlobe

An On-Chain Agent Testing framework.

<p align="center">
<img width="591" height="585" alt="fireglobe-logo" src="https://github.com/user-attachments/assets/e1ac37de-92f7-49ab-be0e-87575f3c6410" />
</p>

## How to use?

For detailed demo instructions, visit [HOW-TO-USE.md](HOW-TO-USE.md)


## Introduction

The landscape of on-chain AI agent testing is currently fragmented, lacking a standardized framework for comprehensive evaluation. Developers typically rely on a limited set of evaluations, often between 50 to 100 test cases, to assess their agents' performance. However, real-world users introduce unpredictable variables and edge cases that can lead to agent misperformance.

In the context of on-chain agents, a single erroneous action can result in substantial financial losses. Recent incidents highlight the critical need for robust testing frameworks:

**Notable Incidents:**

1. **AIXBT Security Breach (2024):** The AIXBT platform experienced a sophisticated attack where hackers exploited vulnerabilities in their AI agent system, leading to a loss of 55.5 ETH. The attackers manipulated the AI agent's decision-making algorithm, resulting in unauthorized asset transfers. ([Source: CoinCentral](https://coincentral.com/aixbt-ai-agent-loses-55-5-eth-in-security-breach-token-falls-20/))

2. **Bybit Breach (2024):** Bybit suffered a significant security breach where attackers exploited a compromised wallet signer, leading to a loss of $1.46 billion. This incident underscores the critical importance of robust access control mechanisms in on-chain systems. ([Source: AInvest](https://www.ainvest.com/news/crypto-incidents-cost-3-1b-2025-h1-driven-human-errors-ai-hacks-2507/))

## Our Solution

To address these challenges, we developed **fireGlobe** - a framework designed to rigorously test AI agents using a **diverse array of AI-generated personas** powered by the Artificial Superintelligence Alliance (ASI) ASI:One model. These personas simulate a wide range of edge cases that an AI agent might encounter.

fireGlobe evaluates the agent's performance across various on-chain actions and analyzes transaction quality by retrieving detailed data from the BlockScout MCP server. An ASI-powered agent then generates comprehensive transaction analysis, providing insights into potential vulnerabilities and areas for improvement.

**Key Benefits:**
- Obtain your access token, add a few lines of code to your agent script, and see how it truly performs
- Get detailed metrics, conversation simulations, and suggestions for areas of improvement directly in your dashboard
- Comprehensive testing that goes beyond traditional evaluation methods

## How It Works

fireGlobe operates through a structured pipeline that ensures thorough testing and analysis:

### Personality Generation and Transaction Quality Analysis Flow

<img width="1293" height="784" alt="Personality Generation and Transaction Quality Analysis Flow" src="https://github.com/user-attachments/assets/0b438802-8cb7-40e8-923f-c8e70b0c30f5" />


The process begins with your agent code integrating with the fireGlobe SDK Client. The AgentTester Instance (SDK) orchestrates the testing process by calling the `/rest/generate-personalities` endpoint of the fireGlobe Python Backend. This backend leverages the **ASI:One model to generate multiple distinct AI agents with unique personalities**.

These generated agents hold realistic conversations and test your agent's ability to make correct transactions. Based on these interactions, your agent executes on-chain transactions on selected chains (ETH, Base, Arbitrum, etc.). The transaction hash is then sent to a **dedicated Blockscout Agent** for analysis.

The Blockscout Agent forwards the transaction hash to the **Blockscout MCP Server**, which responds with raw transaction data. This data is processed by the Blockscout Agent to generate detailed analytics derived from Blockscout data, providing comprehensive insights into transaction quality and performance.

### Data Processing and Storage + Reward Pipeline

<img width="1288" height="828" alt="Data Processing and Storage + Reward Pipeline" src="https://github.com/user-attachments/assets/8ca8ddc9-c88f-4fbb-ab9f-d9abdd6d4121" />


After all conversations are completed, the fireGlobe Python Backend **constructs a meTTa Knowledge Graph** through comprehensive conversation and transaction analysis. This analysis leverages detailed transaction information obtained from various sources, crucial for understanding agent performance in on-chain scenarios.

The Knowledge Graph contains extensive conversation and transaction data, encompassing all simulated personalities and identified edge cases encountered during agent testing. This rich dataset forms the basis for evaluating agent behavior and identifying potential vulnerabilities.

A **Metrics Generator Agent** interacts with the Knowledge Graph, fetching specific data points to generate detailed agent performance metrics. These metrics provide objective insights into the AI agent's efficacy, reliability, and adherence to intended functionalities.

Both the comprehensive Knowledge Graph and the generated performance metrics are stored in **Lighthouse IPFS Storage**, ensuring decentralized and persistent data availability. Users are rewarded with **FGC (fireGlobe coin**)** for their participation in **generating synthetic AI data through agent testing**.

## How ASI is Used

The Artificial Superintelligence Alliance (ASI) is fundamental to fireGlobe's architecture, enabling sophisticated AI-powered testing capabilities:

**Agent Personas Generation:** The ASI:One model generates diverse AI personas that simulate realistic user behaviors and edge cases. These personas interact with your agent, testing various scenarios that traditional evaluation methods might miss.

**BlockScout Agent:** An ASI-powered agent analyzes transaction data retrieved from BlockScout, providing detailed insights into transaction quality, gas efficiency, and potential vulnerabilities.

**Metrics Generation:** ASI facilitates the generation of comprehensive performance metrics, analyzing conversation patterns, transaction success rates, and identifying areas for improvement.

**MeTTa Knowledge Graph:** ASI contributes to the development of a knowledge graph that enhances contextual understanding of agent interactions and performance patterns.

**Codebase References:**
- **Backend:** [@backend/](SDK/backend/) - the uAgents service handling personality generation and conversation evaluation
- **BlockScout Agent:** [@BlockscoutAgent/](SDK/BlockscoutAgent/) - ASI-powered agent for transaction analysis using BlockScout MCP
- **Metrics Generation:** [@metricsgen/](SDK/metricsgen/) - Python service for comprehensive performance analysis and metrics generation

## How BlockScout is Used

BlockScout's MCP server is integral to fireGlobe's transaction analysis capabilities, providing the foundation for comprehensive on-chain agent testing:

**Transaction Data Retrieval:** BlockScout provides detailed transaction data including gas usage, contract interactions, token transfers, and execution traces. This comprehensive data enables thorough analysis of on-chain actions performed by AI agents.

**Real-time Analysis:** The BlockScout MCP server allows real-time access to transaction data, enabling immediate analysis of agent performance and transaction quality.

**Integration Architecture:** The BlockScout Agent within fireGlobe interacts directly with the MCP server to fetch and process transaction data, generating detailed analytics that help developers understand their agent's on-chain behavior.

**Critical Role:** BlockScout's MCP server has been crucial in enabling the development of a product that genuinely assists developers in evaluating their agents' performance. Without this comprehensive transaction data, thorough on-chain agent testing would not be possible.

**Codebase Reference:**
- **BlockScout Agent:** [@BlockscoutAgent/](SDK/BlockscoutAgent/) - Contains the ASI-powered agent that interfaces with BlockScout MCP server for transaction analysis

## How Lighthouse is Used

Lighthouse, with its incentivized storage, fuels data availability market competition. It stands as a more affordable and secure choice compared to cloud storage, ensuring extended data liveness guarantees for participants in the network.

**Decentralized Storage Implementation:** fireGlobe stores **all metrics, conversation logs, and transaction-related data** completely in Lighthouse IPFS storage. This approach ensures data integrity, security, and cost-effectiveness while providing permanent, decentralized storage with a one-time payment model.

**DataAgent Application Alignment:** fireGlobe perfectly aligns with the DataAgent application objectives outlined in the "Best DataAgent" problem statement. We generate substantial synthetic AI agent training and analytical data that is valuable for the AI ecosystem's growth.

**Synthetic Data Generation:** By testing AI agents across diverse scenarios and edge cases, fireGlobe creates extensive synthetic data useful for:
- Training AI models in crypto trading and prediction markets
- Research and development of safer AI agents
- Contributing to the broader AI ecosystem with high-quality synthetic data

**Reward Mechanism:** We implement a reward mechanism using our native **fireGlobe coin (FGC)** which is rewarded to every tester per successful test. This incentivizes safer AI agent development while contributing synthetic AI agent data to the ecosystem, promoting data creation, utilization, monetization, and sharing among agents.

- [View FGC in 1MB.io (click here)](https://1mb.io/view-coin/0x3d2f760c3bb59bc74b6be357e3c20aad708a9667)
- [DataDAO Contract (click here)](https://sepolia.etherscan.io/address/0x3d2f760c3bb59bc74b6be357e3c20aad708a9667)
- [Example Reward TX Link (click here)](https://sepolia.etherscan.io/tx/0xabc8f6350d18c7e5b6154c6053c7ff62a6123bccc82762ef0c327cd54bb786f6)
- [Sample KG Data in lighthouse.storage (click here)](https://gateway.lighthouse.storage/ipfs/QmYxY1fM9GzgGPUDmJJz3LCzQcRDo5qJmjdm3gmiyRyc3H)
- [Sample metrics Data in lighthouse.storage (click here)](https://gateway.lighthouse.storage/ipfs/QmW8GJhb1LscVDVG5xsun4hLfU19wwsEgpM1b7CjRq8NwG)

**Codebase Reference:**
- **Database + Rewards Server:** [@db-server/](SDK/db-server/) - Node.js service handling storage and Lighthouse IPFS uploads and FGC datacoin minting for the tester

