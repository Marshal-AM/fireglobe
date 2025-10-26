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
from hyperon import MeTTa, E, S, ValueAtom

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


# Conversation Knowledge Graph
class ConversationKnowledgeGraph:
    """Knowledge Graph for storing conversations and BlockScout analyses using MeTTa"""
    def __init__(self):
        self.metta = MeTTa()
        self.initialize_schema()
    
    def initialize_schema(self):
        """Initialize the knowledge graph schema for conversation data."""
        # Conversation relationships
        self.metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("personality")))
        self.metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("messages")))
        self.metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("evaluation")))
        self.metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("transactions")))
        
        # Transaction relationships
        self.metta.space().add_atom(E(S("transaction_has"), S("transaction"), S("analysis")))
        self.metta.space().add_atom(E(S("transaction_has"), S("transaction"), S("conversation")))
        
        # Personality relationships
        self.metta.space().add_atom(E(S("personality_has"), S("personality"), S("conversations")))
    
    def add_conversation(self, conversation_id: str, personality_name: str, messages: List[Dict[str, Any]], 
                        timestamp: str, evaluation: Optional[Dict[str, Any]] = None, test_run_id: Optional[str] = None):
        """Add a conversation to the knowledge graph."""
        conv_id = conversation_id.replace("-", "_")
        pers_id = personality_name.lower().replace(" ", "_")
        
        # Store conversation metadata
        self.metta.space().add_atom(E(S("conversation_id"), S(conv_id), ValueAtom(conversation_id)))
        self.metta.space().add_atom(E(S("conversation_personality"), S(conv_id), ValueAtom(personality_name)))
        self.metta.space().add_atom(E(S("conversation_timestamp"), S(conv_id), ValueAtom(timestamp)))
        
        # Store test run ID if provided
        if test_run_id:
            self.metta.space().add_atom(E(S("conversation_test_run"), S(conv_id), ValueAtom(test_run_id)))
        
        # Store messages as JSON string
        messages_json = json.dumps(messages)
        self.metta.space().add_atom(E(S("conversation_messages"), S(conv_id), ValueAtom(messages_json)))
        
        # Link personality to conversation
        self.metta.space().add_atom(E(S("personality_conversation"), S(pers_id), S(conv_id)))
        
        # Store evaluation if provided
        if evaluation:
            eval_json = json.dumps(evaluation)
            self.metta.space().add_atom(E(S("conversation_evaluation"), S(conv_id), ValueAtom(eval_json)))
        
        return f"Successfully added conversation: {conversation_id}"
    
    def add_blockscout_analysis(self, transaction_hash: str, conversation_id: str, 
                               analysis: str, timestamp: str, chain_id: str = "", raw_data: Optional[Dict[str, Any]] = None):
        """Add BlockScout analysis linked to a conversation."""
        print(f"[KG] add_blockscout_analysis called with:")
        print(f"[KG]   - transaction_hash: {transaction_hash}")
        print(f"[KG]   - conversation_id: {conversation_id}")
        print(f"[KG]   - chain_id: {chain_id}")
        print(f"[KG]   - timestamp: {timestamp}")
        print(f"[KG]   - analysis length: {len(analysis)}")
        
        tx_id = transaction_hash.lower().replace("0x", "tx_")
        conv_id = conversation_id.replace("-", "_")
        
        print(f"[KG]   - tx_id: {tx_id}")
        print(f"[KG]   - conv_id: {conv_id}")
        
        # Store transaction analysis
        self.metta.space().add_atom(E(S("transaction_hash"), S(tx_id), ValueAtom(transaction_hash)))
        self.metta.space().add_atom(E(S("transaction_analysis"), S(tx_id), ValueAtom(analysis)))
        self.metta.space().add_atom(E(S("transaction_timestamp"), S(tx_id), ValueAtom(timestamp)))
        
        if chain_id:
            self.metta.space().add_atom(E(S("transaction_chain"), S(tx_id), ValueAtom(chain_id)))
            print(f"[KG] Stored chain_id: {chain_id}")
        
        # Link transaction to conversation (both directions)
        self.metta.space().add_atom(E(S("transaction_conversation"), S(tx_id), S(conv_id)))
        self.metta.space().add_atom(E(S("conversation_transaction"), S(conv_id), S(tx_id)))
        print(f"[KG] Created bidirectional links between tx and conversation")
        
        # Also store the transaction data directly in the conversation for easier retrieval
        tx_data = {
            "transaction_hash": transaction_hash,
            "chain_id": chain_id,
            "analysis": analysis,
            "timestamp": timestamp,
            "success": True,
            "raw_data": raw_data
        }
        tx_data_json = json.dumps(tx_data)
        self.metta.space().add_atom(E(S("conversation_tx_data"), S(conv_id), ValueAtom(tx_data_json)))
        print(f"[KG] Stored direct tx_data for conversation: {conv_id}")
        print(f"[KG] Transaction data stored successfully")
        
        # Store raw data separately for easier access
        if raw_data:
            raw_data_json = json.dumps(raw_data)
            self.metta.space().add_atom(E(S("transaction_raw_data"), S(tx_id), ValueAtom(raw_data_json)))
            print(f"[KG] Stored raw transaction data for tx: {tx_id}")
        
        return f"Successfully added BlockScout analysis for transaction: {transaction_hash}"
    
    def query_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Query a specific conversation by ID."""
        print(f"[KG] query_conversation called for: {conversation_id}")
        conv_id = conversation_id.replace("-", "_")
        print(f"[KG] Converted conv_id: {conv_id}")
        
        result = {}
        
        # Get conversation ID
        query_str = f'!(match &self (conversation_id {conv_id} $id) $id)'
        print(f"[KG] Running query: {query_str}")
        conv_results = self.metta.run(query_str)
        print(f"[KG] Conversation ID query results: {conv_results}")
        if conv_results and conv_results[0]:
            result['conversation_id'] = conv_results[0][0].get_object().value
            print(f"[KG] Found conversation_id: {result['conversation_id']}")
        else:
            print(f"[KG] No conversation found with ID: {conversation_id}")
            return None
        
        # Get personality
        query_str = f'!(match &self (conversation_personality {conv_id} $pers) $pers)'
        pers_results = self.metta.run(query_str)
        if pers_results and pers_results[0]:
            result['personality_name'] = pers_results[0][0].get_object().value
        
        # Get timestamp
        query_str = f'!(match &self (conversation_timestamp {conv_id} $time) $time)'
        time_results = self.metta.run(query_str)
        if time_results and time_results[0]:
            result['timestamp'] = time_results[0][0].get_object().value
        
        # Get test run ID
        query_str = f'!(match &self (conversation_test_run {conv_id} $test_run) $test_run)'
        test_run_results = self.metta.run(query_str)
        if test_run_results and test_run_results[0]:
            result['test_run_id'] = test_run_results[0][0].get_object().value
        
        # Get messages
        query_str = f'!(match &self (conversation_messages {conv_id} $msgs) $msgs)'
        msg_results = self.metta.run(query_str)
        if msg_results and msg_results[0]:
            messages_json = msg_results[0][0].get_object().value
            result['messages'] = json.loads(messages_json)
        
        # Get evaluation
        query_str = f'!(match &self (conversation_evaluation {conv_id} $eval) $eval)'
        eval_results = self.metta.run(query_str)
        if eval_results and eval_results[0]:
            eval_json = eval_results[0][0].get_object().value
            result['evaluation'] = json.loads(eval_json)
        
        # Get associated transactions - try direct storage first
        print(f"[KG] Querying for transactions...")
        query_str = f'!(match &self (conversation_tx_data {conv_id} $tx_data) $tx_data)'
        print(f"[KG] Running tx_data query: {query_str}")
        tx_data_results = self.metta.run(query_str)
        print(f"[KG] Direct tx_data query results: {tx_data_results}")
        print(f"[KG] Number of tx_data results: {len(tx_data_results) if tx_data_results else 0}")
        transactions = []
        
        if tx_data_results:
            print(f"[KG] Processing {len(tx_data_results)} tx_data results")
            for i, tx_data_result in enumerate(tx_data_results):
                print(f"[KG] Processing tx_data result {i}: {tx_data_result}")
                if tx_data_result and len(tx_data_result) > 0:
                    tx_data_json = tx_data_result[0].get_object().value
                    print(f"[KG] Extracted tx_data_json: {tx_data_json[:200]}...")
                    try:
                        tx_data = json.loads(tx_data_json)
                        transactions.append(tx_data)
                        print(f"[KG] Successfully parsed and added tx_data: {tx_data.get('transaction_hash')}")
                    except json.JSONDecodeError as e:
                        print(f"[KG] Failed to parse tx_data JSON: {e}")
                        continue
        else:
            print(f"[KG] No direct tx_data found, trying old method...")
        
        # If no direct data found, try the old method
        if not transactions:
            query_str = f'!(match &self (conversation_transaction {conv_id} $tx) $tx)'
            print(f"[KG] Running old method query: {query_str}")
            tx_results = self.metta.run(query_str)
            print(f"[KG] Old method tx_results: {tx_results}")
            print(f"[KG] Number of old method results: {len(tx_results) if tx_results else 0}")
            
            if tx_results:
                for i, tx_result in enumerate(tx_results):
                    print(f"[KG] Processing old method result {i}: {tx_result}")
                    if tx_result and len(tx_result) > 0:
                        tx_id = str(tx_result[0])
                        print(f"[KG] Extracted tx_id: {tx_id}")
                        tx_data = self.query_transaction_by_id(tx_id)
                        if tx_data:
                            transactions.append(tx_data)
                            print(f"[KG] Added tx_data from old method: {tx_data.get('transaction_hash')}")
                        else:
                            print(f"[KG] query_transaction_by_id returned None for {tx_id}")
        
        print(f"[KG] Final transactions count: {len(transactions)}")
        result['transactions'] = transactions
        
        return result
    
    def query_transaction_by_id(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Query transaction by its internal ID."""
        result = {}
        
        # Get transaction hash
        query_str = f'!(match &self (transaction_hash {tx_id} $hash) $hash)'
        hash_results = self.metta.run(query_str)
        if hash_results and hash_results[0]:
            result['transaction_hash'] = hash_results[0][0].get_object().value
        else:
            return None
        
        # Get analysis
        query_str = f'!(match &self (transaction_analysis {tx_id} $analysis) $analysis)'
        analysis_results = self.metta.run(query_str)
        if analysis_results and analysis_results[0]:
            result['analysis'] = analysis_results[0][0].get_object().value
        
        # Get timestamp
        query_str = f'!(match &self (transaction_timestamp {tx_id} $time) $time)'
        time_results = self.metta.run(query_str)
        if time_results and time_results[0]:
            result['timestamp'] = time_results[0][0].get_object().value
        
        # Get chain ID
        query_str = f'!(match &self (transaction_chain {tx_id} $chain) $chain)'
        chain_results = self.metta.run(query_str)
        if chain_results and chain_results[0]:
            result['chain_id'] = chain_results[0][0].get_object().value
        
        # Get raw data
        query_str = f'!(match &self (transaction_raw_data {tx_id} $raw_data) $raw_data)'
        raw_data_results = self.metta.run(query_str)
        if raw_data_results and raw_data_results[0]:
            raw_data_json = raw_data_results[0][0].get_object().value
            result['raw_data'] = json.loads(raw_data_json)
        
        return result
    
    def query_by_personality(self, personality_name: str) -> List[Dict[str, Any]]:
        """Query all conversations by personality."""
        pers_id = personality_name.lower().replace(" ", "_")
        
        # Get all conversations for this personality
        query_str = f'!(match &self (personality_conversation {pers_id} $conv) $conv)'
        conv_results = self.metta.run(query_str)
        
        conversations = []
        if conv_results:
            for conv_result in conv_results:
                if conv_result and len(conv_result) > 0:
                    conv_id_str = str(conv_result[0])
                    # Reconstruct conversation_id
                    query_str = f'!(match &self (conversation_id {conv_id_str} $id) $id)'
                    id_results = self.metta.run(query_str)
                    if id_results and id_results[0]:
                        original_id = id_results[0][0].get_object().value
                        conv_data = self.query_conversation(original_id)
                        if conv_data:
                            conversations.append(conv_data)
        
        return conversations
    
    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """Get all conversations in the knowledge graph."""
        query_str = '!(match &self (conversation_id $conv_id $original_id) $original_id)'
        results = self.metta.run(query_str)
        
        conversations = []
        if results:
            for result in results:
                if result and len(result) > 0:
                    original_id = result[0].get_object().value
                    conv_data = self.query_conversation(original_id)
                    if conv_data:
                        conversations.append(conv_data)
        
        return conversations
    
    def get_all_transactions(self) -> List[Dict[str, Any]]:
        """Get all BlockScout transaction analyses in the knowledge graph."""
        query_str = '!(match &self (transaction_hash $tx_id $hash) $hash)'
        results = self.metta.run(query_str)
        
        transactions = []
        if results:
            for result in results:
                if result and len(result) > 0:
                    tx_hash = result[0].get_object().value
                    tx_id = tx_hash.lower().replace("0x", "tx_")
                    tx_data = self.query_transaction_by_id(tx_id)
                    if tx_data:
                        transactions.append(tx_data)
        
        return transactions


