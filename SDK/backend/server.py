"""
CDP Agent Tester Backend - uAgents Framework Integration
Handles personality generation, conversation evaluation, and storage
Registered on Agentverse for decentralized access
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from uuid import uuid4
import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Try to import uagents, but make it optional for deployment
try:
    from uagents import Context, Model, Protocol, Agent
    from uagents_core.contrib.protocols.chat import (
        ChatAcknowledgement,
        ChatMessage,
        EndSessionContent,
        StartSessionContent,
        TextContent,
        chat_protocol_spec,
    )
    UAGENTS_AVAILABLE = True
except ImportError:
    UAGENTS_AVAILABLE = False
    print("⚠️ uAgents not available - running in standalone FastAPI mode")

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="CDP Agent Tester Backend",
    description="AI-powered testing backend for CDP AgentKit agents with uAgents integration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# Models
class Personality(BaseModel):
    name: str
    personality: str
    description: str


class PersonalityGenerationRequest(BaseModel):
    agent_description: str = Field(..., description="Description of the agent being tested")
    agent_capabilities: str = Field(..., description="What the agent is capable of doing")
    num_personalities: int = Field(default=5, description="Number of personalities to generate")


class PersonalityGenerationResponse(BaseModel):
    success: bool
    personalities: List[Personality]
    timestamp: str


class ConversationMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None


class ConversationEvaluationRequest(BaseModel):
    personality_name: str
    personality: str
    description: str
    messages: List[ConversationMessage]


class EvaluationCriteria(BaseModel):
    helpfulness: int
    accuracy: int
    relevance: int
    clarity: int
    technicalDepth: int


class EvaluationResult(BaseModel):
    conversationId: str
    personalityName: str
    score: int
    criteria: EvaluationCriteria
    strengths: List[str]
    weaknesses: List[str]
    overallFeedback: str
    timestamp: str


class ConversationStorageRequest(BaseModel):
    conversation_id: str
    personality_name: str
    messages: List[ConversationMessage]


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


# Endpoints
@app.get("/health")
@app.head("/health")
async def health_check():
    """Health check endpoint - supports GET and HEAD methods"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/generate-personalities", response_model=PersonalityGenerationResponse)
async def generate_personalities(request: PersonalityGenerationRequest):
    """Generate personalities tailored to test specific agent capabilities"""
    try:
        num_personalities = request.num_personalities
        prompt = f"""You are an expert at creating test personas for AI agents. Generate exactly {num_personalities} distinct personality types that would effectively test this specific agent's capabilities.

AGENT TO TEST:
Description: {request.agent_description}

AGENT CAPABILITIES (what it can do):
{request.agent_capabilities}

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
                print(f"Warning: Expected {num_personalities} personalities, using fallback")
                personalities_data = generate_fallback_personalities()[:num_personalities]
        except json.JSONDecodeError:
            print(f"JSON parsing error, using fallback personalities")
            personalities_data = generate_fallback_personalities()[:num_personalities]
        
        # Convert to Personality objects
        personalities = [
            Personality(
                name=p["name"],
                personality=p["personality"],
                description=p["description"]
            )
            for p in personalities_data
        ]
        
        return PersonalityGenerationResponse(
            success=True,
            personalities=personalities,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate personalities: {str(e)}")


@app.post("/generate-personality-message")
async def generate_personality_message_endpoint(request: dict):
    """Generate a natural message from a personality based on full conversation context"""
    try:
        personality = request.get("personality", {})
        previous_messages = request.get("previous_messages", [])
        is_initial = request.get("is_initial", False)
        agent_description = request.get("agent_description", "")
        
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
        
        return {"message": message}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Message generation failed: {str(e)}")


@app.post("/evaluate-conversation", response_model=EvaluationResult)
async def evaluate_conversation(request: ConversationEvaluationRequest):
    """Evaluate a conversation between a personality and an agent"""
    try:
        # Format conversation for evaluation
        conversation_text = "\n".join([
            f"{msg.role.upper()}: {msg.content}"
            for msg in request.messages
        ])
        
        prompt = f"""You are an expert at evaluating AI agent conversations. Evaluate the following conversation between a DeFi agent and a user.

PERSONALITY TESTING:
Name: {request.personality_name}
Traits: {request.personality}
Description: {request.description}

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
            personalityName=request.personality_name,
            score=eval_data["score"],
            criteria=EvaluationCriteria(**eval_data["criteria"]),
            strengths=eval_data["strengths"],
            weaknesses=eval_data["weaknesses"],
            overallFeedback=eval_data["overallFeedback"],
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate conversation: {str(e)}")


