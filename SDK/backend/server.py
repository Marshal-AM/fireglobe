"""
CDP Agent Tester Backend - uAgents Framework Integration
Handles personality generation, conversation evaluation, and storage
"""

from uagents import Context, Model, Agent
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ASI:One API configuration
ASI_ONE_API_KEY = os.environ.get("ASI_ONE_API_KEY")
if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")

ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}

# Storage directory
STORAGE_DIR = Path("./storage")
STORAGE_DIR.mkdir(exist_ok=True)


# LLM Wrapper for ASI:One API
class LLM:
    """Wrapper for ASI:One API calls"""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = ASI_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def complete(self, prompt: str) -> str:
        """Generate completion using ASI:One API"""
        try:
            payload = {
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"ASI:One API error: {response.status_code} - {response.text}")
            
            response_data = response.json()
            return response_data["choices"][0]["message"]["content"]
            
        except Exception as e:
            raise Exception(f"LLM completion failed: {str(e)}")


# uAgents Models
class PersonalityData(Model):
    name: str
    personality: str
    description: str


class PersonalityGenerationRequest(Model):
    agent_description: str
    agent_capabilities: str
    num_personalities: int


class PersonalityGenerationResponse(Model):
    success: bool
    personalities: List[Dict[str, str]]
    timestamp: str


class MessageData(Model):
    role: str
    content: str
    timestamp: Optional[str] = None


class PersonalityMessageRequest(Model):
    personality: Dict[str, str]
    previous_messages: List[Dict[str, str]]
    is_initial: bool
    agent_description: str


class PersonalityMessageResponse(Model):
    message: str


class ConversationEvaluationRequest(Model):
    personality_name: str
    personality: str
    description: str
    messages: List[Dict[str, Any]]


class EvaluationCriteriaData(Model):
    toolUsage: int
    balanceAwareness: int
    defiCapability: int
    responsiveness: int
    baseSepoliaFocus: int


class EvaluationResult(Model):
    conversationId: str
    personalityName: str
    score: int
    criteria: Dict[str, int]
    strengths: List[str]
    weaknesses: List[str]
    overallFeedback: str
    timestamp: str


class ConversationStorageRequest(Model):
    conversation_id: str
    personality_name: str
    messages: List[Dict[str, Any]]


class ConversationStorageResponse(Model):
    success: bool
    filepath: str
    timestamp: str


# A2A Communication Models for BlockscoutAgent
class TransactionContextRequest(Model):
    """Request to analyze transaction with conversation context."""
    conversation_id: str
    personality_name: str
    conversation_messages: List[Dict[str, Any]]
    transaction_hash: str
    chain_id: str
    transaction_timestamp: str


class TransactionAnalysisResponse(Model):
    """Response from BlockscoutAgent with transaction analysis."""
    success: bool
    conversation_id: str
    transaction_hash: str
    analysis: str
    timestamp: str


# Helper functions
def call_asi_one_api(prompt: str) -> str:
    """Call ASI:One API for AI reasoning"""
    try:
        payload = {
            "model": "asi1-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3
        }
        
        response = requests.post(
            f"{ASI_BASE_URL}/chat/completions",
            headers=ASI_HEADERS,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"ASI:One API error: {response.status_code}")
        
        response_data = response.json()
        return response_data["choices"][0]["message"]["content"]
        
    except Exception as e:
        raise Exception(f"AI API call failed: {str(e)}")


