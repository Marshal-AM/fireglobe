"""
Fixed BlockScout MCP Client - Using httpx-sse for proper SSE handling

Install required packages:
pip install httpx-sse uagents python-dotenv

This uses a dedicated SSE library for proper Server-Sent Events handling.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from httpx_sse import aconnect_sse
from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
ASI_ONE_API_KEY = os.getenv("ASI_ONE_API_KEY")
BLOCKSCOUT_MCP_URL = os.getenv("BLOCKSCOUT_MCP_URL", "https://mcp.blockscout.com/mcp")
AGENT_NAME = os.getenv("AGENT_NAME", "BlockscoutAgent")
AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY")

if not ASI_ONE_API_KEY:
    raise ValueError("ASI_ONE_API_KEY environment variable is required")


class TransactionRequest(Model):
    """Request model for transaction analysis."""
    tx_hash: str
    chain_id: Optional[str] = "8453"  # Default to Base mainnet - now a string!
    include_logs: bool = True
    include_traces: bool = False


class TransactionResponse(Model):
    """Response model for transaction analysis."""
    success: bool
    tx_hash: str
    data: Optional[Dict[str, Any]] = None
    analysis: Optional[str] = None
    error: Optional[str] = None


class SimpleQueryRequest(Model):
    """Simple natural language query request."""
    query: str


class HealthResponse(Model):
    """Health check response model."""
    status: str
    agent_name: str
    agent_address: str
    timestamp: float


class InfoResponse(Model):
    """Agent info response model."""
    agent_name: str
    agent_address: str
    capabilities: List[str]
    supported_networks: List[str]
    endpoints: Dict[str, str]


class AnalysisRetrievalResponse(Model):
    """Response model for transaction analysis retrieval."""
    success: bool
    transaction_hash: str
    conversation_id: Optional[str] = None
    analysis: Optional[str] = None
    timestamp: Optional[str] = None
    message: Optional[str] = None


# A2A Communication Models
class TransactionContextRequest(Model):
    """Request to analyze transaction with conversation context."""
    conversation_id: str
    personality_name: str
    conversation_messages: List[Dict[str, Any]]
    transaction_hash: str
    chain_id: str
    transaction_timestamp: str


class TransactionAnalysisResponse(Model):
    """Response with transaction analysis."""
    success: bool
    conversation_id: str
    transaction_hash: str
    analysis: str
    raw_data: Optional[Dict[str, Any]] = None
    timestamp: str


class ASIOneClient:
    """Client for interacting with ASI:ONE API."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.asi1.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def analyze_transaction(self, tx_data: Dict[str, Any]) -> str:
        """Use ASI:ONE to analyze transaction data."""
        
        analysis_prompt = f"""
        Analyze the following blockchain transaction data and provide comprehensive insights:
        
        Transaction Data:
        {json.dumps(tx_data, indent=2)}
        
        Please provide:
        1. Transaction summary and type
        2. Gas analysis and efficiency
        3. Contract interactions (if any)
        4. Token transfers (if any)
        5. Potential issues or anomalies
        6. Risk assessment
        7. Recommendations
        
        Be thorough but concise in your analysis.
        """
        
        payload = {
            "model": "asi1-mini",
            "messages": [{"role": "user", "content": analysis_prompt}],
            "temperature": 0.3
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                    
        except Exception as e:
            logger.error(f"Error calling ASI:ONE API: {e}")
            return f"Analysis failed: {str(e)}"


class BlockScoutMCPClient:
    """
    Client for interacting with BlockScout MCP server using httpx-sse.
    
    Uses the httpx-sse library for proper SSE handling.
    """
    
    def __init__(self, mcp_url: str):
        self.mcp_url = mcp_url
        self.request_id = 1
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call an MCP tool - handles both SSE and JSON responses.
        
        The BlockScout MCP server requires Accept header to include BOTH:
        - application/json
        - text/event-stream
        """
        
        payload = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": self.request_id
        }
        
        self.request_id += 1
        
        logger.info(f"MCP: Calling MCP tool: {tool_name}")
        logger.info(f"MCP: MCP URL: {self.mcp_url}")
        logger.info(f"MCP: Request payload: {json.dumps(payload, indent=2)}")
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # CRITICAL: Must accept BOTH content types
                logger.info(f"MCP: Sending POST request to {self.mcp_url}")
                response = await client.post(
                    self.mcp_url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json, text/event-stream"  # Accept BOTH!
                    }
                )
                
                logger.info(f"MCP: Response status: {response.status_code}")
                logger.info(f"MCP: Response Content-Type: {response.headers.get('content-type')}")
                logger.info(f"MCP: Response headers: {dict(response.headers)}")
                logger.info(f"MCP: Response text length: {len(response.text)}")
                logger.info(f"MCP: Full response text: {response.text}")
                
                # Log specific error details for 404s
                if response.status_code == 404:
                    logger.error(f"MCP: 404 ERROR - Full response: {response.text}")
                    logger.error(f"MCP: 404 ERROR - Headers: {dict(response.headers)}")
                elif response.status_code >= 400:
                    logger.error(f"MCP: HTTP ERROR {response.status_code} - Full response: {response.text}")
                    logger.error(f"MCP: HTTP ERROR {response.status_code} - Headers: {dict(response.headers)}")
                
                # Check if we got an error response
                if response.status_code >= 400:
                    error_body = response.text
                    logger.error(f"MCP: Error response ({response.status_code}): {error_body}")
                    raise Exception(f"MCP server returned {response.status_code}: {error_body}")
                
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "")
                
                # Handle SSE response
                if "text/event-stream" in content_type:
                    logger.info("MCP: Handling SSE stream response")
                    result_data = None
                    error_data = None
                    
                    # Parse the SSE response manually
                    logger.info(f"MCP: Parsing SSE response lines...")
                    lines = response.text.split("\n")
                    logger.info(f"MCP: Total SSE lines: {len(lines)}")
                    
                    for i, line in enumerate(lines):
                        logger.info(f"MCP: Line {i}: {line}")
                        if line.startswith("data: "):
                            data_str = line[6:]
                            logger.info(f"MCP: SSE data: {data_str}")
                            
                            if data_str == "[DONE]":
                                logger.info("MCP: Received [DONE] signal")
                                break
                            
                            try:
                                data = json.loads(data_str)
                                logger.info(f"MCP: Parsed SSE JSON: {data}")
                                
                                if "result" in data:
                                    result_data = data["result"]
                                    logger.info("MCP: Received result from MCP server")
                                    logger.info(f"MCP: Result data: {result_data}")
                                
                                if "error" in data:
                                    error_data = data["error"]
                                    logger.error(f"MCP: MCP error: {error_data}")
                                    
                            except json.JSONDecodeError as e:
                                logger.warning(f"MCP: Failed to parse SSE data: {data_str}, error: {e}")
                                continue
                    
                    # Process the result
                    logger.info(f"MCP: Final result_data: {result_data}")
                    logger.info(f"MCP: Final error_data: {error_data}")
                    
                    if error_data:
                        error_message = error_data.get("message", str(error_data))
                        logger.error(f"MCP: Raising error: {error_message}")
                        raise Exception(f"MCP Error: {error_message}")
                    
                    if result_data is None:
                        logger.error("MCP: No result received from MCP server")
                        raise Exception("No result received from MCP server")
                    
                    logger.info(f"MCP: Extracting tool result from: {result_data}")
                    extracted_result = self._extract_tool_result(result_data)
                    logger.info(f"MCP: Extracted result: {extracted_result}")
                    return extracted_result
                
                # Handle regular JSON response
                elif "application/json" in content_type:
                    logger.info("MCP: Handling JSON response")
                    data = response.json()
                    logger.info(f"MCP: JSON response data: {data}")
                    
                    if "error" in data:
                        error_message = data["error"].get("message", str(data["error"]))
                        logger.error(f"MCP: JSON error: {error_message}")
                        raise Exception(f"MCP Error: {error_message}")
                    
                    if "result" in data:
                        logger.info(f"MCP: JSON result: {data['result']}")
                        extracted_result = self._extract_tool_result(data["result"])
                        logger.info(f"MCP: Extracted JSON result: {extracted_result}")
                        return extracted_result
                    
                    logger.error(f"MCP: Unexpected JSON response format: {data}")
                    raise Exception(f"Unexpected JSON response format: {data}")
                
                else:
                    logger.error(f"MCP: Unexpected content type: {content_type}")
                    raise Exception(f"Unexpected content type: {content_type}")
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP status error: {e}")
            logger.error(f"Response: {e.response.text}")
            raise Exception(f"Failed to call MCP tool: {e}")
        except Exception as e:
            logger.error(f"Error calling BlockScout MCP: {e}", exc_info=True)
            raise
    
    def _extract_tool_result(self, tool_result: Any) -> Dict[str, Any]:
        """Extract and parse the tool result from MCP response."""
        
        logger.info(f"MCP: Extracting tool result from: {tool_result}")
        logger.info(f"MCP: Tool result type: {type(tool_result)}")
        
        # MCP returns results in a specific format with 'content' field
        if isinstance(tool_result, dict) and "content" in tool_result:
            content = tool_result["content"]
            logger.info(f"MCP: Found content field: {content}")
            logger.info(f"MCP: Content type: {type(content)}")
            
            # Content is usually an array of content items
            if isinstance(content, list) and len(content) > 0:
                first_content = content[0]
                logger.info(f"MCP: First content item: {first_content}")
                logger.info(f"MCP: First content type: {type(first_content)}")
                
                # Text content has the data in 'text' field
                if isinstance(first_content, dict) and "text" in first_content:
                    text_data = first_content["text"]
                    logger.info(f"MCP: Found text data: {text_data}")
                    logger.info(f"MCP: Text data type: {type(text_data)}")
                    
                    # Try to parse as JSON
                    try:
                        parsed = json.loads(text_data)
                        logger.info("MCP: Successfully parsed tool result as JSON")
                        logger.info(f"MCP: Parsed result: {parsed}")
                        return parsed
                    except json.JSONDecodeError as e:
                        logger.warning(f"MCP: Failed to parse as JSON: {e}")
                        logger.info("MCP: Returning as raw text")
                        return {"raw_text": text_data}
                else:
                    logger.warning(f"MCP: First content item is not a dict with 'text' field: {first_content}")
            else:
                logger.warning(f"MCP: Content is not a non-empty list: {content}")
        else:
            logger.warning(f"MCP: Tool result is not a dict with 'content' field: {tool_result}")
        
        # If we couldn't extract structured data, return the raw result
        logger.info(f"MCP: Returning raw result: {tool_result}")
        return tool_result if isinstance(tool_result, dict) else {"data": tool_result}
    
    async def get_transaction(self, tx_hash: str, chain_id: str = "8453") -> Dict[str, Any]:
        """
        Fetch transaction data using the MCP protocol with SSE.
        
        Args:
            tx_hash: Transaction hash
            chain_id: Chain ID as STRING (e.g., "8453" for Base mainnet)
        """
        
        logger.info(f"MCP: Starting get_transaction for tx: {tx_hash}")
        logger.info(f"MCP: Chain ID: {chain_id}")
        logger.info(f"MCP: Chain ID type: {type(chain_id)}")
        logger.info(f"MCP: Transaction hash length: {len(tx_hash)}")
        logger.info(f"MCP: Transaction hash starts with 0x: {tx_hash.startswith('0x')}")
        
        # FIXED: Use correct parameter names and ensure chain_id is a string
        arguments = {
            "chain_id": str(chain_id),  # Ensure it's a string
            "transaction_hash": tx_hash,  # Changed from 'hash' to 'transaction_hash'
            "include_raw_input": False
        }
        
        logger.info(f"MCP: Calling tool with arguments: {arguments}")
        logger.info(f"MCP: Tool name: get_transaction_info")
        logger.info(f"MCP: MCP URL: {self.mcp_url}")
        
        try:
            result = await self.call_tool(
                "get_transaction_info",
                arguments
            )
            logger.info(f"MCP: Successfully got transaction data for tx: {tx_hash}")
            logger.info(f"MCP: Result type: {type(result)}")
            logger.info(f"MCP: Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            return result
        except Exception as e:
            logger.error(f"MCP: Error getting transaction {tx_hash}: {e}")
            logger.error(f"MCP: Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"MCP: Traceback: {traceback.format_exc()}")
            raise
    
    async def get_chains_list(self) -> List[Dict[str, Any]]:
        """Get list of supported chains."""
        return await self.call_tool("get_chains_list", {})
    
    async def transaction_summary(self, tx_hash: str, chain_id: str = "8453") -> str:
        """Get human-readable transaction summary."""
        result = await self.call_tool(
            "transaction_summary",
            {
                "chain_id": str(chain_id),  # Ensure it's a string
                "transaction_hash": tx_hash  # Changed from 'hash' to 'transaction_hash'
            }
        )
        return result


class BlockscoutAgent:
    """Main agent class for transaction analysis."""
    
    def __init__(self, name: str = AGENT_NAME):
        self.name = name
        self.agent = Agent(
            name=name,
            port=8080,
            seed="blockscout agent seed phrase for transaction analysis",
            mailbox=f"{AGENTVERSE_API_KEY}" if AGENTVERSE_API_KEY else None,
            endpoint=["https://blockscoutagent-739298578243.us-central1.run.app/submit"]
        )
        self.asi_client = ASIOneClient(ASI_ONE_API_KEY)
        self.blockscout_client = BlockScoutMCPClient(BLOCKSCOUT_MCP_URL)
        
        # In-memory storage for transaction analyses
        self.transaction_analyses = {}
        
        # Register message handlers
        self._register_handlers()
        
        # Register A2A message handlers
        self._register_a2a_handlers()
        
        # Register REST endpoints
        self._register_rest_endpoints()
        
        # Fund agent if needed
        fund_agent_if_low(self.agent.wallet.address())
        
        # Register startup event handler
        self._register_startup_handler()
    
    def _register_handlers(self):
        """Register message handlers for the agent."""
        
        @self.agent.on_message(model=TransactionRequest)
        async def handle_transaction_request(ctx: Context, msg: TransactionRequest):
            """Handle transaction analysis requests."""
            logger.info(f"Received transaction analysis request for: {msg.tx_hash}")
            
            try:
                # Fetch transaction data from BlockScout using SSE
                tx_data = await self.blockscout_client.get_transaction(
                    msg.tx_hash, 
                    str(msg.chain_id)  # Ensure chain_id is a string
                )
                
                # Analyze transaction using ASI:ONE
                analysis = await self.asi_client.analyze_transaction(tx_data)
                
                # Send response
                response = TransactionResponse(
                    success=True,
                    tx_hash=msg.tx_hash,
                    data=tx_data,
                    analysis=analysis
                )
                
                await ctx.send(response)
                logger.info(f"Successfully analyzed transaction: {msg.tx_hash}")
                
            except Exception as e:
                logger.error(f"Error analyzing transaction {msg.tx_hash}: {e}")
                
                error_response = TransactionResponse(
                    success=False,
                    tx_hash=msg.tx_hash,
                    error=str(e)
                )
                
                await ctx.send(error_response)
        
    def _register_a2a_handlers(self):
        """Register A2A message handlers for conversation context analysis."""
        
        @self.agent.on_message(model=TransactionContextRequest)
        async def handle_transaction_context(ctx: Context, sender: str, msg: TransactionContextRequest):
            """Handle transaction context request from backend agent."""
            ctx.logger.info(f"A2A: Received transaction context from {sender}")
            ctx.logger.info(f"A2A: Conversation ID: {msg.conversation_id}")
            ctx.logger.info(f"A2A: Personality: {msg.personality_name}")
            ctx.logger.info(f"A2A: Transaction: {msg.transaction_hash}")
            ctx.logger.info(f"A2A: Chain ID: {msg.chain_id}")
            ctx.logger.info(f"A2A: Transaction timestamp: {msg.transaction_timestamp}")
            ctx.logger.info(f"A2A: Number of conversation messages: {len(msg.conversation_messages)}")
            
            # Log current state before processing
            ctx.logger.info(f"A2A: Current transaction_analyses keys before processing: {list(self.transaction_analyses.keys())}")
            ctx.logger.info(f"A2A: Total stored analyses before processing: {len(self.transaction_analyses)}")
            
            try:
                # Wait 10 seconds before analyzing (as requested)
                ctx.logger.info("A2A: Waiting 10 seconds before analysis...")
                await asyncio.sleep(10)
                
                # Fetch transaction data from BlockScout
                ctx.logger.info(f"A2A: Fetching transaction data from BlockScout for tx: {msg.transaction_hash}")
                tx_data = await self.blockscout_client.get_transaction(
                    msg.transaction_hash, 
                    msg.chain_id
                )
                ctx.logger.info(f"A2A: Successfully fetched transaction data. Keys: {list(tx_data.keys()) if isinstance(tx_data, dict) else 'Not a dict'}")
                
                # Create conversation-aware analysis
                ctx.logger.info(f"A2A: Creating conversation-aware analysis...")
                analysis = await self._create_conversation_aware_analysis(
                    msg.conversation_messages,
                    msg.personality_name,
                    msg.transaction_hash,
                    tx_data
                )
                ctx.logger.info(f"A2A: Analysis created. Length: {len(analysis)}")
                ctx.logger.info(f"A2A: Analysis preview: {analysis[:200]}...")
                
                # Store analysis in memory
                analysis_data = {
                    "conversation_id": msg.conversation_id,
                    "analysis": analysis,
                    "timestamp": datetime.utcnow().isoformat(),
                    "success": True
                }
                self.transaction_analyses[msg.transaction_hash] = analysis_data
                ctx.logger.info(f"A2A: Stored analysis in memory for tx: {msg.transaction_hash}")
                ctx.logger.info(f"A2A: Analysis data stored: {analysis_data}")
                ctx.logger.info(f"A2A: Current transaction_analyses keys after storing: {list(self.transaction_analyses.keys())}")
                ctx.logger.info(f"A2A: Total stored analyses after storing: {len(self.transaction_analyses)}")
                
                # Send analysis back to backend agent
                response = TransactionAnalysisResponse(
                    success=True,
                    conversation_id=msg.conversation_id,
                    transaction_hash=msg.transaction_hash,
                    analysis=analysis,
                    raw_data=tx_data,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                ctx.logger.info(f"A2A: Sending response back to {sender}")
                await ctx.send(sender, response)
                ctx.logger.info(f"A2A: Successfully sent transaction analysis back to {sender}")
                
            except Exception as e:
                ctx.logger.error(f"A2A: Error analyzing transaction context: {e}")
                ctx.logger.error(f"A2A: Exception type: {type(e).__name__}")
                ctx.logger.error(f"A2A: Exception details: {str(e)}")
                import traceback
                ctx.logger.error(f"A2A: Traceback: {traceback.format_exc()}")
                
                # Store error in memory
                error_analysis_data = {
                    "conversation_id": msg.conversation_id,
                    "analysis": f"Analysis failed: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "success": False
                }
                self.transaction_analyses[msg.transaction_hash] = error_analysis_data
                ctx.logger.info(f"A2A: Stored error analysis in memory for tx: {msg.transaction_hash}")
                ctx.logger.info(f"A2A: Error analysis data stored: {error_analysis_data}")
                
                error_response = TransactionAnalysisResponse(
                    success=False,
                    conversation_id=msg.conversation_id,
                    transaction_hash=msg.transaction_hash,
                    analysis=f"Analysis failed: {str(e)}",
                    raw_data=None,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                ctx.logger.info(f"A2A: Sending error response back to {sender}")
                await ctx.send(sender, error_response)
                ctx.logger.info(f"A2A: Successfully sent error response back to {sender}")
    
    def _register_rest_endpoints(self):
        """Register REST endpoints for the agent."""
        
        @self.agent.on_rest_post("/rest/analyze-transaction", TransactionRequest, TransactionResponse)
        async def handle_analyze_transaction_rest(ctx: Context, req: TransactionRequest) -> TransactionResponse:
            """REST endpoint to analyze a transaction."""
            ctx.logger.info(f"REST: Received transaction analysis request for: {req.tx_hash}")
            
            try:
                # Fetch transaction data from BlockScout
                tx_data = await self.blockscout_client.get_transaction(
                    req.tx_hash, 
                    str(req.chain_id)  # Ensure chain_id is a string
                )
                
                # Analyze transaction using ASI:ONE
                analysis = await self.asi_client.analyze_transaction(tx_data)
                
                # Return response
                return TransactionResponse(
                    success=True,
                    tx_hash=req.tx_hash,
                    data=tx_data,
                    analysis=analysis
                )
                
            except Exception as e:
                ctx.logger.error(f"REST: Error analyzing transaction {req.tx_hash}: {e}")
                
                return TransactionResponse(
                    success=False,
                    tx_hash=req.tx_hash,
                    error=str(e)
                )
        
        @self.agent.on_rest_post("/rest/query", SimpleQueryRequest, TransactionResponse)
        async def handle_simple_query(ctx: Context, req: SimpleQueryRequest) -> TransactionResponse:
            """REST endpoint for natural language queries about transactions."""
            ctx.logger.info(f"REST: Received natural language query: {req.query}")
            
            try:
                # Extract transaction info using ASI:ONE
                extraction_result = await self._extract_transaction_info(req.query)
                
                if not extraction_result or not extraction_result.get("tx_hash"):
                    return TransactionResponse(
                        success=False,
                        tx_hash="",
                        error="No transaction hash found in your query. Please provide a valid transaction hash."
                    )
                
                tx_hash = extraction_result["tx_hash"]
                chain_id = str(extraction_result.get("chain_id", "8453"))  # Ensure it's a string
                
                # Fetch transaction data from BlockScout
                tx_data = await self.blockscout_client.get_transaction(tx_hash, chain_id)
                
                # Create comprehensive analysis
                comprehensive_analysis = await self._create_comprehensive_analysis(req.query, tx_data)
                
                # Return response
                return TransactionResponse(
            success=True,
            tx_hash=tx_hash,
                    data=tx_data,
                    analysis=comprehensive_analysis
                )
                
            except Exception as e:
                ctx.logger.error(f"REST: Error processing query '{req.query}': {e}")
                
                return TransactionResponse(
                    success=False,
                    tx_hash="",
                    error=f"Error processing your query: {str(e)}"
                )
        
        @self.agent.on_rest_get("/rest/health", HealthResponse)
        async def handle_health_check(ctx: Context) -> HealthResponse:
            """Health check endpoint."""
            return HealthResponse(
                status="healthy",
                agent_name=self.name,
                agent_address=str(self.agent.address),
                timestamp=asyncio.get_event_loop().time()
            )
        
        @self.agent.on_rest_get("/rest/info", InfoResponse)
        async def handle_agent_info(ctx: Context) -> InfoResponse:
            """Agent information endpoint."""
            return InfoResponse(
                agent_name=self.name,
                agent_address=str(self.agent.address),
                capabilities=[
                    "Transaction analysis using BlockScout MCP",
                    "AI-powered insights using ASI:ONE",
                    "Multi-chain transaction support via SSE streaming",
                    "Gas usage analysis",
                    "Contract interaction analysis",
                    "Token transfer detection",
                    "Risk assessment",
                    "Natural language query processing"
                ],
                supported_networks=[
                    "ethereum (1)",
                    "base (8453)",
                    "base-sepolia (84532)",
                    "optimism (10)",
                    "arbitrum (42161)",
                    "polygon (137)"
                ],
                endpoints={
                    "analyze_transaction": "POST /rest/analyze-transaction",
                    "query": "POST /rest/query",
                    "test_blockscout": "POST /rest/test-blockscout",
                    "get_analysis": "POST /rest/get-analysis",
                    "health": "GET /rest/health",
                    "info": "GET /rest/info"
                }
            )
        
        @self.agent.on_rest_post("/rest/test-blockscout", TransactionRequest, TransactionResponse)
        async def handle_test_blockscout(ctx: Context, req: TransactionRequest) -> TransactionResponse:
            """Test endpoint to directly call BlockScout MCP with detailed logging."""
            ctx.logger.info(f"TEST: Testing BlockScout MCP call for tx: {req.tx_hash}")
            ctx.logger.info(f"TEST: Chain ID: {req.chain_id}")
            
            try:
                # Direct call to BlockScout MCP
                tx_data = await self.blockscout_client.get_transaction(
                    req.tx_hash, 
                    str(req.chain_id)
                )
                
                ctx.logger.info(f"TEST: Successfully got transaction data")
                ctx.logger.info(f"TEST: Transaction data keys: {list(tx_data.keys()) if isinstance(tx_data, dict) else 'Not a dict'}")
                ctx.logger.info(f"TEST: Transaction data: {tx_data}")
                
                return TransactionResponse(
                    success=True,
                    tx_hash=req.tx_hash,
                    data=tx_data,
                    analysis="Test successful - transaction data retrieved"
                )
                
            except Exception as e:
                ctx.logger.error(f"TEST: Error calling BlockScout MCP: {e}")
                ctx.logger.error(f"TEST: Exception type: {type(e).__name__}")
                import traceback
                ctx.logger.error(f"TEST: Traceback: {traceback.format_exc()}")
                
                return TransactionResponse(
                    success=False,
                    tx_hash=req.tx_hash,
                    error=f"Test failed: {str(e)}"
                )
        
        @self.agent.on_rest_post("/rest/get-analysis", TransactionRequest, AnalysisRetrievalResponse)
        async def handle_get_analysis(ctx: Context, req: TransactionRequest) -> AnalysisRetrievalResponse:
            """POST endpoint to retrieve stored transaction analysis."""
            tx_hash = req.tx_hash
            chain_id = req.chain_id
            ctx.logger.info(f"POST: Received request for analysis of tx: {tx_hash}")
            ctx.logger.info(f"POST: Chain ID: {chain_id}")
            ctx.logger.info(f"POST: Include logs: {req.include_logs}")
            ctx.logger.info(f"POST: Include traces: {req.include_traces}")
            
            # Log current state of transaction_analyses
            ctx.logger.info(f"POST: Current transaction_analyses keys: {list(self.transaction_analyses.keys())}")
            ctx.logger.info(f"POST: Total stored analyses: {len(self.transaction_analyses)}")
            
            if tx_hash in self.transaction_analyses:
                analysis_data = self.transaction_analyses[tx_hash]
                ctx.logger.info(f"Found analysis for transaction: {tx_hash}")
                ctx.logger.info(f"Analysis data keys: {list(analysis_data.keys())}")
                ctx.logger.info(f"Analysis success: {analysis_data.get('success', 'unknown')}")
                ctx.logger.info(f"Analysis timestamp: {analysis_data.get('timestamp', 'unknown')}")
                ctx.logger.info(f"Analysis length: {len(analysis_data.get('analysis', ''))}")
                
                return AnalysisRetrievalResponse(
                    success=True,
                    transaction_hash=tx_hash,
                    conversation_id=analysis_data["conversation_id"],
                    analysis=analysis_data["analysis"],
                    timestamp=analysis_data["timestamp"]
                )
            else:
                ctx.logger.warning(f"No analysis found for transaction: {tx_hash}")
                ctx.logger.warning(f"Available transaction hashes: {list(self.transaction_analyses.keys())}")
                
                # Check if there's a similar hash (for debugging)
                similar_hashes = [h for h in self.transaction_analyses.keys() if h.startswith(tx_hash[:10])]
                if similar_hashes:
                    ctx.logger.warning(f"Found similar hashes: {similar_hashes}")
                
                return AnalysisRetrievalResponse(
                    success=False,
                    transaction_hash=tx_hash,
                    message="No analysis found for this transaction hash"
                )
    
    async def _extract_transaction_info(self, query: str) -> Optional[Dict[str, Any]]:
        """Extract transaction hash and chain ID from natural language."""
        
        prompt = f"""
        Extract transaction information from this query: "{query}"
        
        Return ONLY a JSON object with:
        - tx_hash: The transaction hash (must start with 0x)
        - chain: The blockchain name (ethereum, base, optimism, arbitrum, polygon)
        - chain_id: The chain ID as a STRING (important: return as string, not number)
        
        Chain IDs (as strings): ethereum="1", base="8453", base-sepolia="84532", optimism="10", arbitrum="42161", polygon="137"
        
        If no chain is specified, default to base ("8453").
        
        Example: {{"tx_hash": "0x...", "chain": "base", "chain_id": "8453"}}
        
        Query: {query}
        """
        
        try:
            payload = {
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.asi_client.base_url}/chat/completions",
                    headers=self.asi_client.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse JSON response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    extracted = json.loads(json_match.group())
                    # Ensure chain_id is a string
                    if "chain_id" in extracted:
                        extracted["chain_id"] = str(extracted["chain_id"])
                    return extracted
                else:
                    return None
                    
        except Exception as e:
            logger.error(f"Error extracting transaction info: {e}")
            return None
    
    async def _create_comprehensive_analysis(self, query: str, tx_data: Dict[str, Any]) -> str:
        """Create comprehensive analysis based on user query and transaction data."""
        try:
            analysis_prompt = f"""
            User Query: "{query}"
            
            Transaction Data:
            {json.dumps(tx_data, indent=2)}
            
            Based on the user's query and transaction data, provide a comprehensive analysis.
            
            Include:
            1. Direct answer to their question
            2. Transaction summary
            3. Gas analysis
            4. Contract interactions (if any)
            5. Token transfers (if any)
            6. Any relevant insights
            
            Be thorough and directly address their specific question.
            """
            
            payload = {
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": analysis_prompt}],
                "temperature": 0.3
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.asi_client.base_url}/chat/completions",
                    headers=self.asi_client.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except Exception as e:
            logger.error(f"Error creating comprehensive analysis: {e}")
            return f"Analysis failed: {str(e)}"
    
    async def _create_conversation_aware_analysis(self, conversation_messages: List[Dict[str, Any]], 
                                                personality_name: str, tx_hash: str, tx_data: Dict[str, Any]) -> str:
        """Create analysis that considers the conversation context and personality."""
        try:
            # Format conversation for analysis
            conversation_text = "\n".join([
                f"{msg.get('role', 'unknown').upper()}: {msg.get('content', '')}"
                for msg in conversation_messages
            ])
            
            analysis_prompt = f"""
            You are analyzing a blockchain transaction in the context of a conversation between a DeFi agent and a user with a specific personality.
            
            PERSONALITY CONTEXT:
            User Personality: {personality_name}
            
            CONVERSATION CONTEXT:
            {conversation_text}
            
            TRANSACTION DATA:
            {json.dumps(tx_data, indent=2)}
            
            TASK: Provide a comprehensive analysis that:
            1. Directly addresses what the user was trying to accomplish based on the conversation
            2. Explains how this transaction fits into their overall goal
            3. Analyzes the transaction from the perspective of their personality type
            4. Provides insights about gas usage, contract interactions, and potential issues
            5. Gives recommendations based on their personality and goals
            
            FORMAT YOUR RESPONSE AS:
            - A natural conversation flow that would fit into the existing chat
            - Address the user directly based on their personality
            - Explain what happened in the transaction in context of their goals
            - Provide actionable insights and next steps
            
            Be conversational, helpful, and tailored to their specific personality and situation.
            """
            
            payload = {
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": analysis_prompt}],
                "temperature": 0.4
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.asi_client.base_url}/chat/completions",
                    headers=self.asi_client.headers,
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except Exception as e:
            logger.error(f"Error creating conversation-aware analysis: {e}")
            return f"Analysis failed: {str(e)}"
    
    def _register_startup_handler(self):
        """Register startup event handler."""
        
        @self.agent.on_event("startup")
        async def startup_handler(ctx: Context):
            ctx.logger.info(f"BlockscoutAgent started with address: {ctx.agent.address}")
            ctx.logger.info("🔍 Ready to analyze blockchain transactions!")
            ctx.logger.info("📊 Powered by ASI:One AI and BlockScout MCP")
            ctx.logger.info("✅ Using httpx-sse library for SSE streaming")
            ctx.logger.info("🔧 FIXED: chain_id now sent as string, using 'transaction_hash' parameter")
            ctx.logger.info(f"🔧 MCP URL: {BLOCKSCOUT_MCP_URL}")
            ctx.logger.info(f"🔧 ASI:One API Key: {'SET' if ASI_ONE_API_KEY else 'NOT SET'}")
            ctx.logger.info(f"🔧 A2A Endpoint: https://blockscoutagent-739298578243.us-central1.run.app/submit")
            if AGENTVERSE_API_KEY:
                ctx.logger.info(f"✅ Registered on Agentverse")
            ctx.logger.info("🌐 REST API endpoints available:")
            ctx.logger.info("  - POST /rest/analyze-transaction")
            ctx.logger.info("  - POST /rest/query")
            ctx.logger.info("  - POST /rest/test-blockscout")
            ctx.logger.info("  - POST /rest/get-analysis")
            ctx.logger.info("  - GET /rest/health")
            ctx.logger.info("  - GET /rest/info")
            ctx.logger.info("🤝 A2A Communication enabled:")
            ctx.logger.info("  - Receives TransactionContextRequest from backend")
            ctx.logger.info("  - Sends TransactionAnalysisResponse back")
            ctx.logger.info("  - 10-second delay before analysis")
            ctx.logger.info(f"📊 Current transaction_analyses count: {len(self.transaction_analyses)}")
            ctx.logger.info(f"📊 Current transaction_analyses keys: {list(self.transaction_analyses.keys())}")
    
    def run(self):
        """Start the agent."""
        logger.info(f"Starting {self.name} agent...")
        self.agent.run()


def main():
    """Main entry point."""
    print("🚀 Starting BlockscoutAgent with httpx-sse...")
    print("🔍 Blockchain Transaction Analysis Agent")
    print("📊 Powered by ASI:One AI and BlockScout MCP")
    print("✅ Using httpx-sse library for proper SSE handling")
    print("🔧 FIXED: Parameter names and types corrected")
    print()
    print("📦 Make sure you have installed: pip install httpx-sse uagents python-dotenv")
    
    try:
        agent = BlockscoutAgent()
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        logger.info("Agent stopped by user")
    except Exception as e:
        logger.error(f"Agent failed to start: {e}")
        raise


if __name__ == "__main__":
    main()