/**
 * Trinity Theme Toggle Event Fix
 * 
 * Ensures the theme toggle button is properly connected to the theme switcher
 */

// Wait for DOM and all Trinity components to be ready
function fixThemeToggleButton() {
  console.log('[Theme Toggle Fix] Checking theme toggle button...');
  
  const button = document.getElementById('trinity-theme-toggle');
  if (!button) {
    console.error('[Theme Toggle Fix] Theme toggle button not found!');
    return false;
  }
  
  // Remove any existing event listeners
  const newButton = button.cloneNode(true);
  button.parentNode.replaceChild(newButton, button);
  
  // Add the correct event listener
  newButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[Theme Toggle Fix] Button clicked!');
    
    if (window.trinityThemeSwitcher) {
      const newTheme = window.trinityThemeSwitcher.toggleTheme();
      console.log(`[Theme Toggle Fix] Theme toggled to: ${newTheme}`);
    } else if (window.trinityStatusBar) {
      // Fallback to status bar's toggle method
      const newTheme = window.trinityStatusBar.toggleTheme();
      console.log(`[Theme Toggle Fix] Theme toggled via status bar to: ${newTheme}`);
    } else {
      console.error('[Theme Toggle Fix] No theme switcher available!');
    }
  });
  
  console.log('[Theme Toggle Fix] Event listener attached successfully');
  return true;
}

// Try to fix immediately and also after various initialization events
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Theme Toggle Fix] DOM ready, attempting fix...');
  fixThemeToggleButton();
});

window.addEventListener('load', () => {
  console.log('[Theme Toggle Fix] Window loaded, attempting fix...');
  fixThemeToggleButton();
});

// Also try after a delay to catch late initialization
setTimeout(() => {
  console.log('[Theme Toggle Fix] Delayed fix attempt...');
  fixThemeToggleButton();
}, 1000);

// Export for manual testing
window.fixThemeToggleButton = fixThemeToggleButton;