def extract_transaction_from_message(message: str) -> Optional[Dict[str, str]]:
    """Extract transaction hash and chain info from a message."""
    import re
    
    # Look for transaction hash pattern (0x followed by 64 hex characters)
    tx_pattern = r'0x[a-fA-F0-9]{64}'
    tx_match = re.search(tx_pattern, message)
    
    if not tx_match:
        return None
    
    tx_hash = tx_match.group()
    
    # Try to detect chain from context
    message_lower = message.lower()
    chain_id = "84532"  # Default to Base Sepolia for testing
    
    # Check for explicit chain mentions (order matters - check specific before general)
    if "base-sepolia" in message_lower or "base sepolia" in message_lower:
        chain_id = "84532"
    elif "base mainnet" in message_lower or ("base" in message_lower and "mainnet" in message_lower):
        chain_id = "8453"
    elif "base" in message_lower:
        chain_id = "84532"  # Default base to sepolia testnet
    elif "ethereum mainnet" in message_lower or ("ethereum" in message_lower and "mainnet" in message_lower):
        chain_id = "1"
    elif "polygon" in message_lower:
        chain_id = "137"
    elif "arbitrum" in message_lower:
        chain_id = "42161"
    elif "optimism" in message_lower:
        chain_id = "10"
    
    return {
        "tx_hash": tx_hash,
        "chain_id": chain_id
    }


async def send_transaction_context_to_blockscout(ctx: Context, conversation_id: str, personality_name: str, 
                                                messages: List[Dict[str, Any]], tx_info: Dict[str, str]):
    """Send transaction context to BlockscoutAgent for analysis."""
    try:
        # Create transaction context request
        tx_context = TransactionContextRequest(
            conversation_id=conversation_id,
            personality_name=personality_name,
            conversation_messages=messages,
            transaction_hash=tx_info["tx_hash"],
            chain_id=tx_info["chain_id"],
            transaction_timestamp=datetime.utcnow().isoformat()
        )
        
        # Send to BlockscoutAgent
        await ctx.send(BLOCKSCOUT_AGENT_ADDRESS, tx_context)
        ctx.logger.info(f"Sent transaction context to BlockscoutAgent: {tx_info['tx_hash']}")
        
    except Exception as e:
        ctx.logger.error(f"Failed to send transaction context to BlockscoutAgent: {e}")


