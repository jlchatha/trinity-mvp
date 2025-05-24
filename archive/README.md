# Trinity MVP Archive

This directory contains historical development files, test scripts, and documentation that were moved from the root directory to maintain a clean production repository structure.

## Directory Structure

### `/test-scripts/`
Contains all development and testing scripts used during Trinity MVP development:

- `test-cross-platform.js` - Cross-platform compatibility testing
- `test-day3-components.js` - Day 3 component integration tests  
- `test-day4-integration.js` - Day 4 integration testing
- `test-electron-trinity-integration.js` - Electron + Trinity integration tests
- `test-integration.js` - Core integration testing script
- `trinity-test.js` - Main Trinity testing framework
- `validate-macos-deployment.js` - macOS deployment validation
- `validation-results-macos.json` - macOS validation results

### `/deployment-docs/`
Contains deployment and testing documentation from development phase:

- `ELECTRON-OPERATOR-TESTING.md` - Electron operator testing procedures
- `MACOS-DEPLOYMENT-GUIDE.md` - macOS deployment instructions
- `MACOS-READINESS-SUMMARY.md` - macOS readiness assessment
- `QUICK-OPERATOR-TEST.md` - Quick testing procedures for operators
- `TEST-UPDATE.md` - Testing update procedures

### `/test-data/`
Contains test data directories and sample files used during development:

- `test-data-integration/` - Integration test data
  - Memory hierarchy test files
  - Recovery system test data  
  - Task registry test backups
- `test-data/` - Core test data
  - Memory core test files
  - Session metadata samples
  - Auto-compact logs

## Archive Date
Files archived: May 24, 2025

## Reason for Archival
These files were moved to create a clean, production-ready repository structure focused on end-user functionality rather than development artifacts.

## Restoration
If any of these files are needed for development or troubleshooting, they can be moved back to appropriate locations in the repository.