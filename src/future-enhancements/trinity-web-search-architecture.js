/**
 * Trinity Advanced Web Search Architecture (FUTURE ENHANCEMENT)
 * 
 * Status: PLANNED - Implementation when Claude Code web search is available
 * Purpose: Comprehensive web search through dual-agent orchestration
 * Architecture: Three-tier strategy with intelligent fallbacks
 * 
 * Current Reality: WebFetch is non-functional in Claude Code (verified May 2025)
 * Future Vision: Sophisticated web intelligence when capabilities are enhanced
 */

// Trinity Web Search API Implementation
// Dual-Agent Architecture: Overseer delegates web search to Worker
// Worker handles API calls while Overseer maintains user engagement

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';

// Trinity Dual-Agent Web Search Orchestrator
class TrinityWebSearchOrchestrator {
    constructor(apiKey, workingDirectory = './trinity-workspace') {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
        this.workingDir = workingDirectory;
        this.overseerName = process.env.TRINITY_OVERSEER_NAME || 'Overseer';
        this.workerName = process.env.TRINITY_WORKER_NAME || 'Worker';
        
        // File-based communication paths
        this.paths = {
            webSearchQueue: path.join(workingDirectory, 'web-search-queue.json'),
            webSearchResults: path.join(workingDirectory, 'web-search-results.json'),
            overseerContext: path.join(workingDirectory, 'overseer-context.json'),
            workerStatus: path.join(workingDirectory, 'worker-status.json')
        };
        
        this.webSearch = new TrinityWebSearch(apiKey);
        this.initializeWorkspace();
    }

