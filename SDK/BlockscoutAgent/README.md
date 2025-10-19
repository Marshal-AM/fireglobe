# BlockscoutAgent

A uagents-based agent for analyzing blockchain transactions using the BlockScout MCP server and ASI:ONE AI models.

## Overview

The BlockscoutAgent is designed to analyze transaction information when provided with a transaction hash. It integrates with:

- **BlockScout MCP Server**: For fetching blockchain transaction data
- **ASI:ONE AI Models**: For intelligent analysis and insights
- **uagents Framework**: For agent orchestration and communication

## Features

- 🔍 **Transaction Analysis**: Deep analysis of blockchain transactions
- 🤖 **AI-Powered Insights**: Uses ASI:ONE models for intelligent interpretation
- 🔗 **Multi-Chain Support**: Works with various blockchain networks via BlockScout
- 📊 **Rich Data**: Provides comprehensive transaction details including gas usage, logs, and more
- 🛡️ **Error Handling**: Robust error handling and validation

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or using pip with pyproject.toml
pip install -e .
```

## Configuration

Set the following environment variables:

```bash
export ASI_ONE_API_KEY="your_asi_one_api_key"
export BLOCKSCOUT_MCP_URL="https://mcp.blockscout.com/mcp"
export AGENT_NAME="BlockscoutAgent"
```

## Usage

### Basic Usage

```python
from blockscout_agent import BlockscoutAgent

# Initialize the agent
agent = BlockscoutAgent()

# Start the agent
agent.run()
```

### Analyzing a Transaction

```python
# Send a transaction hash for analysis
tx_hash = "0x1234567890abcdef..."
result = await agent.analyze_transaction(tx_hash)
print(result)
```

## API Reference

### BlockscoutAgent

The main agent class that handles transaction analysis.

#### Methods

- `analyze_transaction(tx_hash: str)`: Analyze a transaction by its hash
- `run()`: Start the agent
- `stop()`: Stop the agent

## Examples

See the `examples/` directory for more detailed usage examples.

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black .
isort .

# Type checking
mypy .
```

## License

MIT License
