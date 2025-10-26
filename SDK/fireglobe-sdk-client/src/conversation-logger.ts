/**
 * Logger for storing conversations and test results
 */

import * as fs from "fs/promises";
import * as path from "path";
import { ConversationMessage, TestResults } from "./types";

export class ConversationLogger {
  private outputPath: string;

  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  /**
   * Initialize output directory
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputPath, { recursive: true });
    } catch (error) {
      console.error("Failed to create output directory:", error);
    }
  }

  /**
   * Log a message in real-time
   */
  async logMessage(
    conversationId: string,
    message: ConversationMessage
  ): Promise<void> {
    await this.ensureDirectory();

    const logFile = path.join(
      this.outputPath,
      `conversation_${conversationId}.jsonl`
    );

    const logEntry = {
      ...message,
      timestamp: message.timestamp.toISOString(),
    };

    try {
      await fs.appendFile(logFile, JSON.stringify(logEntry) + "\n");
    } catch (error) {
      console.error("Failed to log message:", error);
    }
  }

  /**
   * Save complete test results
   */
  async saveTestResults(results: TestResults): Promise<void> {
    await this.ensureDirectory();

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const resultsFile = path.join(
      this.outputPath,
      `test_results_${timestamp}.json`
    );

    try {
      await fs.writeFile(
        resultsFile,
        JSON.stringify(results, null, 2),
        "utf-8"
      );
      console.log(`\n✅ Test results saved to: ${resultsFile}`);
    } catch (error) {
      console.error("Failed to save test results:", error);
    }
  }

  /**
   * Save conversations as readable HTML
   */
  async saveConversationsAsHTML(results: TestResults): Promise<void> {
    await this.ensureDirectory();

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const htmlFile = path.join(
      this.outputPath,
      `test_report_${timestamp}.html`
    );

    const html = this.generateHTML(results);

    try {
      await fs.writeFile(htmlFile, html, "utf-8");
      console.log(`✅ HTML report saved to: ${htmlFile}`);
    } catch (error) {
      console.error("Failed to save HTML report:", error);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTML(results: TestResults): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Test Results - ${results.testId}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            color: ${results.overallScore >= 70 ? "#10b981" : results.overallScore >= 50 ? "#f59e0b" : "#ef4444"};
        }
        .conversation {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
        }
        .user-message {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
        }
        .agent-message {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
        }
        .evaluation {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        .criteria {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        .criterion {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 5px;
        }
        .summary {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 14px;
            margin: 5px;
        }
        .strength {
            background: #d1fae5;
            color: #065f46;
        }
        .weakness {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>FireGlobe Agent Test Results</h1>
        <div class="score">${results.overallScore}/100</div>
        <p><strong>Agent:</strong> ${results.agentDescription}</p>
        <p><strong>Test ID:</strong> ${results.testId}</p>
        <p><strong>Duration:</strong> ${Math.round((results.endTime.getTime() - results.startTime.getTime()) / 1000)}s</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Conversations:</strong> ${results.summary.totalConversations}</p>
        <p><strong>Successful:</strong> ${results.summary.successfulConversations}</p>
        <p><strong>Failed:</strong> ${results.summary.failedConversations}</p>
        
        <h3>Top Strengths</h3>
        ${results.summary.topStrengths.map(s => `<span class="badge strength">${s}</span>`).join("")}
        
        <h3>Top Weaknesses</h3>
        ${results.summary.topWeaknesses.map(w => `<span class="badge weakness">${w}</span>`).join("")}
    </div>

    ${results.conversations.map((conv, idx) => {
      const evaluation = results.evaluations.find(e => e.conversationId === conv.id);
      return `
        <div class="conversation">
            <h2>${idx + 1}. ${conv.personalityName}</h2>
            <p><em>${results.personalities.find(p => p.name === conv.personalityName)?.personality}</em></p>
            
            ${conv.messages.map(msg => `
                <div class="message ${msg.role}-message">
                    <strong>${msg.role === "user" ? conv.personalityName : "Agent"}:</strong>
                    <p>${msg.content}</p>
                    <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
            `).join("")}
            
            ${evaluation ? `
                <div class="evaluation">
                    <h3>Evaluation: ${evaluation.score}/100</h3>
                    <div class="criteria">
                        <div class="criterion">
                            <strong>Helpfulness</strong><br>${evaluation.criteria.helpfulness}
                        </div>
                        <div class="criterion">
                            <strong>Accuracy</strong><br>${evaluation.criteria.accuracy}
                        </div>
                        <div class="criterion">
                            <strong>Relevance</strong><br>${evaluation.criteria.relevance}
                        </div>
                        <div class="criterion">
                            <strong>Clarity</strong><br>${evaluation.criteria.clarity}
                        </div>
                        <div class="criterion">
                            <strong>Technical Depth</strong><br>${evaluation.criteria.technicalDepth}
                        </div>
                    </div>
                    <p><strong>Feedback:</strong> ${evaluation.overallFeedback}</p>
                </div>
            ` : ""}
        </div>
      `;
    }).join("")}
</body>
</html>
    `;
  }
}