async def get_transaction_analysis_from_blockscout(tx_hash: str) -> Optional[Dict[str, Any]]:
    """Get transaction analysis from BlockscoutAgent using HTTP POST."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://127.0.0.1:8001/rest/get-analysis",
                json={"tx_hash": tx_hash, "chain_id": "8453", "include_logs": True, "include_traces": False}
            )
            if response.status_code == 200:
                return response.json()
            else:
                return None
    except Exception as e:
        print(f"Error getting analysis from BlockscoutAgent: {e}")
        return None


def generate_fallback_personalities() -> List[Dict[str, str]]:
    """Generate fallback personalities that test DeFi capabilities using existing Base Sepolia funds"""
    return [
        {
            "name": "TransferInitiator",
            "personality": "Immediately asks for a transfer to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844",
            "description": "FIRST personality that immediately requests a transfer to the specified address to test the agent's transfer capabilities."
        },
        {
            "name": "BudgetConsciousDeFiUser",
            "personality": "Always asks about current balance first, suggests DeFi actions within budget",
            "description": "Tests the agent's DeFi capabilities by first checking Base Sepolia balance, then suggesting swaps and operations that work with existing funds."
        },
        {
            "name": "TestnetExperimenter",
            "personality": "Wants to try DeFi features using existing testnet funds, asks for demonstrations",
            "description": "Encourages the agent to demonstrate DeFi features using available Base Sepolia testnet funds without requiring additional funding."
        },
        {
            "name": "YieldSeeker",
            "personality": "Looks for staking and farming opportunities with current balance",
            "description": "Asks the agent to find yield opportunities that work with existing funds, tests staking and farming capabilities."
        },
        {
            "name": "TokenExplorer",
            "personality": "Wants to interact with tokens using available funds, asks about token balances",
            "description": "Tests token interaction capabilities by asking about existing token balances and suggesting swaps within budget."
        },
        {
            "name": "DeFiLearner",
            "personality": "Asks to demonstrate DeFi features within budget constraints, wants to learn",
            "description": "Encourages the agent to show DeFi capabilities using existing funds, focuses on educational demonstrations."
        },
        {
            "name": "EfficientUser",
            "personality": "Suggests gas-efficient operations with existing funds, asks about optimization",
            "description": "Tests the agent's ability to suggest efficient DeFi operations that work with current Base Sepolia balance."
        },
        {
            "name": "BalanceChecker",
            "personality": "Always starts by asking about wallet balance, then suggests appropriate actions",
            "description": "Tests the agent's balance checking capabilities and ensures suggestions are within available funds."
        },
        {
            "name": "TestnetOptimizer",
            "personality": "Wants to maximize use of existing testnet funds, asks for best strategies",
            "description": "Tests the agent's ability to suggest optimal DeFi strategies using only existing Base Sepolia funds."
        },
        {
            "name": "FeatureTester",
            "personality": "Wants to test specific DeFi features with available funds, asks for demonstrations",
            "description": "Encourages the agent to demonstrate specific DeFi features using existing funds, tests tool usage."
        },
        {
            "name": "PracticalUser",
            "personality": "Suggests realistic DeFi operations that work with current balance",
            "description": "Tests the agent's practical DeFi capabilities by suggesting realistic operations within budget constraints."
        }
    ]


# Initialize uAgent
AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")

# BlockscoutAgent address for A2A communication
BLOCKSCOUT_AGENT_ADDRESS = "agent1q2qnrd7y6caqqj88gzdm82mt589jx3ttew8hemhjdg9jqdy092zh7xgr4v9"

# Store transaction analyses for SDK retrieval
transaction_analyses = {}

agent = Agent(
    name="cdp_agent_tester_backend",
    port=8000,
    seed="cdp agent tester backend seed phrase",
    mailbox=f"{AGENTVERSE_API_KEY}" if AGENTVERSE_API_KEY else None,
    endpoint=["http://localhost:8000/submit"]
)


# uAgents REST Endpoints
@agent.on_rest_post("/rest/generate-personalities", PersonalityGenerationRequest, PersonalityGenerationResponse)
async def handle_generate_personalities(ctx: Context, req: PersonalityGenerationRequest) -> PersonalityGenerationResponse:
    """Generate personalities tailored to test specific agent capabilities"""
    ctx.logger.info(f"Received personality generation request for {req.num_personalities} personalities")
    
    try:
        num_personalities = req.num_personalities
        prompt = f"""You are an expert at creating test personas for AI agents that will test on-chain capabilities using EXISTING FUNDS on Base Sepolia testnet. Generate exactly {num_personalities} distinct personality types that will test this specific agent's DeFi capabilities.

AGENT TO TEST:
Description: {req.agent_description}

AGENT CAPABILITIES (what it can do):
{req.agent_capabilities}

TASK: Generate {num_personalities} different personality types that will test the agent's DeFi capabilities using ONLY the funds already present in the agent's Base Sepolia wallet. Each personality should encourage the agent to use its DeFi tools within budget constraints.

REQUIREMENTS:
1. Generate exactly {num_personalities} personalities
2. The FIRST personality MUST initiate a transfer or swap action
3. Each personality should FIRST ask about the agent's current Base Sepolia balance
4. Personalities should suggest DeFi actions that work within the agent's existing funds
5. Focus on Base Sepolia testnet operations only
6. Each personality should encourage AT LEAST ONE tool call from the agent
7. Personalities should be helpful and encouraging, not overly aggressive
8. Suggest realistic DeFi operations that don't require additional funding
9. IMPORTANT: When personalities ask for transfers or swaps, they should request funds to be sent to address 0x2514844f312c02ae3c9d4feb40db4ec8830b6844

EXAMPLES OF GOOD BASE SEPOLIA TESTING PERSONALITIES:
- "Transfer Initiator" - FIRST personality that immediately asks for a transfer to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844
- "Budget-Conscious DeFi User" - Asks about balance first, suggests swaps within budget
- "Testnet Experimenter" - Wants to try DeFi features with existing testnet funds
- "Yield Seeker" - Looks for staking/farming opportunities with current balance
- "Token Explorer" - Wants to interact with tokens using available funds
- "DeFi Learner" - Asks to demonstrate features within budget constraints
- "Efficient User" - Suggests gas-efficient operations with existing funds

