'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Code, Play, CheckCircle, Copy, ExternalLink, Terminal, FileText, Settings } from 'lucide-react';
import { Sora } from 'next/font/google';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { AuroraText } from '@/components/ui/aurora-text';
import { BackgroundBeams } from '@/components/ui/background-beams';

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function HowToUse() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'example' | 'custom'>('example');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const ExampleContent = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className={`${sora.className} text-3xl font-bold text-white mb-4 transform -skew-x-12`}>
          Run Our Example
        </h2>
        <p className="text-gray-400 text-lg">
          Get started quickly with our pre-built CDP AgentKit example
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Sign up and get your access token</h3>
              <p className="text-gray-400 mb-1">
                Create your account and copy your access token from the dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Navigate to the AgentKit example</h3>
              <p className="text-gray-400 mb-4">
                Clone and install dependencies for our example agent
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">Terminal</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('cd agentkit/typescript/examples/langchain-cdp-chatbot && pnpm install')}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-green-400 text-sm font-mono">
                  cd agentkit/typescript/examples/langchain-cdp-chatbot && pnpm install
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Configure environment variables</h3>
              <p className="text-gray-400 mb-4">
                Set up your API keys and access token in the .env file
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">.env file</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`# Required API Keys
OPENAI_API_KEY=your_openai_api_key
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_cdp_wallet_secret

# FireGlobe Access Token (from step 1)
ACCESS_TOKEN=your_access_token_from_fireglobe

# Optional: Network configuration
NETWORK_ID=base-sepolia
RPC_URL=your_rpc_url_here`)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="text-gray-300 text-sm font-mono">
{`# Required API Keys
OPENAI_API_KEY=your_openai_api_key
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_cdp_wallet_secret

# FireGlobe Access Token (from step 1)
ACCESS_TOKEN=your_access_token_from_fireglobe

# Optional: Network configuration
NETWORK_ID=base-sepolia
RPC_URL=your_rpc_url_here`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              4
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Run the agent script</h3>
              <p className="text-gray-400 mb-4">
                Start the testing process and select test mode
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">Terminal</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('npx ts-node chatbot-with-testing.ts')}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-green-400 text-sm font-mono">
                  npx ts-node chatbot-with-testing.ts
                </code>
              </div>
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-200">
                  <span className="font-semibold">When prompted:</span> Choose option <span className="text-orange-400 font-bold">3</span> or <span className="text-orange-400 font-bold">test</span> for automated testing mode.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              5
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">View your results</h3>
              <p className="text-gray-400 mb-4">
                After the test run completes, view detailed analytics and metrics
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300">
                <CheckCircle className="w-4 h-4" />
                View results in your dashboard
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomContent = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className={`${sora.className} text-3xl font-bold text-white mb-4 transform -skew-x-12`}>
          Test Your Own Agent
        </h2>
        <p className="text-gray-400 text-lg">
          Integrate fireGlobe testing into your own CDP AgentKit agent
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Sign up and get your access token</h3>
              <p className="text-gray-400 mb-1">
                Create your account and copy your access token from the dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Install the fireGlobe SDK</h3>
              <p className="text-gray-400 mb-4">
                Add the fireGlobe SDK to your project
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">Terminal</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('npm install fireglobe-sdk-client')}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-green-400 text-sm font-mono">
                  npm install fireglobe-sdk-client
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Import required components</h3>
              <p className="text-gray-400 mb-4">
                Import the necessary classes from the SDK
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">TypeScript</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('import { AgentTester, LangChainAdapter } from "fireglobe-sdk-client";')}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-blue-400 text-sm font-mono">
                  import {`{`} AgentTester, LangChainAdapter {`}`} from "fireglobe-sdk-client";
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              4
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Wrap your agent with the adapter</h3>
              <p className="text-gray-400 mb-4">
                Use the LangChainAdapter to make your agent compatible
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">TypeScript</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`const adapter = new LangChainAdapter({
  agent,
  config,
  metadata: {
    name: "CDP AgentKit Test Agent",
    description: "A DeFi agent built with CDP AgentKit that can perform various onchain operations",
    version: "1.0.0",
  },
});`)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="text-gray-300 text-sm font-mono">
{`const adapter = new LangChainAdapter({
  agent,
  config,
  metadata: {
    name: "CDP AgentKit Test Agent",
    description: "A DeFi agent built with CDP AgentKit that can perform various onchain operations",
    version: "1.0.0",
  },
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              5
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Configure and run the tester</h3>
              <p className="text-gray-400 mb-4">
                Set up the AgentTester and run your tests
              </p>
              <div className="bg-black/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 font-medium">TypeScript</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`const tester = new AgentTester({
  agentDescription: "Your agent description here",
  agentCapabilities: "List your agent's capabilities here",
  accessToken: process.env.ACCESS_TOKEN!, // REQUIRED: User access token for test result storage
  numPersonalities: 2, // Generate number of targeted test personalities
  maxMessagesPerConversation: 1,
  saveConversations: true,
  conversationOutputPath: "./test-results",
  realTimeLogging: true
});

// Add event listeners for real-time updates
tester.on((event) => {
  console.log(event);
});

// Run tests
const results = await tester.runTests(adapter);
console.log(\`Overall Score: \${results.overallScore}/100\`);`)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="text-gray-300 text-sm font-mono">
{`const tester = new AgentTester({
  agentDescription: "Your agent description here",
  agentCapabilities: "List your agent's capabilities here",
  accessToken: process.env.ACCESS_TOKEN!, // REQUIRED: User access token for test result storage
  numPersonalities: 2, // Generate number of targeted test personalities
  maxMessagesPerConversation: 1,
  saveConversations: true,
  conversationOutputPath: "./test-results",
  realTimeLogging: true
});

// Add event listeners for real-time updates
tester.on((event) => {
  console.log(event);
});

// Run tests
const results = await tester.runTests(adapter);
console.log(\`Overall Score: \${results.overallScore}/100\`);`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div className="bg-black/50 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/25">
              6
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">View results in the dashboard</h3>
              <p className="text-gray-400 mb-4">
                Access detailed analytics and performance metrics
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300">
                <CheckCircle className="w-4 h-4" />
                View results in your dashboard
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black py-8 px-4 flex relative">
      {/* Background Beams */}
      <BackgroundBeams />

      <div className="max-w-7xl mx-auto relative z-10 flex-1">
        {/* Header Section */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-8 mb-8 border border-orange-500/50">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className={`${sora.className} text-3xl font-bold tracking-tight flex items-center transform -skew-x-12`}>
              <span className="text-white">How To Use</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('example')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'example'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
              }`}
            >
              <Play className="w-5 h-5" />
              Run Our Example
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'custom'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
              }`}
            >
              <Code className="w-5 h-5" />
              Test Your Own Agent
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl p-8 border border-white/10">
          {activeTab === 'example' ? <ExampleContent /> : <CustomContent />}
        </div>
      </div>
    </div>
  );
}
