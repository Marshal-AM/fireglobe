# utils.py
"""
Utility functions for CDP Agent Metrics Generation

This module provides LLM integration and helper functions for
analyzing agent testing data and generating comprehensive metrics.
"""

import json
from openai import OpenAI
from typing import Dict, List, Any


class LLM:
    """LLM client for ASI:One API integration."""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.asi1.ai/v1"
        )
    
    def create_completion(self, prompt: str, temperature: float = 0.3) -> str:
        """Create a completion using ASI:One API."""
        completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="asi1-mini",
            temperature=temperature
        )
        return completion.choices[0].message.content


def extract_transaction_hashes(messages: List[Dict[str, Any]]) -> List[str]:
    """Extract all transaction hashes mentioned in conversation messages."""
    import re
    tx_hashes = []
    tx_pattern = r'0x[a-fA-F0-9]{64}'
    
    for msg in messages:
        content = msg.get('content', '')
        matches = re.findall(tx_pattern, content)
        tx_hashes.extend(matches)
    
    return list(set(tx_hashes))  # Remove duplicates


def count_tool_calls(messages: List[Dict[str, Any]]) -> int:
    """Count the number of tool calls made by the agent."""
    tool_call_count = 0
    
    for msg in messages:
        if msg.get('role') == 'agent':
            content = msg.get('content', '').lower()
            # Look for indicators of tool usage
            if any(indicator in content for indicator in [
                'transaction hash',
                'balance:',
                'transferred',
                'swapped',
                'deployed',
                'approved',
                'wrapped',
                'minted'
            ]):
                tool_call_count += 1
    
    return tool_call_count


def analyze_action_types(messages: List[Dict[str, Any]], transactions: List[Dict[str, Any]]) -> List[str]:
    """Identify the types of actions performed by the agent."""
    action_types = set()
    
    # Analyze message content for action indicators
    for msg in messages:
        if msg.get('role') == 'agent':
            content = msg.get('content', '').lower()
            
            if 'transfer' in content or 'sent' in content:
                action_types.add('transfer')
            if 'swap' in content or 'exchange' in content:
                action_types.add('swap')
            if 'balance' in content:
                action_types.add('balance_check')
            if 'wrap' in content or 'weth' in content:
                action_types.add('wrap')
            if 'deploy' in content:
                action_types.add('deploy')
            if 'approve' in content or 'approval' in content:
                action_types.add('approval')
            if 'mint' in content:
                action_types.add('mint')
            if 'faucet' in content:
                action_types.add('faucet')
    
    return list(action_types)


def extract_gas_data(transactions: List[Dict[str, Any]]) -> List[int]:
    """Extract gas usage data from transaction analyses and raw data."""
    gas_values = []
    
    for tx in transactions:
        # First try to get gas from raw data (preferred)
        raw_data = tx.get('raw_data')
        if raw_data and isinstance(raw_data, dict):
            # Extract gas from raw transaction data
            gas_used = raw_data.get('gas_used')
            if gas_used:
                try:
                    gas_value = int(gas_used)
                    if 1000 < gas_value < 10000000:  # Reasonable gas range
                        gas_values.append(gas_value)
                        continue  # Skip text analysis if we got gas from raw data
                except (ValueError, TypeError):
                    pass
            
            # Also try alternative gas fields
            for gas_field in ['gas', 'gasLimit', 'gas_limit']:
                gas_value = raw_data.get(gas_field)
                if gas_value:
                    try:
                        gas_value = int(gas_value)
                        if 1000 < gas_value < 10000000:
                            gas_values.append(gas_value)
                            break
                    except (ValueError, TypeError):
                        continue
        
        # Fallback to text analysis if no raw data available
        analysis = tx.get('analysis', '')
        if analysis:
            import re
            gas_patterns = [
                r'(\d+(?:,\d+)*)\s*(?:gas|units)',
                r'gas\s*used:?\s*(\d+(?:,\d+)*)',
                r'(\d+(?:,\d+)*)\s*gwei'
            ]
            
            for pattern in gas_patterns:
                matches = re.findall(pattern, analysis.lower())
                for match in matches:
                    try:
                        gas_value = int(match.replace(',', ''))
                        if 1000 < gas_value < 10000000:  # Reasonable gas range
                            gas_values.append(gas_value)
                    except ValueError:
                        continue
    
    return gas_values


def calculate_success_rate(messages: List[Dict[str, Any]], transactions: List[Dict[str, Any]]) -> float:
    """Calculate the success rate of agent actions."""
    total_actions = len(transactions) if transactions else count_tool_calls(messages)
    
    if total_actions == 0:
        return 0.0
    
    successful_actions = 0
    
    for tx in transactions:
        # Check raw data first for transaction status
        raw_data = tx.get('raw_data')
        if raw_data and isinstance(raw_data, dict):
            # Check transaction status from raw data
            status = raw_data.get('status', '').lower()
            if status in ['ok', 'success', '1']:
                successful_actions += 1
            elif status in ['failed', 'error', '0']:
                continue  # Failed transaction
            else:
                # If no clear status, check success field
                if tx.get('success', True):
                    successful_actions += 1
        else:
            # Fallback to success field if no raw data
            if tx.get('success', True):
                successful_actions += 1
    
    # If no transactions, analyze message content for failures
    if len(transactions) == 0:
        failed_count = sum(1 for msg in messages if msg.get('role') == 'agent' and any(
            fail_word in msg.get('content', '').lower() 
            for fail_word in ['error', 'failed', 'unable', 'cannot', 'insufficient']
        ))
        successful_actions = total_actions - failed_count
    
    return (successful_actions / total_actions) * 100 if total_actions > 0 else 0.0


def analyze_response_times(messages: List[Dict[str, Any]]) -> List[float]:
    """Analyze response times between user messages and agent responses."""
    from datetime import datetime
    response_times = []
    
    for i in range(len(messages) - 1):
        if messages[i].get('role') == 'user' and messages[i + 1].get('role') == 'agent':
            try:
                user_time = datetime.fromisoformat(messages[i].get('timestamp', '').replace('Z', '+00:00'))
                agent_time = datetime.fromisoformat(messages[i + 1].get('timestamp', '').replace('Z', '+00:00'))
                diff = (agent_time - user_time).total_seconds() * 1000  # Convert to ms
                if 0 < diff < 60000:  # Reasonable range (0-60 seconds)
                    response_times.append(diff)
            except (ValueError, AttributeError):
                continue
    
    return response_times


def clean_json_response(response: str) -> str:
    """Clean LLM response to extract valid JSON."""
    cleaned = response.strip()
    
    # Remove markdown formatting
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    
    return cleaned.strip()