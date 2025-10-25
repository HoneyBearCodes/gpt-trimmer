// Default configuration for GPT Trimmer
const DEFAULT_SETTINGS = {
  messagesToKeep: 20,
};

/**
 * Initialize default settings on extension install
 */
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const storedSettings = await chrome.storage.sync.get({ KEEP: DEFAULT_SETTINGS.messagesToKeep });

    // Ensure KEEP is set (sync with default if missing)
    if (storedSettings.KEEP === undefined) {
      await chrome.storage.sync.set({ KEEP: DEFAULT_SETTINGS.messagesToKeep });
    }
  } catch (error) {
    console.error('Error initializing GPT Trimmer settings:', error);
  }
});
