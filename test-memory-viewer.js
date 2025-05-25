/**
 * Test Memory Viewer Functionality
 * Diagnostic script to test Trinity MVP memory artifact viewing
 */

console.log('=== Trinity MVP Memory Viewer Test ===');

async function testMemoryViewer() {
  console.log('1. Testing Trinity API availability...');
  
  if (typeof window !== 'undefined' && window.trinityAPI) {
    console.log('✅ Trinity API available');
    
    try {
      console.log('2. Testing memory artifacts loading...');
      const artifacts = await window.trinityAPI.loadMemoryArtifacts();
      console.log(`✅ Loaded ${artifacts.length} memory artifacts:`, artifacts);
      
      console.log('3. Testing memory stats...');
      const stats = await window.trinityAPI.getMemoryStats();
      console.log('✅ Memory stats:', stats);
      
      console.log('4. Testing memory APIs...');
      const allMemories = await window.trinityAPI.memory.getAllMemories();
      console.log('✅ All memories:', allMemories);
      
    } catch (error) {
      console.error('❌ Memory API test failed:', error);
    }
  } else {
    console.error('❌ Trinity API not available');
  }
  
  console.log('5. Testing Memory Artifacts Viewer class...');
  if (typeof MemoryArtifactsViewer !== 'undefined') {
    console.log('✅ MemoryArtifactsViewer class available');
  } else {
    console.error('❌ MemoryArtifactsViewer class not loaded');
  }
  
  console.log('6. Testing DOM elements...');
  const exploreButton = document.getElementById('browse-memory-detailed');
  if (exploreButton) {
    console.log('✅ Explore Memory button found:', exploreButton);
  } else {
    console.error('❌ Explore Memory button not found');
  }
  
  const memoryBrowser = document.getElementById('trinity-memory-browser');
  if (memoryBrowser) {
    console.log('✅ Memory browser element found:', memoryBrowser);
    console.log('   Display style:', memoryBrowser.style.display);
  } else {
    console.error('❌ Memory browser element not found');
  }
}

// Run test when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testMemoryViewer);
} else {
  testMemoryViewer();
}

// Also expose for manual testing
window.testMemoryViewer = testMemoryViewer;