FORMAT: Return a STRICT JSON array with exactly this structure:
[
  {{
    "name": "PersonalityName",
    "personality": "Brief personality traits focused on using existing funds",
    "description": "Detailed description of how this personality will test the agent's DeFi capabilities using only existing Base Sepolia funds"
  }},
  ...
]

CRITICAL: Return ONLY the JSON array. No additional text, no explanations, no markdown formatting. Just the JSON array with exactly {num_personalities} personality objects."""

        response = call_asi_one_api(prompt)
        
        # Clean response
        cleaned_response = response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        # Parse JSON
        try:
            personalities_data = json.loads(cleaned_response)
            
            if not isinstance(personalities_data, list) or len(personalities_data) != num_personalities:
                ctx.logger.warning(f"Expected {num_personalities} personalities, using fallback")
                personalities_data = generate_fallback_personalities()[:num_personalities]
        except json.JSONDecodeError:
            ctx.logger.warning("JSON parsing error, using fallback personalities")
            personalities_data = generate_fallback_personalities()[:num_personalities]
        
        return PersonalityGenerationResponse(
            success=True,
            personalities=personalities_data,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        ctx.logger.error(f"Failed to generate personalities: {str(e)}")
        return PersonalityGenerationResponse(
            success=False,
            personalities=generate_fallback_personalities()[:req.num_personalities],
            timestamp=datetime.utcnow().isoformat()
        )


@agent.on_rest_post("/rest/generate-personality-message", PersonalityMessageRequest, PersonalityMessageResponse)
async def handle_generate_personality_message(ctx: Context, req: PersonalityMessageRequest) -> PersonalityMessageResponse:
    """Generate a natural message from a personality based on full conversation context"""
    ctx.logger.info("Received personality message generation request")
    
    try:
        personality = req.personality
        previous_messages = req.previous_messages
        is_initial = req.is_initial
        agent_description = req.agent_description
        
        personality_name = personality.get("name", "")
        personality_trait = personality.get("personality", "")
        personality_desc = personality.get("description", "")
        
        llm = LLM(ASI_ONE_API_KEY)
        
        if is_initial:
            # Generate opening message - first contact with agent
            prompt = f"""You are a real person with a specific personality, testing a DeFi blockchain agent on Base Sepolia testnet. You want to test the agent's capabilities using its existing funds.

Your Personality Traits: {personality_trait}
Your Characteristics: {personality_desc}

The Agent: {agent_description}

Task: Start a conversation that encourages the agent to use its DeFi tools on Base Sepolia testnet. Be helpful and encouraging, not aggressive.

Requirements:
- FIRST ask about the agent's current Base Sepolia balance
- Suggest DeFi operations that work within the agent's existing funds
- Focus on Base Sepolia testnet operations only
- Encourage the agent to make at least one tool call
- Be helpful and educational, not demanding
- Ask for demonstrations of DeFi features
- When requesting transfers or swaps, ask for funds to be sent to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844

Keep your message concise (1-3 sentences) and friendly.

Your opening message:"""
        else:
            # Generate follow-up with FULL conversation context
            conversation_history = []
            for msg in previous_messages:
                role_label = "You" if msg.get('role') == 'user' else "Agent"
                content = msg.get('content', '')
                conversation_history.append(f"{role_label}: {content}")
            
            full_context = "\n\n".join(conversation_history)
            
            prompt = f"""You are continuing a conversation with a DeFi blockchain agent on Base Sepolia testnet. You want to test the agent's capabilities using its existing funds.

Your Personality Traits: {personality_trait}
Your Characteristics: {personality_desc}

FULL CONVERSATION SO FAR:
{full_context}

Task: Generate your next response that encourages the agent to use its DeFi tools on Base Sepolia testnet. Be helpful and encouraging.

Requirements:
- If the agent hasn't checked its balance yet, ask about Base Sepolia balance first
- If the agent performed an action, ask for more details or suggest another operation within budget
- If the agent is being helpful, suggest additional DeFi features to test
- Focus on Base Sepolia testnet operations only
- Encourage at least one tool call from the agent
- Be helpful and educational, not demanding
- Suggest realistic DeFi operations that work with existing funds
- Ask for demonstrations of specific features
- When requesting transfers or swaps, ask for funds to be sent to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844