@app.post("/store-conversation")
async def store_conversation(request: ConversationStorageRequest):
    """Store a conversation for later analysis"""
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"conversation_{request.conversation_id}_{timestamp}.json"
        filepath = STORAGE_DIR / filename
        
        data = {
            "conversation_id": request.conversation_id,
            "personality_name": request.personality_name,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                }
                for msg in request.messages
            ],
            "stored_at": datetime.utcnow().isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {
            "success": True,
            "filepath": str(filepath),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store conversation: {str(e)}")



# uAgents Integration
if UAGENTS_AVAILABLE:
    # Get Agentverse API key
    AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")
    
    # Initialize uAgent
    agent = Agent(
        name="cdp_agent_tester_backend",
        port=8000,
        seed="cdp agent tester backend seed phrase",
        mailbox=True if AGENTVERSE_API_KEY else False,
        endpoint=["http://localhost:8000/submit"] if not os.getenv("RENDER") else None
    )
    
    # uAgents Models (matching main.py structure)
    class PersonalityRequest(Model):
        agent_description: str
    
    class PersonalityResponse(Model):
        success: bool
        personalities: List[Dict[str, str]]
        timestamp: str
        agent_address: str
    
    # Chat Protocol
    chat_proto = Protocol(spec=chat_protocol_spec)
    
    def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
        """Create a text chat message."""
        content = [TextContent(type="text", text=text)]
        if end_session:
            content.append(EndSessionContent(type="end-session"))
        return ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=content,
        )
    
    @agent.on_event("startup")
    async def startup_handler(ctx: Context):
        ctx.logger.info(f"CDP Agent Tester Backend started with address: {ctx.agent.address}")
        ctx.logger.info("🧠 Ready to generate AI-powered personalities for agent testing!")
        ctx.logger.info("📊 Powered by ASI:One AI reasoning")
        if AGENTVERSE_API_KEY:
            ctx.logger.info("✅ Registered on Agentverse")
        ctx.logger.info("🌐 REST API endpoints available")
    
    @chat_proto.on_message(ChatMessage)
    async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
        """Handle incoming chat messages."""
        ctx.storage.set(str(ctx.session), sender)
        await ctx.send(
            sender,
            ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id),
        )
        
        for item in msg.content:
            if isinstance(item, StartSessionContent):
                ctx.logger.info(f"Got a start session message from {sender}")
                continue
            elif isinstance(item, TextContent):
                user_query = item.text.strip()
                ctx.logger.info(f"Got request from {sender}: {user_query}")
                
                try:
                    # Generate personalities
                    example_description = "A DeFi agent that helps users with onchain operations"
                    personalities_data = generate_fallback_personalities()
                    
                    # Format response
                    response_text = f"**Generated Personalities:**\n\n"
                    for i, personality in enumerate(personalities_data[:5], 1):
                        response_text += f"**{i}. {personality['name']}:**\n"
                        response_text += f"   *{personality['personality']}*\n\n"
                    
                    response_text += f"*Total: {len(personalities_data)} personalities*"
                    await ctx.send(sender, create_text_chat(response_text))
                    
                except Exception as e:
                    ctx.logger.error(f"Error: {e}")
                    await ctx.send(sender, create_text_chat("Error processing request. Please try again."))
    
    @chat_proto.on_message(ChatAcknowledgement)
    async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
        """Handle chat acknowledgements."""
        ctx.logger.info(f"Got acknowledgement from {sender}")
    
    # REST API Handler for uAgents
    @agent.on_rest_post("/generate", PersonalityRequest, PersonalityResponse)
    async def handle_personality_generation_uagents(ctx: Context, req: PersonalityRequest) -> PersonalityResponse:
        """Handle personality generation via uAgents REST protocol."""
        ctx.logger.info(f"Received personality generation request via uAgents")
        
        try:
            prompt = f"""Generate 10 personalities for: {req.agent_description}"""
            response = call_asi_one_api(prompt)
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            try:
                personalities_data = json.loads(cleaned.strip())
                if not isinstance(personalities_data, list) or len(personalities_data) != 10:
                    personalities_data = generate_fallback_personalities()
            except:
                personalities_data = generate_fallback_personalities()
            
            return PersonalityResponse(
                success=True,
                personalities=personalities_data,
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        except Exception as e:
            ctx.logger.error(f"Error: {e}")
            return PersonalityResponse(
                success=False,
                personalities=[],
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
    
    # Include chat protocol
    agent.include(chat_proto, publish_manifest=True)
    
    # Mount FastAPI app to agent
    app.mount("/", agent._server)


if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting CDP Agent Tester Backend...")
    print("📊 Powered by ASI:One AI")
    
    # Check if running on Render (Render sets PORT env variable)
    is_render = os.getenv("RENDER") or os.getenv("PORT")
    
    if UAGENTS_AVAILABLE and not is_render:
        # Only use uAgents locally, not on Render
        print("🤖 uAgents Framework: ENABLED")
        if os.getenv("AGENTVERSE_API_KEY"):
            print("✅ Agentverse Integration: ENABLED")
            print(f"🆔 Agent Address: {agent.address}")
        else:
            print("⚠️ Agentverse Integration: DISABLED (No API key)")
        print("🌐 Running in hybrid mode (FastAPI + uAgents)")
        # Run the agent (includes FastAPI)
        try:
            agent.run()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down...")
    else:
        if is_render:
            print("🌐 Running on Render - FastAPI only mode")
        else:
            print("⚠️ uAgents Framework: DISABLED")
            print("💡 To enable uAgents: pip install uagents uagents-core")
        
        print("🌐 Running in standalone FastAPI mode")
        
        # Get port from environment (Render provides this)
        port = int(os.getenv("PORT", 8000))
        print(f"🌐 Server will be available on port: {port}")
        print(f"📚 API docs at: http://localhost:{port}/docs")
        
        # Run standalone FastAPI
        uvicorn.run(app, host="0.0.0.0", port=port)

