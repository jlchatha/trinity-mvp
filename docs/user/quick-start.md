# Quick Start Guide

Get Trinity MVP running in 5 minutes and start your first conversation with persistent memory.

## Prerequisites

### System Requirements
- **OS**: RHEL 8+, Ubuntu 20.04+, Fedora 35+, macOS 10.15+
- **Node.js**: Version 18.0 or higher
- **Memory**: 4GB RAM minimum
- **Storage**: 1GB available space

### Account Setup
Trinity MVP requires Claude Code for local system integration:

1. **Install Claude Code**: Follow the [Claude Code installation guide](https://claude.ai/code)
2. **Account Setup**: Obtain your Anthropic API key from the [Anthropic Console](https://console.anthropic.com/)
3. **Native Installation**: Full local system integration on Linux and macOS

## Installation

### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-org/trinity-mvp.git
cd trinity-mvp

# Install dependencies
npm install
```

### Step 2: Configure API Key
```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY="your-api-key-here"

# Or create a .env file
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```

### Step 3: Launch Trinity MVP
```bash
# Start the application
npm start
```

## First Conversation

### 1. Welcome Screen
When Trinity MVP launches, you'll see:
- Professional loading screen
- Chat interface with welcome message
- "Start Chatting" button

### 2. Begin Chatting
Click "Start Chatting" and try these examples:

**Basic Interaction:**
```
Hello! I'm working on a new project. Can you help me create a README file?
```

**File System Access:**
```
Please read the package.json file in my current directory and tell me about the project structure.
```

**Project Context Building:**
```
I'm building a web application using React and Node.js. Can you help me plan the architecture?
```

### 3. Watch Trinity Learn
As you interact, Trinity will:
- ✅ Remember your project details
- ✅ Learn your communication preferences  
- ✅ Build context about your working style
- ✅ Maintain conversation history across sessions

## Key Features to Try

### Persistent Memory
```
# Session 1
"I prefer detailed technical explanations with code examples."

# Session 2 (later)
"Can you explain how to implement authentication?"
# Trinity remembers your preference for detailed technical explanations
```

### Local File Integration
```
"Create a new file called 'architecture.md' with a basic project structure outline."

"Read my existing config files and suggest improvements."

"Help me debug this error by examining the log files."
```

### Professional Workflows
```
"Help me document this API endpoint I just created."

"Generate a project status report based on my recent code changes."

"Create a technical decision record for choosing this database."
```

## Troubleshooting

### Common Issues

**Trinity won't start:**
- Verify Node.js version: `node --version` (should be 18+)
- Check if port 3000 is available
- Ensure all dependencies installed: `npm install`

**Claude Code integration fails:**
- Verify API key is set: `echo $ANTHROPIC_API_KEY`
- Check Claude Code installation: `claude --version`
- Ensure native Claude Code installation on Linux/macOS

**Memory/context issues:**
- Restart Trinity to clear temporary context
- Check available disk space (Trinity stores memory locally)
- Verify write permissions in Trinity directory

### Getting Help

**Check logs:**
```bash
# View application logs
npm run logs

# Check Claude Code integration logs
tail -f ~/.trinity-mvp/logs/claude-watcher.log
```

**Health check:**
```bash
# Run system health check
npm run health-check
```

## Next Steps

### Explore Documentation
- **[User Guide](user-guide.md)**: Comprehensive feature walkthrough
- **[Professional Workflows](workflows.md)**: Common use cases and templates
- **[Technical Overview](../technical/architecture-overview.md)**: How Trinity works

### Customize Your Experience
- **Memory Settings**: Configure how Trinity stores and retrieves context
- **UI Preferences**: Switch between standard and accessible interfaces
- **Workflow Templates**: Create custom automation patterns

### Join the Community
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Share workflows and get help from other users
- **Contributing**: Help improve Trinity MVP

---

**Congratulations!** You now have Trinity MVP running with persistent memory and local system integration. Start building context and let Trinity learn your working patterns.