# Initialize the conversation knowledge graph
conversation_kg = ConversationKnowledgeGraph()


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
            
            # DETAILED LOGGING
            print("\n" + "="*80)
            print("🔍 LLM API CALL - DETAILED DEBUG")
            print("="*80)
            print(f"📍 Endpoint: {self.base_url}/chat/completions")
            print(f"📊 Model: {payload['model']}")
            print(f"🌡️  Temperature: {payload['temperature']}")
            print(f"📏 Max Tokens: {payload['max_tokens']}")
            print(f"📝 Prompt Length: {len(prompt)} characters")
            print(f"📝 Prompt Preview (first 500 chars):")
            print("-" * 80)
            print(prompt[:500])
            print("-" * 80)
            if len(prompt) > 500:
                print(f"... (truncated, {len(prompt) - 500} more characters)")
            print("\n🔑 Headers:")
            print(f"   Authorization: Bearer {self.api_key[:20]}...{self.api_key[-10:]}")
            print(f"   Content-Type: application/json")
            print("\n📤 Sending request...")
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=3000
            )
            
            print(f"\n📥 Response Status: {response.status_code}")
            print(f"📥 Response Headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                print(f"\n❌ ERROR RESPONSE:")
                print(f"   Status Code: {response.status_code}")
                print(f"   Response Text: {response.text}")
                print(f"   Response Content: {response.content}")
                try:
                    error_json = response.json()
                    print(f"   Response JSON: {json.dumps(error_json, indent=2)}")
                except:
                    print(f"   (Could not parse as JSON)")
                print("="*80 + "\n")
                raise Exception(f"ASI:One API error: {response.status_code} - {response.text}")
            
            response_data = response.json()
            print(f"\n✅ SUCCESS!")
            print(f"   Response preview: {str(response_data)[:200]}...")
            print("="*80 + "\n")
            
            return response_data["choices"][0]["message"]["content"]
            
        except Exception as e:
            print(f"\n❌ EXCEPTION in LLM.complete():")
            print(f"   Exception Type: {type(e).__name__}")
            print(f"   Exception Message: {str(e)}")
            import traceback
            print(f"   Traceback:")
            print(traceback.format_exc())
            print("="*80 + "\n")
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
    previous_messages: List[Dict[str, Any]]  # Changed from Dict[str, str] to allow transaction_analysis
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
    raw_data: Optional[Dict[str, Any]] = None
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
            timeout=3000
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
    
    # Look for transaction hash pattern (0x followed by hex characters)
    # Ethereum transaction hashes are typically 0x + 64 hex characters = 66 characters total
    # But some systems might truncate or use different formats, so we'll be more flexible
    tx_pattern = r'0x[a-fA-F0-9]{60,66}'
    tx_match = re.search(tx_pattern, message)
    
    if not tx_match:
        return None
    
    tx_hash = tx_match.group()
    
    # Debug logging
    print(f"[TX-DETECT] Found transaction hash: {tx_hash}")
    print(f"[TX-DETECT] Hash length: {len(tx_hash)}")
    print(f"[TX-DETECT] Message context: {message[:200]}...")
    
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
        ctx.logger.info(f"Attempting to send A2A message to BlockscoutAgent address: {BLOCKSCOUT_AGENT_ADDRESS}")
        ctx.logger.info(f"Transaction context data: {tx_context}")
        
        try:
            await ctx.send(BLOCKSCOUT_AGENT_ADDRESS, tx_context)
            ctx.logger.info(f"Successfully sent transaction context to BlockscoutAgent: {tx_info['tx_hash']}")
        except Exception as a2a_error:
            ctx.logger.error(f"A2A send failed: {a2a_error}")
            ctx.logger.error(f"A2A error type: {type(a2a_error).__name__}")
            import traceback
            ctx.logger.error(f"A2A traceback: {traceback.format_exc()}")
            raise a2a_error
        
    except Exception as e:
        ctx.logger.error(f"Failed to send transaction context to BlockscoutAgent: {e}")
        ctx.logger.error(f"Error type: {type(e).__name__}")
        import traceback
        ctx.logger.error(f"Traceback: {traceback.format_exc()}")


async def get_transaction_analysis_from_blockscout(tx_hash: str) -> Optional[Dict[str, Any]]:
    """Get transaction analysis from BlockscoutAgent using HTTP POST."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BLOCKSCOUT_AGENT_URL}/rest/get-analysis",
                json={"tx_hash": tx_hash, "chain_id": "84532", "include_logs": True, "include_traces": False}
            )
            if response.status_code == 200:
                return response.json()
            else:
                return None
    except Exception as e:
        print(f"Error getting analysis from BlockscoutAgent: {e}")
        return None


async def get_transaction_raw_data_from_blockscout(tx_hash: str) -> Optional[Dict[str, Any]]:
    """Get raw transaction data from BlockScout MCP via BlockscoutAgent."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            # Call the test-blockscout endpoint to get raw data
            response = await client.post(
                f"{BLOCKSCOUT_AGENT_URL}/rest/test-blockscout",
                json={"tx_hash": tx_hash, "chain_id": "84532", "include_logs": True, "include_traces": False}
            )
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("data"):
                    return result["data"]
            return None
    except Exception as e:
        print(f"Error getting raw data from BlockscoutAgent: {e}")
        return None


async def auto_fetch_missing_raw_data(ctx: Context, transactions: List[Dict[str, Any]]):
    """Automatically fetch raw data for transactions that don't have it"""
    ctx.logger.info("[AUTO-FETCH] Starting auto-fetch for missing raw data")
    
    missing_raw_data_txs = []
    for tx in transactions:
        tx_hash = tx.get('transaction_hash', '')
        if tx_hash and not tx.get('raw_data'):
            missing_raw_data_txs.append(tx_hash)
            ctx.logger.info(f"[AUTO-FETCH] Transaction {tx_hash} missing raw data")
    
    if not missing_raw_data_txs:
        ctx.logger.info("[AUTO-FETCH] No transactions missing raw data")
        return
    
    ctx.logger.info(f"[AUTO-FETCH] Found {len(missing_raw_data_txs)} transactions missing raw data")
    
    # Fetch raw data for each missing transaction
    for tx_hash in missing_raw_data_txs:
        try:
            ctx.logger.info(f"[AUTO-FETCH] Fetching raw data for {tx_hash}")
            
            # Fetch raw data from BlockScoutAgent
            raw_data = await get_transaction_raw_data_from_blockscout(tx_hash)
            
            if raw_data:
                ctx.logger.info(f"[AUTO-FETCH] Successfully fetched raw data for {tx_hash}")
                
                # Store in Knowledge Graph
                try:
                    kg_result = conversation_kg.add_blockscout_analysis(
                        transaction_hash=tx_hash,
                        conversation_id="auto_fetch",  # Use a placeholder conversation ID
                        analysis="Raw data auto-fetched",
                        timestamp=datetime.utcnow().isoformat(),
                        chain_id="84532",
                        raw_data=raw_data
                    )
                    ctx.logger.info(f"[AUTO-FETCH] Stored raw data in KG for {tx_hash}: {kg_result}")
                except Exception as kg_error:
                    ctx.logger.error(f"[AUTO-FETCH] Failed to store raw data in KG for {tx_hash}: {kg_error}")
            else:
                ctx.logger.warning(f"[AUTO-FETCH] No raw data found for {tx_hash}")
                
        except Exception as e:
            ctx.logger.error(f"[AUTO-FETCH] Error fetching raw data for {tx_hash}: {e}")
    
    ctx.logger.info("[AUTO-FETCH] Auto-fetch completed")


def generate_fallback_personalities() -> List[Dict[str, str]]:
    """Generate fallback personalities that test DeFi capabilities using existing Base Sepolia funds - EXACTLY 1 tool call per personality"""
    return [
        {
            "name": "TransferInitiator",
            "personality": "Immediately asks for a transfer to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844, then asks general DeFi questions",
            "description": "FIRST personality that immediately requests a transfer to the specified address (1 tool call), then engages in general DeFi discussion."
        },
        {
            "name": "BudgetConsciousDeFiUser",
            "personality": "Asks about current balance first, suggests ONE swap within budget, then discusses DeFi strategies",
            "description": "Tests the agent's DeFi capabilities by first checking Base Sepolia balance, then suggesting ONE swap operation (1 tool call), followed by general DeFi discussion."
        },
        {
            "name": "TestnetExperimenter",
            "personality": "Wants to try ONE DeFi feature using existing testnet funds, then asks about other DeFi concepts",
            "description": "Encourages the agent to demonstrate ONE DeFi feature using available Base Sepolia testnet funds (1 tool call), then asks educational questions."
        },
        {
            "name": "YieldSeeker",
            "personality": "Looks for ONE staking opportunity with current balance, then discusses yield farming strategies",
            "description": "Asks the agent to find ONE yield opportunity that works with existing funds (1 tool call), then discusses yield farming concepts."
        },
        {
            "name": "TokenExplorer",
            "personality": "Wants to interact with ONE token using available funds, then asks about tokenomics",
            "description": "Tests token interaction capabilities by asking about ONE token operation within budget (1 tool call), then discusses tokenomics."
        },
        {
            "name": "DeFiLearner",
            "personality": "Asks to demonstrate ONE specific DeFi feature within budget constraints, then asks educational questions",
            "description": "Encourages the agent to show ONE DeFi capability using existing funds (1 tool call), then focuses on educational discussion."
        },
        {
            "name": "EfficientUser",
            "personality": "Suggests ONE gas-efficient operation with existing funds, then discusses optimization strategies",
            "description": "Tests the agent's ability to suggest ONE efficient DeFi operation that works with current Base Sepolia balance (1 tool call), then discusses optimization."
        },
        {
            "name": "BalanceChecker",
            "personality": "Always starts by asking about wallet balance, then suggests ONE appropriate action, then asks general questions",
            "description": "Tests the agent's balance checking capabilities and ensures ONE suggestion is within available funds (1 tool call), then asks general questions."
        },
        {
            "name": "TestnetOptimizer",
            "personality": "Wants to try ONE optimal DeFi strategy with existing testnet funds, then discusses best practices",
            "description": "Tests the agent's ability to suggest ONE optimal DeFi strategy using only existing Base Sepolia funds (1 tool call), then discusses best practices."
        },
        {
            "name": "FeatureTester",
            "personality": "Wants to test ONE specific DeFi feature with available funds, then asks about other features",
            "description": "Encourages the agent to demonstrate ONE specific DeFi feature using existing funds (1 tool call), then asks about other capabilities."
        },
        {
            "name": "PracticalUser",
            "personality": "Suggests ONE realistic DeFi operation that works with current balance, then discusses practical applications",
            "description": "Tests the agent's practical DeFi capabilities by suggesting ONE realistic operation within budget constraints (1 tool call), then discusses practical applications."
        }
    ]


# Initialize uAgent
AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")

# BlockscoutAgent configuration
BLOCKSCOUT_AGENT_URL = "https://blockscoutagent-739298578243.us-central1.run.app"
BLOCKSCOUT_AGENT_ADDRESS = "agent1q2qnrd7y6caqqj88gzdm82mt589jx3ttew8hemhjdg9jqdy092zh7xgr4v9"  # A2A address if needed

# Metrics Generator Agent configuration
METRICS_GENERATOR_URL = "https://metricsgen-739298578243.us-central1.run.app"
METRICS_GENERATOR_ADDRESS = "agent1qvx8fqtw9jp48pl3c22h7dzgeu78ksp3vnuk748lep3m6hjc3tt3g0wdfya"  # A2A address if needed

# Store transaction analyses for SDK retrieval
transaction_analyses = {}

agent = Agent(
    name="cdp_agent_tester_backend",
    port=8080,
    seed="cdp agent tester backend seed phrase",
    mailbox=f"{AGENTVERSE_API_KEY}" if AGENTVERSE_API_KEY else None,
    endpoint=["https://backend-739298578243.us-central1.run.app/submit"]
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

CRITICAL REQUIREMENTS:
1. Generate exactly {num_personalities} personalities
2. Each personality MUST make EXACTLY ONE tool call - NO MORE, NO LESS
3. The FIRST personality MUST be a trading knowledge seeker who asks about current prices, trading tactics, market analysis, and trading strategies
4. Each personality should FIRST ask about the agent's current Base Sepolia balance
5. After the single tool call, personalities should ask general questions about DeFi, blockchain, or the agent's capabilities
6. Focus on Base Sepolia testnet operations only
7. Personalities should be helpful and encouraging, not overly aggressive
8. Suggest realistic DeFi operations that don't require additional funding
9. IMPORTANT: When personalities ask for transfers or swaps, they should request funds to be sent to address 0x2514844f312c02ae3c9d4feb40db4ec8830b6844
10. After the single tool call, personalities should engage in general conversation about DeFi topics

EXAMPLES OF GOOD BASE SEPOLIA TESTING PERSONALITIES:
- "Trading Knowledge Seeker" - FIRST personality that asks about current crypto prices, trading strategies, market analysis, and best trading tactics (1 tool call), then discusses trading concepts
- "Budget-Conscious DeFi User" - Asks about balance first, suggests ONE swap within budget (1 tool call), then discusses DeFi strategies
- "Testnet Experimenter" - Wants to try ONE DeFi feature with existing testnet funds (1 tool call), then asks about other DeFi concepts
- "Yield Seeker" - Looks for ONE staking/farming opportunity with current balance (1 tool call), then discusses yield farming strategies
- "Token Explorer" - Wants to interact with ONE token using available funds (1 tool call), then asks about tokenomics
- "DeFi Learner" - Asks to demonstrate ONE specific feature within budget constraints (1 tool call), then asks educational questions
- "Efficient User" - Suggests ONE gas-efficient operation with existing funds (1 tool call), then discusses optimization strategies

FORMAT: Return a STRICT JSON array with exactly this structure:
[
  {{
    "name": "PersonalityName",
    "personality": "Brief personality traits focused on making exactly ONE tool call then general conversation",
    "description": "Detailed description of how this personality will test the agent's DeFi capabilities with exactly ONE tool call using only existing Base Sepolia funds, followed by general DeFi discussion"
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
        
        # DETAILED REQUEST LOGGING
        print("\n" + "="*80)
        print("🎭 PERSONALITY MESSAGE GENERATION REQUEST")
        print("="*80)
        print(f"📝 Is Initial: {is_initial}")
        print(f"👤 Personality Name: {personality.get('name', 'Unknown')}")
        print(f"💬 Previous Messages Count: {len(previous_messages)}")
        print(f"📋 Previous Messages:")
        for i, msg in enumerate(previous_messages):
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            has_tx_analysis = 'transaction_analysis' in msg if isinstance(msg, dict) else False
            print(f"   [{i}] {role}: {content[:100]}{'...' if len(content) > 100 else ''}")
            if has_tx_analysis:
                print(f"        ⚠️  Has transaction_analysis field")
        print("="*80 + "\n")
        
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

CRITICAL REQUIREMENTS:
- FIRST ask about the agent's current Base Sepolia balance
- Suggest DeFi operations that work within the agent's existing funds
- Focus on Base Sepolia testnet operations only
- You MUST encourage the agent to make EXACTLY ONE tool call - NO MORE, NO LESS
- After the single tool call, ask general questions about DeFi, blockchain, or the agent's capabilities
- Be helpful and educational, not demanding
- When requesting transfers or swaps, ask for funds to be sent to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844

Keep your message concise (1-3 sentences) and friendly.

Your opening message:"""
        else:
            # Generate follow-up with FULL conversation context (but truncate long messages)
            conversation_history = []
            for msg in previous_messages:
                role_label = "You" if msg.get('role') == 'user' else "Agent"
                content = msg.get('content', '')
                
                # Skip if this is ONLY a transaction_analysis message (no actual content)
                if not content or not content.strip():
                    continue
                
                # Skip if the message content is just a transaction analysis header
                if content.startswith("[Transaction Analysis"):
                    continue
                
                # Truncate very long messages (keep first 300 chars)
                if len(content) > 300:
                    content = content[:300] + "..."
                
                conversation_history.append(f"{role_label}: {content}")
            
            full_context = "\n\n".join(conversation_history)
            
            prompt = f"""You are continuing a conversation with a DeFi blockchain agent on Base Sepolia testnet. You want to test the agent's capabilities using its existing funds.

Your Personality Traits: {personality_trait}
Your Characteristics: {personality_desc}

FULL CONVERSATION SO FAR:
{full_context}

Task: Generate your next response that encourages the agent to use its DeFi tools on Base Sepolia testnet. Be helpful and encouraging.

CRITICAL REQUIREMENTS:
- You MUST ensure the agent makes EXACTLY ONE tool call during the entire conversation - NO MORE, NO LESS
- If the agent hasn't checked its balance yet, ask about Base Sepolia balance first
- If the agent hasn't made a tool call yet, encourage ONE specific DeFi operation within budget
- If the agent has already made a tool call, ask general questions about DeFi, blockchain, or the agent's capabilities
- Focus on Base Sepolia testnet operations only
- Be helpful and educational, not demanding
- When requesting transfers or swaps, ask for funds to be sent to 0x2514844f312c02ae3c9d4feb40db4ec8830b6844
- After the single tool call, engage in general DeFi discussion

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
        ctx.logger.info(f"[TX-CHECK] Checking message for transaction hash: {message[:100]}...")
        tx_info = extract_transaction_from_message(message)
        if tx_info:
            ctx.logger.info(f"[TX-CHECK] Transaction detected in message: {tx_info['tx_hash']}")
            ctx.logger.info(f"[TX-CHECK] Chain ID: {tx_info['chain_id']}")
            # Send transaction context to BlockscoutAgent asynchronously
            import asyncio
            asyncio.create_task(send_transaction_context_to_blockscout(
                ctx, 
                f"conv_{datetime.utcnow().timestamp()}", 
                personality_name, 
                previous_messages + [{"role": "user", "content": message}], 
                tx_info
            ))
        else:
            ctx.logger.info(f"[TX-CHECK] No transaction hash detected in message")
        
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
    ctx.logger.info(f"[A2A] Received transaction analysis from BlockscoutAgent for tx: {msg.transaction_hash}")
    ctx.logger.info(f"[A2A] Sender: {sender}")
    ctx.logger.info(f"[A2A] Conversation ID: {msg.conversation_id}")
    ctx.logger.info(f"[A2A] Timestamp: {msg.timestamp}")
    ctx.logger.info(f"[A2A] Success: {msg.success}")
    ctx.logger.info(f"[A2A] Analysis length: {len(msg.analysis)}")
    ctx.logger.info(f"[A2A] Analysis preview: {msg.analysis[:200]}...")
    ctx.logger.info(f"[A2A] Raw data available: {msg.raw_data is not None}")
    if msg.raw_data:
        ctx.logger.info(f"[A2A] Raw data keys: {list(msg.raw_data.keys()) if isinstance(msg.raw_data, dict) else 'Not a dict'}")
        ctx.logger.info(f"[A2A] Raw data preview: {str(msg.raw_data)[:200]}...")
    
    # Store the analysis for SDK retrieval
    transaction_analyses[msg.transaction_hash] = {
        "conversation_id": msg.conversation_id,
        "analysis": msg.analysis,
        "timestamp": msg.timestamp,
        "success": msg.success
    }
    
    ctx.logger.info(f"[A2A] Stored analysis in transaction_analyses dict for tx: {msg.transaction_hash}")
    ctx.logger.info(f"[A2A] transaction_analyses now contains {len(transaction_analyses)} entries")
    
    # Store in Knowledge Graph
    try:
        ctx.logger.info(f"[A2A] Attempting to store in Knowledge Graph...")
        ctx.logger.info(f"[A2A] KG params: tx_hash={msg.transaction_hash}, conv_id={msg.conversation_id}")
        ctx.logger.info(f"[A2A] Raw data available: {msg.raw_data is not None}")
        if msg.raw_data:
            ctx.logger.info(f"[A2A] Raw data keys: {list(msg.raw_data.keys()) if isinstance(msg.raw_data, dict) else 'Not a dict'}")
        
        kg_result = conversation_kg.add_blockscout_analysis(
            transaction_hash=msg.transaction_hash,
            conversation_id=msg.conversation_id,
            analysis=msg.analysis,
            timestamp=msg.timestamp,
            chain_id="84532",  # Default to Base Sepolia
            raw_data=msg.raw_data
        )
        ctx.logger.info(f"[A2A] Knowledge Graph BlockScout storage result: {kg_result}")
        ctx.logger.info(f"[A2A] Successfully stored transaction analysis in KG")
    except Exception as kg_error:
        ctx.logger.error(f"[A2A] KG BlockScout storage failed: {kg_error}")
        ctx.logger.error(f"[A2A] Exception type: {type(kg_error).__name__}")
        import traceback
        ctx.logger.error(f"[A2A] Traceback: {traceback.format_exc()}")


@agent.on_rest_post("/rest/store-conversation", ConversationStorageRequest, ConversationStorageResponse)
async def handle_store_conversation(ctx: Context, req: ConversationStorageRequest) -> ConversationStorageResponse:
    """Store a conversation for later analysis - now extracts and stores transaction data from messages"""
    ctx.logger.info(f"[STORE-CONV] ========== NEW CONVERSATION STORAGE REQUEST ==========")
    ctx.logger.info(f"[STORE-CONV] Storing conversation: {req.conversation_id}")
    ctx.logger.info(f"[STORE-CONV] Personality: {req.personality_name}")
    ctx.logger.info(f"[STORE-CONV] Number of messages: {len(req.messages)}")
    print(f"\n[STORE-CONV] ========== STORING CONVERSATION ==========")
    print(f"[STORE-CONV] Conversation ID: {req.conversation_id}")
    print(f"[STORE-CONV] Personality: {req.personality_name}")
    print(f"[STORE-CONV] Messages count: {len(req.messages)}")
    print(f"[STORE-CONV] ==============================================\n")
    ctx.logger.info(f"[STORE-CONV] Number of messages: {len(req.messages)}")
    
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"conversation_{req.conversation_id}_{timestamp}.json"
        filepath = STORAGE_DIR / filename
        
        # Extract transaction analyses from messages
        transactions_in_conversation = []
        for msg in req.messages:
            # Check if message has transaction_analysis field
            if isinstance(msg, dict) and 'transaction_analysis' in msg:
                tx_analysis = msg['transaction_analysis']
                ctx.logger.info(f"[STORE-CONV] Found transaction analysis in message: {tx_analysis.get('transaction_hash', 'unknown')}")
                transactions_in_conversation.append({
                    "transaction_hash": tx_analysis.get('transaction_hash', ''),
                    "chain_id": tx_analysis.get('chain', '84532'),
                    "analysis": tx_analysis.get('analysis', ''),
                    "timestamp": tx_analysis.get('timestamp', ''),
                    "raw_data": tx_analysis.get('raw_data'),
                    "success": True
                })
        
        ctx.logger.info(f"[STORE-CONV] Extracted {len(transactions_in_conversation)} transactions from messages")
        
        # Generate a test run ID based on the current hour to group conversations from the same test run
        current_hour = datetime.utcnow().strftime("%Y-%m-%d_%H")
        test_run_id = f"test_run_{current_hour}"
        
        data = {
            "conversation_id": req.conversation_id,
            "personality_name": req.personality_name,
            "messages": req.messages,
            "transactions": transactions_in_conversation,
            "test_run_id": test_run_id,  # Add test run ID for grouping
            "stored_at": datetime.utcnow().isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        ctx.logger.info(f"[STORE-CONV] Saved to file: {filepath}")
        
        # Store in Knowledge Graph with transactions
        try:
            ctx.logger.info(f"[STORE-CONV] ========== STORING IN KNOWLEDGE GRAPH ==========")
            ctx.logger.info(f"[STORE-CONV] Conversation ID: {req.conversation_id}")
            ctx.logger.info(f"[STORE-CONV] Personality: {req.personality_name}")
            print(f"\n[STORE-CONV] ========== STORING IN KG ==========")
            print(f"[STORE-CONV] Conversation ID: {req.conversation_id}")
            print(f"[STORE-CONV] Personality: {req.personality_name}")
            
            kg_result = conversation_kg.add_conversation(
                conversation_id=req.conversation_id,
                personality_name=req.personality_name,
                messages=req.messages,
                timestamp=datetime.utcnow().isoformat(),
                test_run_id=test_run_id  # Add test run ID to KG storage
            )
            ctx.logger.info(f"[STORE-CONV] KG conversation storage: {kg_result}")
            print(f"[STORE-CONV] ✅ CONVERSATION STORED IN KG")
            print(f"[STORE-CONV] Result: {kg_result}\n")
            
            # Verify storage by counting conversations
            all_convs = conversation_kg.get_all_conversations()
            ctx.logger.info(f"[STORE-CONV] Total conversations in KG after storage: {len(all_convs)}")
            print(f"[STORE-CONV] 📊 Total conversations in KG now: {len(all_convs)}")
            for i, conv in enumerate(all_convs):
                print(f"[STORE-CONV]    {i+1}. {conv.get('personality_name', 'Unknown')} - ID: {conv.get('conversation_id', 'Unknown')[:8]}...")
            
            # Store each transaction in KG
            for tx_data in transactions_in_conversation:
                ctx.logger.info(f"[STORE-CONV] Storing transaction in KG: {tx_data['transaction_hash']}")
                tx_kg_result = conversation_kg.add_blockscout_analysis(
                    transaction_hash=tx_data['transaction_hash'],
                    conversation_id=req.conversation_id,
                    analysis=tx_data['analysis'],
                    timestamp=tx_data['timestamp'],
                    chain_id=tx_data['chain_id'],
                    raw_data=tx_data.get('raw_data')
                )
                ctx.logger.info(f"[STORE-CONV] KG transaction storage: {tx_kg_result}")
                
        except Exception as kg_error:
            ctx.logger.warning(f"[STORE-CONV] KG storage failed but file saved: {kg_error}")
            import traceback
            ctx.logger.warning(f"[STORE-CONV] Traceback: {traceback.format_exc()}")
        
        return ConversationStorageResponse(
            success=True,
            filepath=str(filepath),
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        ctx.logger.error(f"[STORE-CONV] Failed to store conversation: {str(e)}")
        import traceback
        ctx.logger.error(f"[STORE-CONV] Traceback: {traceback.format_exc()}")
        return ConversationStorageResponse(
            success=False,
            filepath="",
            timestamp=datetime.utcnow().isoformat()
        )


# Knowledge Graph Query Models
class KGConversationQueryRequest(Model):
    """Request to query a specific conversation from KG"""
    conversation_id: str


class KGConversationQueryResponse(Model):
    """Response with conversation data from KG"""
    success: bool
    conversation: Optional[Dict[str, Any]] = None
    message: str


class KGPersonalityQueryRequest(Model):
    """Request to query conversations by personality"""
    personality_name: str


class KGPersonalityQueryResponse(Model):
    """Response with conversations by personality"""
    success: bool
    conversations: List[Dict[str, Any]]
    count: int
    message: str


class KGAllConversationsResponse(Model):
    """Response with all conversations"""
    success: bool
    conversations: List[Dict[str, Any]]
    count: int
    message: str


class KGAllTransactionsResponse(Model):
    """Response with all transactions"""
    success: bool
    transactions: List[Dict[str, Any]]
    count: int
    message: str


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


# Knowledge Graph Query Endpoints
@agent.on_rest_post("/rest/kg/query-conversation", KGConversationQueryRequest, KGConversationQueryResponse)
async def handle_kg_query_conversation(ctx: Context, req: KGConversationQueryRequest) -> KGConversationQueryResponse:
    """Query a specific conversation from the Knowledge Graph"""
    ctx.logger.info(f"KG Query: Retrieving conversation {req.conversation_id}")
    
    try:
        conversation = conversation_kg.query_conversation(req.conversation_id)
        
        if conversation:
            return KGConversationQueryResponse(
                success=True,
                conversation=conversation,
                message=f"Successfully retrieved conversation: {req.conversation_id}"
            )
        else:
            return KGConversationQueryResponse(
                success=False,
                conversation=None,
                message=f"Conversation not found: {req.conversation_id}"
            )
    
    except Exception as e:
        ctx.logger.error(f"Failed to query conversation: {str(e)}")
        return KGConversationQueryResponse(
            success=False,
            conversation=None,
            message=f"Error querying conversation: {str(e)}"
        )


@agent.on_rest_post("/rest/kg/query-by-personality", KGPersonalityQueryRequest, KGPersonalityQueryResponse)
async def handle_kg_query_by_personality(ctx: Context, req: KGPersonalityQueryRequest) -> KGPersonalityQueryResponse:
    """Query all conversations by personality from the Knowledge Graph"""
    ctx.logger.info(f"KG Query: Retrieving conversations for personality {req.personality_name}")
    
    try:
        conversations = conversation_kg.query_by_personality(req.personality_name)
        
        return KGPersonalityQueryResponse(
            success=True,
            conversations=conversations,
            count=len(conversations),
            message=f"Found {len(conversations)} conversations for personality: {req.personality_name}"
        )
    
    except Exception as e:
        ctx.logger.error(f"Failed to query by personality: {str(e)}")
        return KGPersonalityQueryResponse(
            success=False,
            conversations=[],
            count=0,
            message=f"Error querying by personality: {str(e)}"
        )


@agent.on_rest_get("/rest/kg/all-conversations", KGAllConversationsResponse)
async def handle_kg_all_conversations(ctx: Context) -> KGAllConversationsResponse:
    """Get all conversations from the Knowledge Graph"""
    ctx.logger.info("KG Query: Retrieving all conversations")
    
    try:
        conversations = conversation_kg.get_all_conversations()
        
        return KGAllConversationsResponse(
            success=True,
            conversations=conversations,
            count=len(conversations),
            message=f"Successfully retrieved {len(conversations)} conversations"
        )
    
    except Exception as e:
        ctx.logger.error(f"Failed to get all conversations: {str(e)}")
        return KGAllConversationsResponse(
            success=False,
            conversations=[],
            count=0,
            message=f"Error retrieving conversations: {str(e)}"
        )


@agent.on_rest_get("/rest/kg/all-transactions", KGAllTransactionsResponse)
async def handle_kg_all_transactions(ctx: Context) -> KGAllTransactionsResponse:
    """Get all BlockScout transaction analyses from the Knowledge Graph"""
    ctx.logger.info("KG Query: Retrieving all transaction analyses")
    
    try:
        transactions = conversation_kg.get_all_transactions()
        
        return KGAllTransactionsResponse(
            success=True,
            transactions=transactions,
            count=len(transactions),
            message=f"Successfully retrieved {len(transactions)} transaction analyses"
        )
    
    except Exception as e:
        ctx.logger.error(f"Failed to get all transactions: {str(e)}")
        return KGAllTransactionsResponse(
            success=False,
            transactions=[],
            count=0,
            message=f"Error retrieving transactions: {str(e)}"
        )


# New endpoint for getting the last inserted entry
class KGLastEntryResponse(Model):
    """Response with the last inserted entry from KG"""
    success: bool
    entry_type: str  # "conversation" or "transaction"
    entry: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None
    message: str


# New endpoint to fetch and store raw data for existing transactions
class FetchRawDataRequest(Model):
    """Request to fetch raw data for a transaction"""
    transaction_hash: str
    chain_id: str = "84532"


class FetchRawDataResponse(Model):
    """Response for raw data fetch"""
    success: bool
    message: str
    raw_data: Optional[Dict[str, Any]] = None


@agent.on_rest_post("/rest/fetch-raw-data", FetchRawDataRequest, FetchRawDataResponse)
async def handle_fetch_raw_data(ctx: Context, req: FetchRawDataRequest) -> FetchRawDataResponse:
    """Fetch raw transaction data and store it in Knowledge Graph"""
    ctx.logger.info(f"Received request to fetch raw data for tx: {req.transaction_hash}")
    
    try:
        # Fetch raw data from BlockScoutAgent
        raw_data = await get_transaction_raw_data_from_blockscout(req.transaction_hash)
        
        if raw_data:
            ctx.logger.info(f"Successfully fetched raw data for tx: {req.transaction_hash}")
            ctx.logger.info(f"Raw data keys: {list(raw_data.keys()) if isinstance(raw_data, dict) else 'Not a dict'}")
            
            # Store in Knowledge Graph
            try:
                kg_result = conversation_kg.add_blockscout_analysis(
                    transaction_hash=req.transaction_hash,
                    conversation_id="manual_fetch",  # Use a placeholder conversation ID
                    analysis="Raw data fetched manually",
                    timestamp=datetime.utcnow().isoformat(),
                    chain_id=req.chain_id,
                    raw_data=raw_data
                )
                ctx.logger.info(f"Stored raw data in KG: {kg_result}")
                
                return FetchRawDataResponse(
                    success=True,
                    message=f"Successfully fetched and stored raw data for transaction {req.transaction_hash}",
                    raw_data=raw_data
                )
            except Exception as kg_error:
                ctx.logger.error(f"Failed to store raw data in KG: {kg_error}")
                return FetchRawDataResponse(
                    success=False,
                    message=f"Fetched raw data but failed to store: {str(kg_error)}",
                    raw_data=raw_data
                )
        else:
            ctx.logger.warning(f"No raw data found for transaction: {req.transaction_hash}")
            return FetchRawDataResponse(
                success=False,
                message=f"No raw data found for transaction {req.transaction_hash}",
                raw_data=None
            )
        
    except Exception as e:
        ctx.logger.error(f"Failed to fetch raw data: {str(e)}")
        return FetchRawDataResponse(
            success=False,
            message=f"Failed to fetch raw data: {str(e)}",
            raw_data=None
        )


@agent.on_rest_get("/rest/kg/last-entry", KGLastEntryResponse)
async def handle_kg_last_entry(ctx: Context) -> KGLastEntryResponse:
    """Get ALL conversations and transactions from the most recent test run with complete transaction analysis data"""
    ctx.logger.info("[LAST-ENTRY] Retrieving ALL conversations and transactions from most recent test run")
    
    try:
        # Get all conversations and transactions
        ctx.logger.info("[LAST-ENTRY] Fetching all conversations...")
        conversations = conversation_kg.get_all_conversations()
        ctx.logger.info(f"[LAST-ENTRY] Found {len(conversations)} conversations")
        
        # Debug: Log personality names
        for i, conv in enumerate(conversations):
            personality = conv.get('personality_name', 'Unknown')
            conv_id = conv.get('conversation_id', 'Unknown')
            ctx.logger.info(f"[LAST-ENTRY] Conversation {i+1}: ID={conv_id}, Personality={personality}")
        
        ctx.logger.info("[LAST-ENTRY] Fetching all transactions...")
        transactions = conversation_kg.get_all_transactions()
        ctx.logger.info(f"[LAST-ENTRY] Found {len(transactions)} transactions")
        
        # Auto-fetch raw data for transactions that don't have it
        await auto_fetch_missing_raw_data(ctx, transactions)
        
        # Re-fetch transactions after auto-fetching raw data
        transactions = conversation_kg.get_all_transactions()
        ctx.logger.info(f"[LAST-ENTRY] After auto-fetch, found {len(transactions)} transactions")
        
        if not conversations and not transactions:
            return KGLastEntryResponse(
                success=False,
                entry_type="none",
                entry=None,
                timestamp=None,
                message="No entries found in Knowledge Graph"
            )
        
        # Group conversations by test_run_id and get the most recent test run
        test_runs = {}
        for conv in conversations:
            test_run_id = conv.get('test_run_id', 'unknown')
            if test_run_id not in test_runs:
                test_runs[test_run_id] = []
            test_runs[test_run_id].append(conv)
        
        # Find the most recent test run by timestamp
        most_recent_test_run_id = None
        most_recent_timestamp = ""
        
        for test_run_id, convs in test_runs.items():
            # Get the most recent timestamp in this test run
            latest_conv = max(convs, key=lambda x: x.get('timestamp', ''))
            latest_timestamp = latest_conv.get('timestamp', '')
            
            if latest_timestamp > most_recent_timestamp:
                most_recent_timestamp = latest_timestamp
                most_recent_test_run_id = test_run_id
        
        # Filter to only conversations from the most recent test run
        if most_recent_test_run_id:
            recent_conversations = test_runs[most_recent_test_run_id]
            print(f"\n[LAST-ENTRY] ========== FILTERING TO MOST RECENT TEST RUN ==========")
            print(f"[LAST-ENTRY] Most recent test run ID: {most_recent_test_run_id}")
            print(f"[LAST-ENTRY] Conversations in this test run: {len(recent_conversations)}")
        else:
            recent_conversations = conversations
            print(f"\n[LAST-ENTRY] ========== NO TEST RUN ID FOUND, USING ALL CONVERSATIONS ==========")
        
        # Process only the most recent test run conversations
        enhanced_conversations = []
        print(f"\n[LAST-ENTRY] ========== PROCESSING {len(recent_conversations)} CONVERSATIONS ==========")
        for i, conv in enumerate(recent_conversations):
            print(f"[LAST-ENTRY] Processing conversation {i+1}/{len(recent_conversations)}")
            print(f"[LAST-ENTRY]   - Personality: {conv.get('personality_name', 'Unknown')}")
            print(f"[LAST-ENTRY]   - Conversation ID: {conv.get('conversation_id', 'Unknown')}")
            print(f"[LAST-ENTRY]   - Test Run ID: {conv.get('test_run_id', 'Unknown')}")
            enhanced_conv = enhance_conversation_with_transactions(conv, transactions)
            enhanced_conversations.append(enhanced_conv)
            print(f"[LAST-ENTRY]   - Enhanced and added to list")
        
        # Create a comprehensive response with ALL conversations and transactions
        unique_personalities = list(set(conv.get('personality_name', '') for conv in enhanced_conversations if conv.get('personality_name')))
        print(f"\n[LAST-ENTRY] ========== FINAL RESULTS ==========")
        print(f"[LAST-ENTRY] Total enhanced conversations: {len(enhanced_conversations)}")
        print(f"[LAST-ENTRY] Total transactions: {len(transactions)}")
        print(f"[LAST-ENTRY] Unique personalities: {unique_personalities}")
        print(f"[LAST-ENTRY] Most recent timestamp: {most_recent_timestamp}")
        
        comprehensive_entry = {
            "conversations": enhanced_conversations,
            "transactions": transactions,
            "total_conversations": len(enhanced_conversations),
            "total_transactions": len(transactions),
            "personalities": unique_personalities,
            "test_run_timestamp": most_recent_timestamp
        }
        
        print(f"[LAST-ENTRY] ========== RETURNING RESPONSE ==========\n")
        
        return KGLastEntryResponse(
            success=True,
            entry_type="comprehensive_test_run",
            entry=comprehensive_entry,
            timestamp=most_recent_timestamp,
            message=f"Retrieved comprehensive test run data with {len(enhanced_conversations)} conversations from {len(set(conv.get('personality_name', '') for conv in enhanced_conversations if conv.get('personality_name')))} personalities and {len(transactions)} transactions"
        )
    
    except Exception as e:
        ctx.logger.error(f"Failed to get comprehensive test run data: {str(e)}")
        return KGLastEntryResponse(
            success=False,
            entry_type="error",
            entry=None,
            timestamp=None,
            message=f"Error retrieving comprehensive test run data: {str(e)}"
        )


def enhance_conversation_with_transactions(conversation: Dict[str, Any], all_transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Enhance a conversation with complete transaction analysis data"""
    enhanced_conv = conversation.copy()
    
    # Get existing transactions from conversation
    existing_transactions = conversation.get('transactions', [])
    print(f"[ENHANCE] Enhancing conversation with {len(existing_transactions)} existing transactions")
    print(f"[ENHANCE] Available all_transactions: {len(all_transactions)}")
    
    # If transactions are already complete (have analysis), enhance them with raw data from KG
    if existing_transactions and any(tx.get('analysis') for tx in existing_transactions):
        # Transactions already have complete data, but check for raw data in KG
        enhanced_transactions = []
        for tx in existing_transactions:
            tx_hash = tx.get('transaction_hash', '')
            
            # Try to find raw data in the Knowledge Graph
            raw_data = None
            if tx_hash:
                # Query the Knowledge Graph for raw data
                try:
                    tx_id = tx_hash.lower().replace("0x", "tx_")
                    query_str = f'!(match &self (transaction_raw_data {tx_id} $raw_data) $raw_data)'
                    raw_data_results = conversation_kg.metta.run(query_str)
                    if raw_data_results and raw_data_results[0]:
                        raw_data_json = raw_data_results[0][0].get_object().value
                        raw_data = json.loads(raw_data_json)
                        print(f"[ENHANCE] Found raw data for tx {tx_hash} in KG")
                except Exception as e:
                    print(f"[ENHANCE] Error fetching raw data for {tx_hash}: {e}")
            
            enhanced_tx = {
                "transaction_hash": tx.get('transaction_hash', ''),
                "chain_id": tx.get('chain_id', '84532'),
                "analysis": tx.get('analysis', ''),
                "timestamp": tx.get('timestamp', ''),
                "raw_data": raw_data or tx.get('raw_data'),  # Use KG data if available, fallback to existing
                "success": tx.get('success', True)
            }
            enhanced_transactions.append(enhanced_tx)
        enhanced_conv['transactions'] = enhanced_transactions
        return enhanced_conv
    
    # Otherwise, try to enhance with data from all_transactions
    enhanced_transactions = []
    for tx in existing_transactions:
        tx_hash = tx.get('transaction_hash', '')
        if tx_hash:
            # Find the complete transaction data from all_transactions
            complete_tx_data = None
            for full_tx in all_transactions:
                if full_tx.get('transaction_hash', '').lower() == tx_hash.lower():
                    complete_tx_data = full_tx
                    break
            
            if complete_tx_data:
                # Create enhanced transaction entry with all data
                enhanced_tx = {
                    "transaction_hash": complete_tx_data.get('transaction_hash', tx_hash),
                    "chain_id": complete_tx_data.get('chain_id', '84532'),  # Default to Base Sepolia
                    "analysis": complete_tx_data.get('analysis', ''),
                    "timestamp": complete_tx_data.get('timestamp', ''),
                    "raw_data": complete_tx_data.get('raw_data'),
                    "success": complete_tx_data.get('success', True)
                }
                enhanced_transactions.append(enhanced_tx)
            else:
                # Keep original transaction data if no complete data found
                enhanced_tx = {
                    "transaction_hash": tx_hash,
                    "chain_id": tx.get('chain_id', '84532'),
                    "analysis": tx.get('analysis', 'No analysis available'),
                    "timestamp": tx.get('timestamp', ''),
                    "raw_data": tx.get('raw_data'),
                    "success": tx.get('success', False)
                }
                enhanced_transactions.append(enhanced_tx)
    
    # Update the conversation with enhanced transactions
    enhanced_conv['transactions'] = enhanced_transactions
    
    return enhanced_conv


@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"CDP Agent Tester Backend started with address: {ctx.agent.address}")
    ctx.logger.info("🧪 Ready to generate personalities for BASE SEPOLIA TESTING!")
    ctx.logger.info("💰 Personalities will test DeFi capabilities using existing funds")
    ctx.logger.info("📊 Powered by ASI:One AI reasoning")
    ctx.logger.info("🤝 A2A Communication with BlockscoutAgent enabled")
    ctx.logger.info(f"🌐 BlockScoutAgent URL: {BLOCKSCOUT_AGENT_URL}")
    ctx.logger.info(f"📊 Metrics Generator URL: {METRICS_GENERATOR_URL}")
    ctx.logger.info("🗄️ Knowledge Graph enabled for conversation storage")
    if AGENTVERSE_API_KEY:
        ctx.logger.info(f"✅ Registered on Agentverse with mailbox: {AGENTVERSE_API_KEY[:8]}...")
    ctx.logger.info("🌐 REST API endpoints available:")
    ctx.logger.info("  - POST /rest/generate-personalities")
    ctx.logger.info("  - POST /rest/generate-personality-message")
    ctx.logger.info("  - POST /rest/evaluate-conversation")
    ctx.logger.info("  - POST /rest/store-conversation")
    ctx.logger.info("  - POST /rest/kg/query-conversation")
    ctx.logger.info("  - POST /rest/kg/query-by-personality")
    ctx.logger.info("  - GET  /rest/kg/all-conversations")
    ctx.logger.info("  - GET  /rest/kg/all-transactions")
    ctx.logger.info("  - GET  /rest/kg/last-entry")
    ctx.logger.info("  - POST /rest/fetch-raw-data")
    ctx.logger.info("🔄 Auto-fetch: /rest/kg/last-entry automatically fetches missing raw data")
    ctx.logger.info("🎯 Focus: Testing DeFi capabilities on Base Sepolia with existing funds!")


if __name__ == "__main__":
    print("🚀 Starting CDP Agent Tester Backend...")
    print("🧪 BASE SEPOLIA TESTING MODE ENABLED")
    print("💰 Personalities will test DeFi capabilities using existing funds!")
    print("📊 Powered by ASI:One AI")
    print("🤖 uAgents Framework: ENABLED")
    print("🤝 A2A Communication with BlockscoutAgent: ENABLED")
    print(f"🌐 BlockScoutAgent URL: {BLOCKSCOUT_AGENT_URL}")
    print(f"📊 Metrics Generator URL: {METRICS_GENERATOR_URL}")
    print("🗄️ Knowledge Graph (MeTTa): ENABLED")
    
    if AGENTVERSE_API_KEY:
        print(f"✅ Agentverse Integration: ENABLED")
        print(f"🆔 Agent will be registered on startup")
    else:
        print("⚠️ Agentverse Integration: DISABLED (No API key)")
    
    print("\n📚 Knowledge Graph Features:")
    print("  - Stores all conversations with personality metadata")
    print("  - Stores BlockScout transaction analyses linked to conversations")
    print("  - Query by conversation ID, personality, or get all data")
    print("  - Maintains relationships between conversations and transactions")
    print("  - Generates comprehensive performance metrics via Metrics Generator")
    
    print("\n🌐 Starting uAgent with REST endpoints...")
    print("🎯 Focus: Testing DeFi capabilities on Base Sepolia with existing funds!")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")