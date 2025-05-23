# Trinity MVP Testing Guide

## Quick Test Commands

### 1. Health Check (Required First)
```bash
npm run health-check
```
This verifies:
- ✅ Node.js version compatibility
- ✅ Trinity directories created
- ✅ Claude Code installation
- ✅ API key configuration
- ✅ Dependencies installed

### 2. Integration Test (Verifies End-to-End)
```bash
npm run test:trinity
```
or
```bash
node test-integration.js
```

This tests the complete pipeline:
- Trinity MVP UI → Claude SDK → File Communication → Claude Watcher → Claude Code → Response

## Expected Results

### Health Check Success
```
Trinity MVP Health Check
========================

  ✅ Node.js Version: v20.x.x (Compatible)
  ✅ Trinity Directories: Created successfully
  ✅ Claude Code: @anthropic-ai/claude-code v1.0.2 installed
  ✅ API Key: Configured correctly
  ✅ Dependencies: node_modules exists

Health Check Summary
===================

Passed: 5/5 checks

🎉 Trinity MVP is ready to use!

Next steps:
  1. Start Trinity MVP: npm start
  2. Run integration test: npm run test:trinity
  3. Run full end-to-end test: node test-integration.js
```

### Integration Test Success
```
🧪 Starting Trinity MVP Integration Test
==================================================
1️⃣  Initializing Claude Code SDK...
2️⃣  Testing simple command execution...
✅ Command Result: {
  success: true,
  hasContent: true,
  contentLength: 156,
  sessionId: 'integration-test-session'
}
📄 Response Preview: Trinity MVP integration successful! I can confirm that all systems are working correctly...
🎉 Trinity MVP Integration Test PASSED!
🧹 Cleaning up...
==================================================
🏁 Integration test completed
```

## Troubleshooting

### Common Issues

**Health Check Fails on Claude Code**
- Run: `claude --version`
- Should return: `1.0.2` or similar (Claude Code version)
- If not installed: Visit [claude.ai/code](https://claude.ai/code) for installation

**Integration Test Times Out**
- Check watcher daemon: Look for `[WATCHER]` logs when running Trinity MVP
- Check file queue: `ls ~/.trinity-mvp/queue/input/` should be empty after test
- Check Claude Code: `claude --help` should show available commands

**API Key Issues**
- Verify: `echo $ANTHROPIC_API_KEY` returns your key (Linux/macOS)
- Set key: `export ANTHROPIC_API_KEY="your_key_here"`
- Make permanent: Add export to `~/.bashrc` or `~/.zshrc`

## Manual Testing Steps

1. **Start Trinity MVP**
   ```bash
   npm start
   ```

2. **Send test message in UI**
   - Type: "Hello, please confirm you're working"
   - Expect: Response within 30 seconds

3. **Check logs**
   - Console shows: `[WATCHER] Processing request...`
   - UI shows: Response from Claude Code

## File Structure Check
Ensure these files exist:
- ✅ `test-integration.js` - Integration test script
- ✅ `claude-watcher.js` - Background daemon
- ✅ `main.js` - Main Electron process with watcher startup
- ✅ `src/core/claude-integration.js` - Claude SDK
- ✅ `src/core/file-manager.js` - File communication system
- ✅ `scripts/health-check.js` - Health validation

## Success Criteria

Trinity MVP is **100% functional** when:
1. ✅ Health check passes all 5 tests
2. ✅ Integration test completes successfully  
3. ✅ UI launches and loads without errors
4. ✅ Messages sent through UI receive Claude Code responses
5. ✅ File queue processes requests (empty after sending)
6. ✅ Watcher daemon logs show in console during operation