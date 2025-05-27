# Import Path Migration Plan

**Purpose**: Document current import structure and plan safe transition to new directory organization

**Safety**: This analysis ensures no import dependencies are broken during repository cleanup

## 📊 Current Import Structure Analysis

### **Core Module Dependencies**

Based on analysis of require statements in the codebase:

```javascript
// Current import patterns found:
'./src/core/complex-query-processor'
'./src/core/memory-reference-detector' 
'./src/core/trinity-memory-integration'
'./src/core/intelligent-compressor'
'./src/core/trinity-native-memory'
'./src/core/claude-code-context-enhancer'
'./src/core/content-type-classifier'
```

### **Import Usage Analysis**

**Test Files Using Core Modules**:
- `comprehensive-weird-behavior-validation.js` → Uses complex-query-processor, memory-reference-detector
- `test-memory-integration.js` → Uses trinity-memory-integration, intelligent-compressor  
- `final-verification-test.js` → Uses trinity-native-memory
- `test-trinity-memory.js` → Uses trinity-native-memory, memory-reference-detector, content-type-classifier
- Various other test files with core dependencies

**Standard Node.js Modules**: 
- `fs`, `path`, `os` - Standard library imports (no changes needed)

## 🗺️ New Structure Mapping

### **Current → New Path Mappings**

```javascript
// OLD STRUCTURE → NEW STRUCTURE

// Core functionality
'./src/core/complex-query-processor'     → './src-new/core/integration/complex-query-processor'
'./src/core/memory-reference-detector'   → './src-new/core/memory/memory-reference-detector'
'./src/core/trinity-memory-integration'  → './src-new/core/memory/trinity-memory-integration'
'./src/core/intelligent-compressor'      → './src-new/core/memory/intelligent-compressor'
'./src/core/trinity-native-memory'       → './src-new/core/memory/trinity-native-memory'
'./src/core/claude-code-context-enhancer'→ './src-new/core/integration/claude-code-context-enhancer'
'./src/core/content-type-classifier'     → './src-new/core/utils/content-type-classifier'

// Health monitoring (already in new structure)
'./src/core/health/health-check'         → './src-new/core/utils/health-check'

// Security components
'./src/core/response-security-filter'    → './src-new/core/security/response-security-filter'
```

### **Directory Organization Logic**

**Memory Components** → `src-new/core/memory/`
- All memory-related functionality
- Memory detection, integration, compression
- Native memory interfaces

**Integration Components** → `src-new/core/integration/`
- Query processing and classification
- External service integrations (Claude Code)
- API communication layers

**Utility Components** → `src-new/core/utils/`
- Helper functions and utilities
- Content classification
- Health monitoring and diagnostics

**Security Components** → `src-new/core/security/`
- Security filtering and validation
- Privacy protection mechanisms
- Input/output sanitization

## 🔄 Safe Migration Strategy

### **Phase 1: Parallel Structure Validation** ✅ COMPLETED
- Create `src-new/` directory structure
- Copy files to new locations
- Verify parallel structure works

### **Phase 2: Import Path Updates** (FUTURE)
- Update require statements to new paths
- Test each file individually after updates
- Validate functionality after each change

### **Phase 3: Cleanup** (FUTURE)
- Remove old `src/` directory structure
- Update build configurations
- Final validation of all imports

## ⚠️ Critical Safety Considerations

### **Files That MUST NOT Be Moved**

Current analysis shows these are **TEST FILES ONLY** using core modules:
- All files importing `src/core/*` are development/testing files
- **NO PRODUCTION CODE** depends on these paths
- Trinity MVP core functionality uses **DIFFERENT** architecture

### **Trinity MVP Core Architecture**

Trinity MVP's actual runtime architecture:
```
main.js                    # Electron main process
preload.js                 # Electron preload script  
claude-watcher.js          # Core Claude integration
src/electron/              # UI components
```

**Key Finding**: The `src/core/*` modules are **DEVELOPMENT/TESTING UTILITIES** not part of Trinity MVP's core runtime!

### **No Breaking Changes to Production**

✅ **Safe to migrate** because:
- Core Trinity MVP doesn't use `src/core/*` imports
- Only test files and development tools use these paths
- Production runtime uses different architecture entirely

## 📋 Implementation Steps

### **When Ready for Migration**:

1. **Update Test File Imports**:
   ```bash
   # Example update pattern:
   sed -i "s|'./src/core/complex-query-processor'|'./src-new/core/integration/complex-query-processor'|g" test-files
   ```

2. **Validate Each Update**:
   ```bash
   # Test functionality after each import update
   node comprehensive-weird-behavior-validation.js
   ```

3. **Batch Import Updates**:
   ```bash
   # Update all imports in parallel after validation
   find . -name "*.js" -not -path "./node_modules/*" -exec sed -i 's|src/core/|src-new/core/|g' {} +
   ```

## ✅ Current Status

**Phase 3.3 Analysis Complete**:
- ✅ Current import structure documented
- ✅ New structure mapping planned  
- ✅ Safety verification completed
- ✅ Migration strategy documented
- ✅ **CRITICAL**: No production dependencies found on `src/core/*`

**Ready for Implementation**: All import changes are **safe** and **non-breaking** for Trinity MVP production functionality.

---

**Next Steps**: Import path migration can be implemented safely without risk to Trinity MVP core functionality, as all dependencies are development/testing utilities only.