    async initializeWorkspace() {
        // Ensure workspace directory exists
        await fs.mkdir(this.workingDir, { recursive: true });
        
        // Initialize communication files
        const initialFiles = {
            [this.paths.webSearchQueue]: [],
            [this.paths.webSearchResults]: {},
            [this.paths.overseerContext]: { activeSearches: [], pendingRequests: [] },
            [this.paths.workerStatus]: { status: 'idle', currentTask: null, lastUpdate: Date.now() }
        };

        for (const [filePath, initialContent] of Object.entries(initialFiles)) {
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, JSON.stringify(initialContent, null, 2));
            }
        }
    }

    // Overseer: Identify web search requests and delegate to Worker
    async overseerProcessRequest(userPrompt, conversationId = 'default') {
        console.log(`🎯 ${this.overseerName}: Processing user request...`);
        
        // Detect if web search is needed
        const webSearchIndicators = [
            /\b(latest|current|recent|new|2025|today)\b/i,
            /\b(research|find|search|look up|investigate)\b/i,
            /\b(best practices|industry standard|benchmark|trends)\b/i,
            /\b(documentation|specs|api|github|npm)\b/i,
            /\b(what\'s new|updates|changes|releases)\b/i
        ];

        const needsWebSearch = webSearchIndicators.some(pattern => pattern.test(userPrompt));

        if (needsWebSearch) {
            console.log(`🎯 ${this.overseerName}: Web search detected - researching current information`);
            return await this.delegateWebSearchToWorker(userPrompt, conversationId);
        } else {
            console.log(`🎯 ${this.overseerName}: Standard processing - no web search needed`);
            return await this.processStandardRequest(userPrompt);
        }
    }

    // Overseer: Delegate web search to Worker while keeping user engaged (Worker invisible)
    async delegateWebSearchToWorker(userPrompt, conversationId) {
        // Create search job for Worker (internal process)
        const searchJob = {
            id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prompt: userPrompt,
            conversationId,
            requestedAt: Date.now(),
            status: 'queued',
            priority: 'normal'
        };

        // Silently add to Worker's queue
        await this.addToWorkerQueue(searchJob);
        
        // Update internal Overseer context
        await this.updateOverseerContext(conversationId, searchJob.id);

        // Provide natural user engagement (no mention of Worker)
        const engagementResponse = this.generateUserEngagementResponse(userPrompt);
        console.log(`🎯 ${this.overseerName}: ${engagementResponse}`);

        // Silently monitor background process and return integrated results
        return await this.monitorBackgroundProcessAndReturnResults(searchJob.id, userPrompt);
    }

    // Worker: Process web search requests silently (completely invisible to user)
    async workerProcessQueue() {
        // Silent background processing - no user-visible output
        const queue = await this.readWorkerQueue();
        const pendingJobs = queue.filter(job => job.status === 'queued');

        if (pendingJobs.length === 0) {
            await this.updateWorkerStatus('idle', null);
            return null;
        }

        // Process highest priority job silently
        const job = pendingJobs[0];
        
        await this.updateWorkerStatus('processing', job.id);
        await this.updateJobStatus(job.id, 'processing');

        try {
            // Perform web search using API (background process)
            const searchResults = await this.webSearch.askClaudeWithWebSearch(job.prompt, {
                maxSearches: 3,
                allowedDomains: this.getTrustedDomains()
            });

            // Store results silently
            await this.storeWorkerResults(job.id, {
                success: true,
                results: searchResults,
                completedAt: Date.now(),
                searchesUsed: searchResults.searchesUsed,
                cost: searchResults.searchesUsed * 0.01
            });

            await this.updateJobStatus(job.id, 'completed');
            
            return searchResults;

        } catch (error) {
            // Silent error handling - Overseer will handle fallback
            await this.storeWorkerResults(job.id, {
                success: false,
                error: error.message,
                completedAt: Date.now()
            });

            await this.updateJobStatus(job.id, 'failed');
            throw error;
        } finally {
            await this.updateWorkerStatus('idle', null);
        }
    }

    // File-based communication methods
    async addToWorkerQueue(job) {
        const queue = await this.readWorkerQueue();
        queue.push(job);
        await fs.writeFile(this.paths.webSearchQueue, JSON.stringify(queue, null, 2));
    }

    async readWorkerQueue() {
        try {
            const data = await fs.readFile(this.paths.webSearchQueue, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async updateJobStatus(jobId, status) {
        const queue = await this.readWorkerQueue();
        const job = queue.find(j => j.id === jobId);
        if (job) {
            job.status = status;
            job.lastUpdate = Date.now();
            await fs.writeFile(this.paths.webSearchQueue, JSON.stringify(queue, null, 2));
        }
    }

    async storeWorkerResults(jobId, results) {
        const allResults = await this.readWorkerResults();
        allResults[jobId] = results;
        await fs.writeFile(this.paths.webSearchResults, JSON.stringify(allResults, null, 2));
    }

    async readWorkerResults() {
        try {
            const data = await fs.readFile(this.paths.webSearchResults, 'utf8');
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    async updateWorkerStatus(status, currentTask) {
        const statusData = {
            status,
            currentTask,
            lastUpdate: Date.now()
        };
        await fs.writeFile(this.paths.workerStatus, JSON.stringify(statusData, null, 2));
    }

    async updateOverseerContext(conversationId, searchJobId) {
        const context = await this.readOverseerContext();
        if (!context.activeSearches) context.activeSearches = [];
        context.activeSearches.push({ conversationId, searchJobId, startedAt: Date.now() });
        await fs.writeFile(this.paths.overseerContext, JSON.stringify(context, null, 2));
    }

    async readOverseerContext() {
        try {
            const data = await fs.readFile(this.paths.overseerContext, 'utf8');
            return JSON.parse(data);
        } catch {
            return { activeSearches: [], pendingRequests: [] };
        }
    }

    // Monitor background research and return results (Worker completely invisible)
    async monitorBackgroundProcessAndReturnResults(jobId, originalPrompt, maxWaitTime = 30000) {
        const startTime = Date.now();
        const checkInterval = 1000; // Check every second

        while (Date.now() - startTime < maxWaitTime) {
            const results = await this.readWorkerResults();
            
            if (results[jobId]) {
                const result = results[jobId];
                
                if (result.success) {
                    // Present results as if Overseer did the research
                    return this.formatIntegratedOverseerResponse(result.results, originalPrompt);
                } else {
                    // Silent fallback to standard processing
                    return await this.processStandardRequest(originalPrompt);
                }
            }

            // Provide natural progress updates (no mention of Worker)
            const elapsed = Date.now() - startTime;
            if (elapsed % 5000 === 0 && elapsed > 0) {
                console.log(`🎯 ${this.overseerName}: Still researching current information... 🔍`);
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        // Timeout - seamless fallback to standard processing
        console.log(`🎯 ${this.overseerName}: Proceeding with available knowledge...`);
        return await this.processStandardRequest(originalPrompt);
    }

    // Natural user engagement responses (no Worker mentioned)
    generateUserEngagementResponse(prompt) {
        const responses = [
            `Let me research the latest information on that...`,
            `I'll gather current data while we work on this...`,
            `Searching for the most recent information...`,
            `Looking up current best practices for you...`,
            `Researching the latest developments in this area...`,
            `Let me find the most up-to-date information...`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Format response as if Overseer did all the work (Worker invisible)
    formatIntegratedOverseerResponse(searchResults, originalPrompt) {
        // Present research as Overseer's own work
        let response = `Based on my research of current sources:\n\n${searchResults.content}`;
        
        // Optional: Show research was done, but not by whom
        if (searchResults.searchesUsed > 0) {
            response += `\n\n---\n*Research completed using ${searchResults.searchesUsed} current web sources*`;
        }
        
        return {
            content: response,
            citations: searchResults.citations || [],
            searchesUsed: searchResults.searchesUsed || 0,
            source: 'overseer_with_background_research'
        };
    }

    async processStandardRequest(prompt) {
        // Standard Claude processing without web search
        const claude = new Anthropic({ apiKey: this.apiKey });
        const message = await claude.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }]
        });

        return {
            content: message.content[0].text,
            citations: [],
            searchesUsed: 0,
            source: 'overseer_standard'
        };
    }

    getTrustedDomains() {
        return [
            "github.com", "stackoverflow.com", "developer.mozilla.org",
            "nodejs.org", "npmjs.com", "docs.microsoft.com",
            "anthropic.com", "openai.com", "arxiv.org"
        ];
    }
}

// Trinity Web Search Strategy Manager
class TrinityWebSearchStrategy {
    constructor(apiKey, workingDirectory = './trinity-workspace') {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
        this.workingDir = workingDirectory;
        this.overseerName = process.env.TRINITY_OVERSEER_NAME || 'Overseer';
        
        // Strategy priority order
        this.strategies = [
            { name: 'claude_code_native', handler: this.tryClaudeCodeNativeWebSearch.bind(this) },
            { name: 'dual_agent_api', handler: this.tryDualAgentAPISearch.bind(this) },
            { name: 'standard_fallback', handler: this.processStandardRequest.bind(this) }
        ];
        
        // Initialize dual-agent orchestrator as fallback
        this.dualAgentOrchestrator = new TrinityWebSearchOrchestrator(apiKey, workingDirectory);
    }

    // Primary Strategy: Try Claude Code native web search first
    async tryClaudeCodeNativeWebSearch(prompt, conversationId) {
        console.log(`🎯 ${this.overseerName}: Attempting native Claude Code web search...`);
        
        try {
            // Test if Claude Code supports web search natively
            const result = await this.executeClaudeCodeWithWebSearch(prompt);
            
            if (result.success && result.hasWebContent) {
                console.log(`🎯 ${this.overseerName}: Native web search successful!`);
                return {
                    content: result.content,
                    citations: result.citations || [],
                    searchesUsed: result.searchesUsed || 1,
                    source: 'claude_code_native',
                    strategy: 'primary'
                };
            } else {
                throw new Error('Native web search not available or no web content detected');
            }
            
        } catch (error) {
            console.log(`🎯 ${this.overseerName}: Native web search unavailable, trying fallback...`);
            throw error; // Allow strategy manager to try next approach
        }
    }

    // Execute Claude Code with potential web search capability
    async executeClaudeCodeWithWebSearch(prompt) {
        return new Promise((resolve, reject) => {
            // Try to execute claude code with the prompt
            const claudeProcess = spawn('claude', ['-p', prompt], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env }
            });

            let stdout = '';
            let stderr = '';
            const timeout = 15000; // 15 second timeout

            const timer = setTimeout(() => {
                claudeProcess.kill();
                reject(new Error('Claude Code timeout'));
            }, timeout);

            claudeProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            claudeProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            claudeProcess.on('close', (code) => {
                clearTimeout(timer);
                
                if (code === 0 && stdout.trim()) {
                    // Analyze response for web content indicators
                    const hasWebContent = this.detectWebContentInResponse(stdout);
                    const citations = this.extractCitationsFromResponse(stdout);
                    
                    resolve({
                        success: true,
                        content: stdout.trim(),
                        hasWebContent,
                        citations,
                        searchesUsed: hasWebContent ? 1 : 0
                    });
                } else {
                    reject(new Error(`Claude Code failed: ${stderr || 'Unknown error'}`));
                }
            });

            claudeProcess.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }

    // Detect if Claude Code response contains web-sourced content
    detectWebContentInResponse(response) {
        const webContentIndicators = [
            /according to.*sources?/i,
            /based on.*research/i,
            /recent.*studies?.*show/i,
            /current.*data.*indicates?/i,
            /latest.*information.*suggests?/i,
            /https?:\/\//i, // URLs
            /\[.*\]\(https?:\/\/.*\)/i, // Markdown links
            /source:.*https?/i,
            /as of \d{4}/i, // "as of 2025"
            /recently.*reported/i,
            /according to.*\.(com|org|net|edu)/i
        ];

        return webContentIndicators.some(pattern => pattern.test(response));
    }

    // Extract citations from Claude Code response
    extractCitationsFromResponse(response) {
        const citations = [];
        
        // Look for URLs
        const urlPattern = /https?:\/\/[^\s]+/g;
        const urls = response.match(urlPattern) || [];
        
        // Look for markdown links
        const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
        let match;
        while ((match = markdownLinkPattern.exec(response)) !== null) {
            citations.push({
                title: match[1],
                url: match[2],
                cited_text: match[1]
            });
        }
        
        // Add standalone URLs
        urls.forEach(url => {
            if (!citations.some(c => c.url === url)) {
                citations.push({
                    title: 'Web Source',
                    url: url,
                    cited_text: url
                });
            }
        });
        
        return citations;
    }

    // Secondary Strategy: Dual-agent API approach
    async tryDualAgentAPISearch(prompt, conversationId) {
        console.log(`🎯 ${this.overseerName}: Using dual-agent API search strategy...`);
        return await this.dualAgentOrchestrator.overseerProcessRequest(prompt, conversationId);
    }

    // Tertiary Strategy: Standard processing
    async processStandardRequest(prompt) {
        console.log(`🎯 ${this.overseerName}: Using standard processing...`);
        const claude = new Anthropic({ apiKey: this.apiKey });
        const message = await claude.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }]
        });

        return {
            content: message.content[0].text,
            citations: [],
            searchesUsed: 0,
            source: 'standard_claude',
            strategy: 'fallback'
        };
    }

    // Main entry point - tries strategies in priority order
    async processRequestWithWebSearch(prompt, conversationId = 'default') {
        const webSearchIndicators = [
            /\b(latest|current|recent|new|2025|today)\b/i,
            /\b(research|find|search|look up|investigate)\b/i,
            /\b(best practices|industry standard|benchmark|trends)\b/i,
            /\b(documentation|specs|api|github|npm)\b/i,
            /\b(what\'s new|updates|changes|releases)\b/i
        ];

        const needsWebSearch = webSearchIndicators.some(pattern => pattern.test(prompt));
        
        if (!needsWebSearch) {
            console.log(`🎯 ${this.overseerName}: No web search needed - standard processing`);
            return await this.processStandardRequest(prompt);
        }

        console.log(`🎯 ${this.overseerName}: Web search requested - trying strategies...`);
        
        // Try each strategy in order until one succeeds
        for (const strategy of this.strategies) {
            try {
                const result = await strategy.handler(prompt, conversationId);
                console.log(`🎯 ${this.overseerName}: Success with ${strategy.name} strategy`);
                return result;
            } catch (error) {
                console.log(`🎯 ${this.overseerName}: ${strategy.name} failed, trying next strategy...`);
                continue;
            }
        }

        // If all strategies fail, return error
        throw new Error('All web search strategies failed');
    }
}

// Original TrinityWebSearch class (used by Worker for API fallback)
class TrinityWebSearch {
    constructor(apiKey) {
        this.anthropic = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY
        });
    }

    // Enhanced Claude request with web search enabled
    async askClaudeWithWebSearch(prompt, options = {}) {
        const {
            model = "claude-3-7-sonnet-20250219",
            maxTokens = 4096,
            maxSearches = 5,
            allowedDomains = null,
            blockedDomains = null,
            userLocation = null
        } = options;

        try {
            const message = await this.anthropic.messages.create({
                model: model,
                max_tokens: maxTokens,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                tools: [
                    {
                        type: "web_search_20250305",
                        name: "web_search",
                        max_uses: maxSearches,
                        ...(allowedDomains && { allowed_domains: allowedDomains }),
                        ...(blockedDomains && { blocked_domains: blockedDomains }),
                        ...(userLocation && { user_location: userLocation })
                    }
                ]
            });

            return this.processWebSearchResponse(message);
        } catch (error) {
            console.error('Web search API error:', error);
            throw error;
        }
    }

    // Process and format web search response
    processWebSearchResponse(message) {
        const response = {
            content: '',
            citations: [],
            searchesUsed: 0,
            usage: message.usage
        };

        // Extract main content and citations
        message.content.forEach(block => {
            if (block.type === 'text') {
                response.content += block.text;
            }
        });

        // Extract tool usage stats
        if (message.usage?.server_tool_use?.web_search_requests) {
            response.searchesUsed = message.usage.server_tool_use.web_search_requests;
        }

        return response;
    }

    // Trinity-specific web search methods
    async researchArchitecturalPatterns(topic) {
        const prompt = `Research current architectural patterns and best practices for ${topic} in 2025. Focus on:
        1. Latest industry standards
        2. Performance considerations  
        3. Security best practices
        4. Implementation examples
        5. Common pitfalls to avoid`;

        return await this.askClaudeWithWebSearch(prompt, {
            maxSearches: 3,
            allowedDomains: [
                "github.com",
                "stackoverflow.com", 
                "developer.mozilla.org",
                "nodejs.org",
                "npmjs.com"
            ]
        });
    }

    async getCurrentTechStandards(technology) {
        const prompt = `Find the latest ${technology} standards, documentation, and best practices for 2025. Include:
        1. Current version information
        2. New features and capabilities
        3. Migration guides
        4. Performance benchmarks
        5. Community recommendations`;

        return await this.askClaudeWithWebSearch(prompt, {
            maxSearches: 2,
            allowedDomains: [
                "docs.microsoft.com",
                "developer.mozilla.org",
                "nodejs.org",
                "github.com"
            ]
        });
    }

    async validateImplementationApproach(approach, context) {
        const prompt = `Validate this implementation approach: "${approach}"
        
        Context: ${context}
        
        Please research current industry practices and provide:
        1. Validation of the approach
        2. Alternative approaches
        3. Pros and cons analysis
        4. Recent developments in this area
        5. Recommendations for improvement`;

        return await this.askClaudeWithWebSearch(prompt, {
            maxSearches: 4
        });
    }
}

