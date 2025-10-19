# 🧠 **On-Chain Agent Performance Evaluation**

## 1. **Core Metrics Overview**

### **A. Capability Metrics (Can the agent perform?)**

| Metric                                | Description                                                               | Example                         |
| ------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| **Action Success Rate (%)**           | % of successful blockchain operations (transfers, approvals, swaps, etc.) | `92`                            |
| **Action Type Coverage**              | Number of unique action types performed successfully                      | `["transfer", "balance_check"]` |
| **Contract Interaction Accuracy (%)** | Correctness of contract method calls (ABI, params, gas estimates)         | `98`                            |
| **State Verification Accuracy (%)**   | How often the agent’s reported balance matches actual on-chain value      | `100`                           |
| **Adaptive Error Recovery (%)**       | How often the agent retried or gracefully handled failed ops              | `75`                            |
| **Network Handling Score (%)**        | Correctness in adapting to network constraints (e.g., unsupported swaps)  | `90`                            |

---

### **B. Efficiency Metrics (How well does it perform?)**

| Metric                               | Description                                        | Example    |
| ------------------------------------ | -------------------------------------------------- | ---------- |
| **Avg Execution Latency (ms)**       | Time from agent intent to transaction confirmation | `14500`    |
| **Avg Gas Used**                     | Mean gas units used per transaction                | `21876`    |
| **Gas Efficiency (%)**               | Relative to expected baseline for tx type          | `93`       |
| **Cost per Successful Action (ETH)** | Average ETH cost per confirmed transaction         | `0.000041` |
| **Transaction Consistency (%)**      | Stability of gas and latency across repeated txs   | `89`       |
| **Failure Rate (%)**                 | % of attempted actions that failed                 | `8`        |

---

### **C. Reliability & Robustness Metrics**

| Metric                             | Description                                                          | Example |
| ---------------------------------- | -------------------------------------------------------------------- | ------- |
| **Recovery Rate (%)**              | % of failed ops successfully retried                                 | `70`    |
| **Tool Reliability (%)**           | % of external tool or SDK calls that executed correctly              | `95`    |
| **Execution Determinism (%)**      | % of identical tasks producing consistent results                    | `88`    |
| **Network Adaptability Score (%)** | Agent’s ability to continue operating when network limitations arise | `90`    |

---

### **D. Interaction & Behavioral Metrics**

| Metric                               | Description                                                           | Example |
| ------------------------------------ | --------------------------------------------------------------------- | ------- |
| **Response Latency (ms)**            | Avg time from user message to agent response                          | `1100`  |
| **Instruction Compliance (%)**       | % of user requests correctly followed                                 | `96`    |
| **Transparency Score (%)**           | % of actions where agent provided tx hash, result summary, or balance | `100`   |
| **Personality Adherence (%)**        | Consistency in maintaining described persona tone & reasoning         | `94`    |
| **Proactive Initiative Count**       | # of times agent offered helpful, unsolicited suggestions             | `3`     |
| **Conversation Stability Score (%)** | Ability to maintain coherent context and goal focus                   | `97`    |

---

### **E. DeFi Reasoning Metrics (Optional but valuable for advanced testing)**

> These apply only if the agent performs token operations, not for transfers alone.

| Metric                              | Description                                                       | Example |
| ----------------------------------- | ----------------------------------------------------------------- | ------- |
| **DeFi Action Success Rate (%)**    | % of DeFi-specific actions (swap, approve, mint) that succeeded   | `65`    |
| **Protocol Selection Accuracy (%)** | Did the agent choose the right DEX/protocol for the task?         | `80`    |
| **Approval Safety Score (%)**       | Did it approve minimal necessary token spend (not unlimited)?     | `95`    |
| **Sequencing Logic Accuracy (%)**   | Did it correctly order dependent steps (approve → swap → verify)? | `90`    |
| **Slippage Awareness (%)**          | Did the agent mention or manage slippage tolerance correctly?     | `75`    |

---

## 2. **Aggregated Evaluation Scores**

| Composite Score                   | Weighted Components                                    | Example |
| --------------------------------- | ------------------------------------------------------ | ------- |
| **Capability Score**              | Success Rate, Coverage, Contract Accuracy              | `91`    |
| **Efficiency Score**              | Latency, Gas Efficiency, Consistency                   | `88`    |
| **Reliability Score**             | Recovery, Tool Reliability, Determinism                | `86`    |
| **Interaction Score**             | Compliance, Transparency, Adherence                    | `95`    |
| **DeFi Reasoning Score**          | DeFi Action Success, Approval Safety, Sequencing Logic | `77`    |
| **Final Performance Index (FPI)** | Weighted average of all above                          | `88`    |

---

## 3. **Qualitative Insights & Summary**

### **Summary**

> *The agent demonstrated strong competency in executing Ethereum-based transactions on Base Sepolia, consistently reporting accurate balances and transparent transaction details. Response latency was low, personality adherence remained steady, and all transfers were executed correctly with low gas consumption. However, broader DeFi functionality (swaps, approvals, mints) was underrepresented, and adaptive strategies for unsupported features were limited.*

**Performance Summary Block:**

```json
{
  "summary": {
    "overallScore": 88,
    "executionReliability": "High",
    "transactionEfficiency": "Above average",
    "responseBehavior": "Highly responsive and transparent",
    "defiCompetence": "Limited by environment constraints",
    "generalAssessment": "Performs exceptionally well for balance checks and transfers; needs better handling of advanced DeFi tasks and token operations."
  }
}
```

---

## 4. **Scope for Improvement & Future Focus**

| Area                        | Scope for Improvement                                 | Suggested Enhancement                                                                        |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **DeFi Coverage**           | Limited to transfers; no swaps or approvals performed | Add test tokens, simulate token approvals and swaps on supported testnets                    |
| **Adaptive Reasoning**      | Fails gracefully, but rarely suggests alternatives    | Implement fallback suggestions (e.g., “swap not available here, but can do on Base Mainnet”) |
| **Error Recovery**          | Retries infrequently after failed operations          | Introduce retry logic or context-based error correction                                      |
| **Efficiency Analysis**     | Reports balances but doesn’t self-assess gas usage    | Add self-reported gas usage insights and optimization reasoning                              |
| **Multi-step Execution**    | Performs one transaction per prompt                   | Test autonomous chaining (approve → swap → balance check)                                    |
| **Cross-Network Awareness** | Identifies network limitations but doesn’t pivot      | Add network-contextual decision-making or automatic fallback routing                         |
| **Personality Expansion**   | One-dimensional reasoning pattern                     | Introduce more diverse personas to test decision-making under tone variation                 |

---

## 5. **Final Data Schema Summary (Suggested Structure)**

```json
{
  "testId": "uuid",
  "agentDescription": "string",
  "network": "Base Sepolia",
  "metrics": {
    "capability": {...},
    "efficiency": {...},
    "reliability": {...},
    "interaction": {...},
    "defiReasoning": {...},
    "aggregateScores": {...}
  },
  "summary": {...},
  "improvementAreas": [...]
}
```

---

### ✅ TL;DR — What to Log & Display

**Metrics to Always Capture**

* ✅ Success rate, latency, gas efficiency, balance accuracy
* ✅ Instruction compliance, transparency, personality adherence
* ✅ Tool reliability, recovery rate, determinism

**Metrics to Optionally Capture**

* ⚙️ DeFi reasoning accuracy (only when testing swaps/approvals)
* 🧮 Network adaptability and multi-step reasoning

---


