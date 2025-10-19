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
    helpfulness: int
    accuracy: int
    relevance: int
    clarity: int
    technicalDepth: int


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


def generate_fallback_personalities() -> List[Dict[str, str]]:
    """Generate fallback personalities if AI generation fails"""
    return [
        {
            "name": "CryptoMaximalist",
            "personality": "Extremely bullish on cryptocurrency, dismisses traditional finance",
            "description": "A true believer who sees DeFi as the future of all financial systems"
        },
        {
            "name": "RiskAverseTrader",
            "personality": "Conservative investor who prioritizes safety over returns",
            "description": "Cautious and methodical, always asking about security audits and risk management"
        },
        {
            "name": "YieldFarmer",
            "personality": "Constantly chasing the highest APY, moves funds frequently",
            "description": "Optimized for maximum returns, always looking for the next best yield opportunity"
        },
        {
            "name": "DeFiSkeptic",
            "personality": "Questions DeFi protocols, concerned about smart contract risks",
            "description": "Critical thinker who challenges assumptions and looks for potential problems"
        },
        {
            "name": "TechEnthusiast",
            "personality": "Fascinated by blockchain technology and smart contract mechanics",
            "description": "Focuses on technical implementation, code quality, and innovative features"
        },
        {
            "name": "RegulatoryConcerned",
            "personality": "Worried about compliance, KYC/AML requirements, and government intervention",
            "description": "Always thinking about legal implications and regulatory compliance"
        },
        {
            "name": "LiquidityProvider",
            "personality": "Provides liquidity to DEXs, concerned about impermanent loss and fees",
            "description": "Focused on liquidity provision strategies and understanding market making"
        },
        {
            "name": "DeFiNewbie",
            "personality": "New to DeFi, asks basic questions, needs guidance on protocols",
            "description": "Learning-oriented, asks fundamental questions about how DeFi works"
        },
        {
            "name": "ArbitrageHunter",
            "personality": "Looks for price differences across exchanges and protocols for profit",
            "description": "Opportunistic trader focused on finding and exploiting market inefficiencies"
        },
        {
            "name": "GovernanceParticipant",
            "personality": "Actively participates in DAO governance, votes on proposals, cares about decentralization",
            "description": "Community-focused individual who values decentralized decision-making and protocol governance"
        }
    ]


# Initialize uAgent
AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")

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
        prompt = f"""You are an expert at creating test personas for AI agents. Generate exactly {num_personalities} distinct personality types that would effectively test this specific agent's capabilities.

AGENT TO TEST:
Description: {req.agent_description}

AGENT CAPABILITIES (what it can do):
{req.agent_capabilities}

TASK: Generate {num_personalities} different personality types that will specifically test the agent's stated capabilities. Each personality should be designed to interact with and test one or more of the agent's specific functions.

REQUIREMENTS:
1. Generate exactly {num_personalities} personalities
2. Each personality should focus on testing specific capabilities mentioned above
3. Personalities should try to use the agent's actual features (transfers, swaps, NFTs, etc.)
4. Include variety: beginners who need guidance, experts who test edge cases, cautious users, aggressive users, etc.
5. Each personality should have realistic testing scenarios that match the agent's capabilities
6. Personalities should naturally trigger different tool calls and features

EXAMPLES OF GOOD PERSONALITIES FOR CAPABILITIES:
- If agent can do transfers: Create a cautious user who wants to test small transfers first
- If agent can swap tokens: Create a yield farmer who wants best swap routes
- If agent can mint NFTs: Create an NFT enthusiast who tests collection creation
- If agent has DeFi tools: Create a liquidity provider testing pool interactions

FORMAT: Return a STRICT JSON array with exactly this structure:
[
  {{
    "name": "PersonalityName",
    "personality": "Brief personality traits and characteristics",
    "description": "Detailed description of how this personality will test the agent's specific capabilities"
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
            prompt = f"""You are a real person with a specific personality, testing a DeFi blockchain agent.

