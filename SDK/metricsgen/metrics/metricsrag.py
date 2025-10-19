# metricsrag.py
"""
RAG (Retrieval-Augmented Generation) for CDP Agent Testing Metrics

This module handles communication with the backend Knowledge Graph
to retrieve conversation data and generate comprehensive metrics.
"""

import requests
import json
from typing import List, Dict, Optional, Any


class MetricsRAG:
    """RAG interface for retrieving agent testing data from Knowledge Graph."""
    
    def __init__(self, metta_instance, backend_url: str):
        self.metta = metta_instance
        self.backend_url = backend_url
        print(f"📡 MetricsRAG initialized with backend: {backend_url}")
    
    def get_last_conversation(self) -> Optional[Dict[str, Any]]:
        """Get the last inserted conversation from the Knowledge Graph."""
        try:
            url = f"{self.backend_url}/rest/kg/last-entry"
            print(f"🌐 Fetching last conversation from: {url}")
            
            response = requests.get(url, timeout=30)
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📊 Response data keys: {list(data.keys())}")
                
                if data.get('success') and data.get('entry_type') == 'conversation':
                    entry = data.get('entry', {})
                    print(f"✅ Retrieved conversation: {entry.get('conversation_id')}")
                    print(f"📊 Personality: {entry.get('personality_name')}")
                    print(f"📊 Messages: {len(entry.get('messages', []))}")
                    print(f"📊 Transactions: {len(entry.get('transactions', []))}")
                    return entry
                else:
                    print(f"❌ No conversation found or wrong entry type: {data.get('entry_type')}")
            else:
                print(f"❌ Error response: {response.text}")
            
            return None
            
        except Exception as e:
            print(f"❌ Error fetching last conversation: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return None
    
    def get_conversation_by_id(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific conversation by ID from the Knowledge Graph."""
        try:
            url = f"{self.backend_url}/rest/kg/query-conversation"
            payload = {"conversation_id": conversation_id}
            print(f"🌐 Fetching conversation from: {url}")
            print(f"📤 Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=30)
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📊 Response data keys: {list(data.keys())}")
                
                if data.get('success'):
                    conversation = data.get('conversation', {})
                    print(f"✅ Retrieved conversation: {conversation.get('conversation_id')}")
                    return conversation
                else:
                    print(f"❌ Conversation not found: {data.get('message')}")
            else:
                print(f"❌ Error response: {response.text}")
            
            return None
            
        except Exception as e:
            print(f"❌ Error fetching conversation by ID: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return None
    
    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """Get all conversations from the Knowledge Graph."""
        try:
            url = f"{self.backend_url}/rest/kg/all-conversations"
            print(f"🌐 Fetching all conversations from: {url}")
            
            response = requests.get(url, timeout=30)
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📊 Response data keys: {list(data.keys())}")
                
                if data.get('success'):
                    conversations = data.get('conversations', [])
                    print(f"✅ Retrieved {len(conversations)} conversations")
                    return conversations
                else:
                    print(f"❌ Failed to retrieve conversations: {data.get('message')}")
            else:
                print(f"❌ Error response: {response.text}")
            
            return []
            
        except Exception as e:
            print(f"❌ Error fetching all conversations: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []
    
    def get_all_transactions(self) -> List[Dict[str, Any]]:
        """Get all transaction analyses from the Knowledge Graph."""
        try:
            url = f"{self.backend_url}/rest/kg/all-transactions"
            print(f"🌐 Fetching all transactions from: {url}")
            
            response = requests.get(url, timeout=30)
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"📊 Response data keys: {list(data.keys())}")
                
                if data.get('success'):
                    transactions = data.get('transactions', [])
                    print(f"✅ Retrieved {len(transactions)} transactions")
                    return transactions
                else:
                    print(f"❌ Failed to retrieve transactions: {data.get('message')}")
            else:
                print(f"❌ Error response: {response.text}")
            
            return []
            
        except Exception as e:
            print(f"❌ Error fetching all transactions: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []
    
    def store_metrics(self, conversation_id: str, metrics: Dict[str, Any]):
        """Store generated metrics in local MeTTa knowledge graph."""
        from hyperon import E, S, ValueAtom
        
        try:
            conv_id = conversation_id.replace("-", "_")
            metrics_json = json.dumps(metrics)
            
            # Store metrics linked to conversation
            self.metta.space().add_atom(E(S("conversation_metrics"), S(conv_id), ValueAtom(metrics_json)))
            
            print(f"✅ Stored metrics in local KG for conversation: {conversation_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error storing metrics: {e}")
            return False
    
    def get_stored_metrics(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored metrics from local MeTTa knowledge graph."""
        try:
            conv_id = conversation_id.replace("-", "_")
            query_str = f'!(match &self (conversation_metrics {conv_id} $metrics) $metrics)'
            
            results = self.metta.run(query_str)
            
            if results and results[0]:
                metrics_json = results[0][0].get_object().value
                metrics = json.loads(metrics_json)
                print(f"✅ Retrieved stored metrics for conversation: {conversation_id}")
                return metrics
            else:
                print(f"❌ No stored metrics found for conversation: {conversation_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving stored metrics: {e}")
            return None