// Integration with existing Trinity system
class TrinityClaudeIntegration {
    constructor(apiKey) {
        this.webSearch = new TrinityWebSearch(apiKey);
        this.standardClaude = new Anthropic({ apiKey });
    }

    // Route requests based on need for web search
    async processRequest(prompt, requiresWebSearch = false) {
        // Detect if web search is needed
        const webSearchKeywords = [
            'latest', 'current', '2025', 'recent', 'new', 
            'best practices', 'industry standard', 'benchmark',
            'documentation', 'research', 'trends'
        ];

        const needsWebSearch = requiresWebSearch || 
            webSearchKeywords.some(keyword => 
                prompt.toLowerCase().includes(keyword)
            );

        if (needsWebSearch) {
            console.log('🌐 Using web search for current information');
            return await this.webSearch.askClaudeWithWebSearch(prompt);
        } else {
            console.log('💭 Using standard Claude knowledge');
            return await this.standardRequest(prompt);
        }
    }

    async standardRequest(prompt) {
        const message = await this.standardClaude.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }]
        });

        return {
            content: message.content[0].text,
            citations: [],
            searchesUsed: 0,
            usage: message.usage
        };
    }
}

// CLI wrapper for Trinity development
class TrinityWebSearchCLI {
    constructor() {
        this.claude = new TrinityClaudeIntegration(process.env.ANTHROPIC_API_KEY);
    }