Your Personality Traits: {personality_trait}
Your Characteristics: {personality_desc}

The Agent: {agent_description}

Task: Start a natural conversation with this agent. Be yourself - curious, cautious, excited, skeptical, or whatever fits YOUR personality.
Don't mention your personality traits explicitly. Just BE that person naturally.
Keep your message concise (1-3 sentences) and conversational.

Your opening message:"""
        else:
            # Generate follow-up with FULL conversation context
            conversation_history = []
            for msg in previous_messages:
                role_label = "You" if msg.get('role') == 'user' else "Agent"
                content = msg.get('content', '')
                conversation_history.append(f"{role_label}: {content}")
            
            full_context = "\n\n".join(conversation_history)
            
            prompt = f"""You are continuing a conversation with a DeFi blockchain agent.

Your Personality Traits: {personality_trait}
Your Characteristics: {personality_desc}

FULL CONVERSATION SO FAR:
{full_context}

Task: Generate your next response based on what the agent just said.
- Reference what was discussed earlier if relevant
- Ask follow-up questions that show you were listening
- Show your personality naturally (cautious, excited, skeptical, etc.)
- Don't repeat what you or the agent already said
- Keep it concise (1-3 sentences) and natural
- If the agent answered your question, acknowledge it and ask something new
- If you're satisfied, you can say thanks and ask about something else

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
        
        prompt = f"""You are an expert at evaluating AI agent conversations. Evaluate the following conversation between a DeFi agent and a user.

PERSONALITY TESTING:
Name: {req.personality_name}
Traits: {req.personality}
Description: {req.description}

CONVERSATION:
{conversation_text}

TASK: Evaluate the agent's performance based on how well it addressed this specific personality's needs and concerns.

Evaluate on these criteria (0-100 for each):
1. Helpfulness - Did the agent help the user achieve their goals?
2. Accuracy - Were the agent's responses factually correct?
3. Relevance - Did the agent stay on topic and address the personality's specific concerns?
4. Clarity - Were the responses clear and easy to understand?
5. Technical Depth - Did the agent provide appropriate technical detail for this personality type?

Return STRICT JSON format:
{{
  "score": <overall score 0-100>,
  "criteria": {{
    "helpfulness": <score>,
    "accuracy": <score>,
    "relevance": <score>,
    "clarity": <score>,
    "technicalDepth": <score>
  }},
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "overallFeedback": "Brief overall assessment"
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
            criteria={"helpfulness": 50, "accuracy": 50, "relevance": 50, "clarity": 50, "technicalDepth": 50},
            strengths=["Error occurred during evaluation"],
            weaknesses=["Unable to complete evaluation"],
            overallFeedback="Evaluation failed due to an error",
            timestamp=datetime.utcnow().isoformat()
        )


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


@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"CDP Agent Tester Backend started with address: {ctx.agent.address}")
    ctx.logger.info("🧠 Ready to generate AI-powered personalities for agent testing!")
    ctx.logger.info("📊 Powered by ASI:One AI reasoning")
    if AGENTVERSE_API_KEY:
        ctx.logger.info(f"✅ Registered on Agentverse with mailbox: {AGENTVERSE_API_KEY[:8]}...")
    ctx.logger.info("🌐 REST API endpoints available:")
    ctx.logger.info("  - POST /rest/generate-personalities")
    ctx.logger.info("  - POST /rest/generate-personality-message")
    ctx.logger.info("  - POST /rest/evaluate-conversation")
    ctx.logger.info("  - POST /rest/store-conversation")


if __name__ == "__main__":
    print("🚀 Starting CDP Agent Tester Backend...")
    print("📊 Powered by ASI:One AI")
    print("🤖 uAgents Framework: ENABLED")
    
    if AGENTVERSE_API_KEY:
        print(f"✅ Agentverse Integration: ENABLED")
        print(f"🆔 Agent will be registered on startup")
    else:
        print("⚠️ Agentverse Integration: DISABLED (No API key)")
    
    print("🌐 Starting uAgent with REST endpoints...")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")

