// UI Test wrapper for Trinity MVP
// This bypasses API key requirement for theme testing

// Set a dummy API key for UI testing only
process.env.ANTHROPIC_API_KEY = 'UI_TEST_MODE_NO_REAL_API_CALLS';
process.env.TRINITY_UI_TEST = 'true';

// Load the original main.js
require('./main.js');