    async handleCommand(args) {
        const prompt = args.join(' ');
        
        try {
            const response = await this.claude.processRequest(prompt);
            
            // Format output
            console.log('\n📝 Response:');
            console.log(response.content);
            
            if (response.searchesUsed > 0) {
                console.log(`\n🔍 Web searches used: ${response.searchesUsed}`);
                console.log(`💰 Estimated cost: ${(response.searchesUsed * 0.01).toFixed(3)}`);
            }
            
            if (response.citations.length > 0) {
                console.log('\n📚 Sources:');
                response.citations.forEach((citation, i) => {
                    console.log(`${i + 1}. ${citation.title} - ${citation.url}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

// Example usage for Trinity MVP development
async function trinityDevelopmentExamples() {
    const trinity = new TrinityWebSearch(process.env.ANTHROPIC_API_KEY);
    
    // Research for Day 3: Memory Hierarchy
    const memoryResearch = await trinity.researchArchitecturalPatterns(
        "JSON-based memory hierarchies for AI agent systems"
    );
    
    // Research for Day 4: Task Registry  
    const taskResearch = await trinity.researchArchitecturalPatterns(
        "dual-agent task registry patterns"
    );
    
    // Research for Day 5: MCP Integration
    const mcpResearch = await trinity.getCurrentTechStandards(
        "Model Context Protocol (MCP) implementation"
    );
    
    // Validate approach
    const validation = await trinity.validateImplementationApproach(
        "File-based inter-process communication for agent coordination",
        "Trinity MVP dual-agent architecture with Overseer + Worker pattern"
    );
    
    return {
        memoryResearch,
        taskResearch, 
        mcpResearch,
        validation
    };
}

// Export for Trinity integration
export {
    TrinityWebSearch,
    TrinityWebSearchStrategy,
    TrinityWebSearchOrchestrator,
    TrinityClaudeIntegration,
    TrinityWebSearchCLI,
    trinityDevelopmentExamples
};

/**
 * CLI Usage Examples:
 * 
 * Start Worker daemon:
 * TRINITY_MODE=worker node trinity-web-search-architecture.js
 *
 * Start Overseer (default):
 * node trinity-web-search-architecture.js
 *
 * Direct CLI usage:
 * node trinity-web-search-architecture.js "research latest Node.js patterns 2025"
 *
 * Integration with existing Trinity Electron app:
 * const { TrinityWebSearchOrchestrator } = require('./trinity-web-search-architecture.js');
 * const trinity = new TrinityWebSearchOrchestrator(apiKey);
 * const result = await trinity.overseerProcessRequest(userPrompt);
 */

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    if (process.env.TRINITY_MODE === 'worker') {
        // Start Worker daemon
        const orchestrator = new TrinityWebSearchOrchestrator(process.env.ANTHROPIC_API_KEY);
        console.log('🎯 Trinity Worker: Starting web search daemon...');
        
        // Worker processing loop
        setInterval(async () => {
            try {
                await orchestrator.workerProcessQueue();
            } catch (error) {
                console.error('Worker error:', error.message);
            }
        }, 1000);
        
    } else if (args.length > 0) {
        // Direct CLI usage
        const strategy = new TrinityWebSearchStrategy(process.env.ANTHROPIC_API_KEY);
        const prompt = args.join(' ');
        
        console.log('🎯 Trinity Overseer: Processing request...');
        strategy.processRequestWithWebSearch(prompt, 'cli')
            .then(result => {
                console.log('\n📝 Final Response:');
                console.log(result.content);
                
                if (result.searchesUsed > 0) {
                    console.log(`\n🔍 Web searches: ${result.searchesUsed} | 💰 Cost: ${(result.searchesUsed * 0.01).toFixed(3)}`);
                }
            })
            .catch(error => console.error('❌ Error:', error.message));
    } else {
        console.log('🎯 Trinity Advanced Web Search Architecture (FUTURE ENHANCEMENT)');
        console.log('');
        console.log('Status: PLANNED - Implementation when Claude Code web search is enhanced');
        console.log('');
        console.log('Usage:');
        console.log('  Direct query: node trinity-web-search-architecture.js "your question"');
        console.log('  Start Worker: TRINITY_MODE=worker node trinity-web-search-architecture.js');
        console.log('  Integration:  const trinity = new TrinityWebSearchStrategy(apiKey);');
        console.log('');
        console.log('Examples:');
        console.log('  node trinity-web-search-architecture.js "latest Node.js performance techniques 2025"');
        console.log('  node trinity-web-search-architecture.js "research current dual-agent architecture patterns"');
        console.log('');
        console.log('Current Reality: WebFetch non-functional in Claude Code (verified May 2025)');
        console.log('Future Vision: Comprehensive web intelligence when capabilities are available');
    }
}