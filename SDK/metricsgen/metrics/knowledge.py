# knowledge.py
"""
Knowledge Graph initialization for CDP Agent Testing Metrics

This module sets up the MeTTa knowledge graph structure for storing
and querying agent testing conversations, transactions, and evaluations.
"""

from hyperon import MeTTa, E, S, ValueAtom


def initialize_knowledge_graph(metta: MeTTa):
    """Initialize the MeTTa knowledge graph with CDP Agent testing data structure."""
    
    # Conversation relationships
    metta.space().add_atom(E(S("test_has"), S("test"), S("conversation")))
    metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("personality")))
    metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("messages")))
    metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("transactions")))
    metta.space().add_atom(E(S("conversation_has"), S("conversation"), S("evaluation")))
    
    # Transaction relationships
    metta.space().add_atom(E(S("transaction_has"), S("transaction"), S("hash")))
    metta.space().add_atom(E(S("transaction_has"), S("transaction"), S("chain_id")))
    metta.space().add_atom(E(S("transaction_has"), S("transaction"), S("analysis")))
    metta.space().add_atom(E(S("transaction_has"), S("transaction"), S("success_status")))
    
    # Metrics relationships
    metta.space().add_atom(E(S("metrics_has"), S("metrics"), S("capability_score")))
    metta.space().add_atom(E(S("metrics_has"), S("metrics"), S("efficiency_score")))
    metta.space().add_atom(E(S("metrics_has"), S("metrics"), S("reliability_score")))
    metta.space().add_atom(E(S("metrics_has"), S("metrics"), S("interaction_score")))
    metta.space().add_atom(E(S("metrics_has"), S("metrics"), S("final_performance_index")))
    
    # Agent capability types
    metta.space().add_atom(E(S("capability_type"), S("transfer"), S("native_transfer")))
    metta.space().add_atom(E(S("capability_type"), S("swap"), S("defi_operation")))
    metta.space().add_atom(E(S("capability_type"), S("balance_check"), S("state_verification")))
    metta.space().add_atom(E(S("capability_type"), S("contract_interaction"), S("advanced_operation")))
    
    print("✅ CDP Agent Testing Knowledge Graph initialized")

