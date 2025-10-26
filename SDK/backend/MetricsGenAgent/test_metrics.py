"""
Test script for CDP Agent Metrics Generator

This script demonstrates how to call the metrics generation endpoint
and display the results.
"""

import requests
import json
import sys


def test_generate_metrics(conversation_id=None):
    """Test the metrics generation endpoint."""
    
    print("🧪 Testing Metrics Generation Endpoint")
    print("=" * 80)
    
    url = "http://localhost:8081/metrics/generate"
    payload = {}
    
    if conversation_id:
        payload["conversation_id"] = conversation_id
        print(f"📊 Generating metrics for conversation: {conversation_id}")
    else:
        print("📊 Generating metrics for last conversation")
    
    try:
        print(f"\n🌐 Calling: {url}")
        print(f"📤 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print("✅ Metrics generated successfully!")
                print(f"📊 Conversation ID: {data.get('conversation_id')}")
                print(f"⏰ Timestamp: {data.get('timestamp')}")
                
                # Display key metrics
                metrics = data.get('metrics', {})
                if 'metrics' in metrics:
                    agg = metrics['metrics'].get('aggregate_scores', {})
                    print(f"\n🎯 Final Performance Index: {agg.get('final_performance_index')}/100")
                    print(f"💪 Capability Score: {agg.get('capability_score')}/100")
                    print(f"⚡ Efficiency Score: {agg.get('efficiency_score')}/100")
                    print(f"🛡️  Reliability Score: {agg.get('reliability_score')}/100")
                    print(f"💬 Interaction Score: {agg.get('interaction_score')}/100")
                    print(f"🏦 DeFi Score: {agg.get('defi_reasoning_score')}/100")
                
                print(f"\n✅ Full metrics are displayed in the agent's terminal")
                return True
            else:
                print(f"❌ Failed to generate metrics")
                return False
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to metrics generator")
        print("   Make sure the agent is running on port 8081")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_last_metrics():
    """Test the get last metrics endpoint."""
    
    print("\n🧪 Testing Get Last Metrics Endpoint")
    print("=" * 80)
    
    url = "http://localhost:8081/metrics/last"
    
    try:
        print(f"\n🌐 Calling: {url}")
        
        response = requests.get(url, timeout=30)
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print("✅ Retrieved last metrics successfully!")
                print(f"📊 Conversation ID: {data.get('conversation_id')}")
                
                metrics = data.get('metrics', {})
                if 'metrics' in metrics and 'aggregate_scores' in metrics['metrics']:
                    agg = metrics['metrics']['aggregate_scores']
                    print(f"\n🎯 Final Performance Index: {agg.get('final_performance_index')}/100")
                
                return True
            else:
                print("ℹ️  No metrics have been generated yet")
                return False
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to metrics generator")
        print("   Make sure the agent is running on port 8081")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("🚀 CDP Agent Metrics Generator Test Suite")
    print("=" * 80)
    print()
    
    # Check if conversation ID was provided
    conversation_id = None
    if len(sys.argv) > 1:
        conversation_id = sys.argv[1]
    
    # Test generate metrics
    success = test_generate_metrics(conversation_id)
    
    if success:
        # Test get last metrics
        test_get_last_metrics()
    
    print("\n" + "=" * 80)
    print("🏁 Test suite complete")