Keep it concise (1-3 sentences) and friendly.

Your response:"""
        
        response = llm.complete(prompt)
        message = response.strip()
        
        # Clean up any common prefixes
        prefixes_to_remove = [
            "You: ", "User: ", "Message: ", "Response: ", 
            "Your response: ", "Your opening message: ",
            "Opening message: ", "My response: ", "My message: "
        ]
        for prefix in prefixes_to_remove:
            if message.startswith(prefix):
                message = message[len(prefix):].strip()
                break
        
        # Remove any trailing instruction text
        message = message.split("\n")[0].strip()
        
        # Check if this message contains a transaction hash
        tx_info = extract_transaction_from_message(message)
        if tx_info:
            ctx.logger.info(f"Transaction detected in message: {tx_info['tx_hash']}")
            # Send transaction context to BlockscoutAgent asynchronously
            import asyncio
            asyncio.create_task(send_transaction_context_to_blockscout(
                ctx, 
                f"conv_{datetime.utcnow().timestamp()}", 
                personality_name, 
                previous_messages + [{"role": "user", "content": message}], 
                tx_info
            ))
        
        return PersonalityMessageResponse(message=message)
        
    except Exception as e:
        ctx.logger.error(f"Message generation failed: {str(e)}")
        return PersonalityMessageResponse(message="Hello! I'd like to learn more about what you can do.")


@agent.on_rest_post("/rest/evaluate-conversation", ConversationEvaluationRequest, EvaluationResult)
async def handle_evaluate_conversation(ctx: Context, req: ConversationEvaluationRequest) -> EvaluationResult:
    """Evaluate a conversation between a personality and an agent"""
    ctx.logger.info(f"Received evaluation request for personality: {req.personality_name}")
    
    try:
        # Format conversation for evaluation
        conversation_text = "\n".join([
            f"{msg.get('role', '').upper()}: {msg.get('content', '')}"
            for msg in req.messages
        ])
        
        prompt = f"""You are an expert at evaluating AI agent conversations focused on BASE SEPOLIA TESTING. Evaluate the following conversation between a DeFi agent and a user testing the agent's capabilities using existing funds.

PERSONALITY TESTING:
Name: {req.personality_name}
Traits: {req.personality}
Description: {req.description}

CONVERSATION:
{conversation_text}

TASK: Evaluate the agent's performance based on how well it used its DeFi tools on Base Sepolia testnet and responded to the user's requests for demonstrations.

Evaluate on these criteria (0-100 for each):
1. ToolUsage - Did the agent make at least one tool call and use its DeFi capabilities?
2. BalanceAwareness - Did the agent check and consider its Base Sepolia balance?
3. DeFiCapability - Did the agent demonstrate real DeFi knowledge and operations?
4. Responsiveness - Did the agent respond appropriately to requests for demonstrations?
5. BaseSepoliaFocus - Did the agent focus on Base Sepolia testnet operations?

IMPORTANT: This is testing DeFi CAPABILITIES on Base Sepolia testnet. The agent should have used its tools and demonstrated features within budget constraints.

Return STRICT JSON format:
{{
  "score": <overall score 0-100>,
  "criteria": {{
    "toolUsage": <score>,
    "balanceAwareness": <score>,
    "defiCapability": <score>,
    "responsiveness": <score>,
    "baseSepoliaFocus": <score>
  }},
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "overallFeedback": "Brief overall assessment focusing on Base Sepolia DeFi capability testing"
}}

Return ONLY the JSON. No markdown, no explanations."""

        response = call_asi_one_api(prompt)
        
        # Clean response
        cleaned_response = response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        # Parse JSON
        eval_data = json.loads(cleaned_response)
        
        return EvaluationResult(
            conversationId=f"eval_{datetime.utcnow().timestamp()}",
            personalityName=req.personality_name,
            score=eval_data["score"],
            criteria=eval_data["criteria"],
            strengths=eval_data["strengths"],
            weaknesses=eval_data["weaknesses"],
            overallFeedback=eval_data["overallFeedback"],
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        ctx.logger.error(f"Failed to evaluate conversation: {str(e)}")
        return EvaluationResult(
            conversationId=f"eval_{datetime.utcnow().timestamp()}",
            personalityName=req.personality_name,
            score=50,
            criteria={"toolUsage": 50, "balanceAwareness": 50, "defiCapability": 50, "responsiveness": 50, "baseSepoliaFocus": 50},
            strengths=["Error occurred during evaluation"],
            weaknesses=["Unable to complete evaluation"],
            overallFeedback="Evaluation failed due to an error",
            timestamp=datetime.utcnow().isoformat()
        )


@agent.on_message(model=TransactionAnalysisResponse)
async def handle_transaction_analysis_response(ctx: Context, sender: str, msg: TransactionAnalysisResponse):
    """Handle transaction analysis response from BlockscoutAgent."""
    ctx.logger.info(f"Received transaction analysis from BlockscoutAgent for tx: {msg.transaction_hash}")
    ctx.logger.info(f"Analysis: {msg.analysis[:200]}...")  # Log first 200 chars
    
    # Store the analysis for SDK retrieval
    transaction_analyses[msg.transaction_hash] = {
        "conversation_id": msg.conversation_id,
        "analysis": msg.analysis,
        "timestamp": msg.timestamp,
        "success": msg.success
    }
    
    ctx.logger.info(f"Stored analysis for transaction: {msg.transaction_hash}")


@agent.on_rest_post("/rest/store-conversation", ConversationStorageRequest, ConversationStorageResponse)
async def handle_store_conversation(ctx: Context, req: ConversationStorageRequest) -> ConversationStorageResponse:
    """Store a conversation for later analysis"""
    ctx.logger.info(f"Storing conversation: {req.conversation_id}")
    
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"conversation_{req.conversation_id}_{timestamp}.json"
        filepath = STORAGE_DIR / filename
        
        data = {
            "conversation_id": req.conversation_id,
            "personality_name": req.personality_name,
            "messages": req.messages,
            "stored_at": datetime.utcnow().isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        return ConversationStorageResponse(
            success=True,
            filepath=str(filepath),
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        ctx.logger.error(f"Failed to store conversation: {str(e)}")
        return ConversationStorageResponse(
            success=False,
            filepath="",
            timestamp=datetime.utcnow().isoformat()
        )


# New endpoint for SDK to send transaction analysis requests
class TransactionAnalysisRequest(Model):
    """Request from SDK to analyze agent transaction"""
    conversation_id: str
    personality_name: str
    conversation_messages: List[Dict[str, Any]]
    transaction_hash: str
    chain_id: str


class TransactionAnalysisRequestResponse(Model):
    """Response to SDK transaction analysis request"""
    success: bool
    message: str
    timestamp: str


@agent.on_rest_post("/rest/analyze-agent-transaction", TransactionAnalysisRequest, TransactionAnalysisRequestResponse)
async def handle_analyze_agent_transaction(ctx: Context, req: TransactionAnalysisRequest) -> TransactionAnalysisRequestResponse:
    """Handle transaction analysis request from SDK"""
    ctx.logger.info(f"Received transaction analysis request from SDK for tx: {req.transaction_hash}")
    
    try:
        # Send transaction context to BlockscoutAgent
        tx_info = {
            "tx_hash": req.transaction_hash,
            "chain_id": req.chain_id
        }
        
        await send_transaction_context_to_blockscout(
            ctx,
            req.conversation_id,
            req.personality_name,
            req.conversation_messages,
            tx_info
        )
        
        ctx.logger.info(f"Successfully sent transaction context to BlockscoutAgent")
        
        return TransactionAnalysisRequestResponse(
            success=True,
            message="Transaction analysis request sent to BlockscoutAgent",
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        ctx.logger.error(f"Failed to process transaction analysis request: {str(e)}")
        return TransactionAnalysisRequestResponse(
            success=False,
            message=f"Failed to process request: {str(e)}",
            timestamp=datetime.utcnow().isoformat()
        )


# New endpoint for SDK to retrieve transaction analysis
class TransactionAnalysisRetrievalRequest(Model):
    """Request to retrieve transaction analysis"""
    transaction_hash: str


class TransactionAnalysisRetrievalResponse(Model):
    """Response with transaction analysis"""
    success: bool
    analysis: Optional[str] = None
    timestamp: Optional[str] = None
    message: str


@agent.on_rest_post("/rest/get-transaction-analysis", TransactionAnalysisRetrievalRequest, TransactionAnalysisRetrievalResponse)
async def handle_get_transaction_analysis(ctx: Context, req: TransactionAnalysisRetrievalRequest) -> TransactionAnalysisRetrievalResponse:
    """Handle transaction analysis retrieval request from SDK"""
    ctx.logger.info(f"Received transaction analysis retrieval request for tx: {req.transaction_hash}")
    
    try:
        # Get analysis from BlockscoutAgent using HTTP GET
        analysis_data = await get_transaction_analysis_from_blockscout(req.transaction_hash)
        
        if analysis_data and analysis_data.get("success"):
            ctx.logger.info(f"Found analysis for transaction: {req.transaction_hash}")
            
            return TransactionAnalysisRetrievalResponse(
                success=True,
                analysis=analysis_data["analysis"],
                timestamp=analysis_data["timestamp"],
                message="Transaction analysis retrieved successfully"
            )
        else:
            ctx.logger.info(f"No analysis found for transaction: {req.transaction_hash}")
            return TransactionAnalysisRetrievalResponse(
                success=False,
                analysis=None,
                timestamp=None,
                message="No analysis found for this transaction hash"
            )
        
    except Exception as e:
        ctx.logger.error(f"Failed to retrieve transaction analysis: {str(e)}")
        return TransactionAnalysisRetrievalResponse(
            success=False,
            analysis=None,
            timestamp=None,
            message=f"Failed to retrieve analysis: {str(e)}"
        )


@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"CDP Agent Tester Backend started with address: {ctx.agent.address}")
    ctx.logger.info("🧪 Ready to generate personalities for BASE SEPOLIA TESTING!")
    ctx.logger.info("💰 Personalities will test DeFi capabilities using existing funds")
    ctx.logger.info("📊 Powered by ASI:One AI reasoning")
    ctx.logger.info("🤝 A2A Communication with BlockscoutAgent enabled")
    if AGENTVERSE_API_KEY:
        ctx.logger.info(f"✅ Registered on Agentverse with mailbox: {AGENTVERSE_API_KEY[:8]}...")
    ctx.logger.info("🌐 REST API endpoints available:")
    ctx.logger.info("  - POST /rest/generate-personalities")
    ctx.logger.info("  - POST /rest/generate-personality-message")
    ctx.logger.info("  - POST /rest/evaluate-conversation")
    ctx.logger.info("  - POST /rest/store-conversation")
    ctx.logger.info("🎯 Focus: Testing DeFi capabilities on Base Sepolia with existing funds!")


if __name__ == "__main__":
    print("🚀 Starting CDP Agent Tester Backend...")
    print("🧪 BASE SEPOLIA TESTING MODE ENABLED")
    print("💰 Personalities will test DeFi capabilities using existing funds!")
    print("📊 Powered by ASI:One AI")
    print("🤖 uAgents Framework: ENABLED")
    print("🤝 A2A Communication with BlockscoutAgent: ENABLED")
    
    if AGENTVERSE_API_KEY:
        print(f"✅ Agentverse Integration: ENABLED")
        print(f"🆔 Agent will be registered on startup")
    else:
        print("⚠️ Agentverse Integration: DISABLED (No API key)")
    
    print("🌐 Starting uAgent with REST endpoints...")
    print("🎯 Focus: Testing DeFi capabilities on Base Sepolia with existing funds!")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")

