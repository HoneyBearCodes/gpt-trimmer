document.addEventListener('DOMContentLoaded', () => {
  const keepMessagesInput = document.getElementById('keepValue');
  const saveButton = document.getElementById('saveBtn');
  const trimOnLoadCheckbox = document.getElementById('trimOnLoadToggle');
  const statusMessage = document.getElementById('statusMsg');

  const DEFAULT_MESSAGES_TO_KEEP = 20;
  const STATUS_FEEDBACK_DURATION = 800;

  /**
   * Utility: Display temporary feedback on the save button
   * @param {string} message - Text to display
   * @param {boolean} isError - Whether this is an error state
   */
  const showSaveFeedback = (message, isError = false) => {
    saveButton.textContent = message;
    saveButton.classList.toggle('popup__button--swap', isError || message === 'Done!');
    setTimeout(() => {
      saveButton.textContent = 'Save';
      saveButton.classList.remove('popup__button--swap');
    }, STATUS_FEEDBACK_DURATION);
  };

  /**
   * Load the current settings from chrome.storage
   */
  const loadSettings = async () => {
    const { KEEP = DEFAULT_MESSAGES_TO_KEEP, trimOnLoad = true } =
      await chrome.storage.sync.get(['KEEP', 'trimOnLoad']);

    keepMessagesInput.value = KEEP;
    trimOnLoadCheckbox.checked = trimOnLoad;
  };

  /**
   * Save the number of messages to keep
   */
  const saveKeepMessages = async () => {
    const newKeepValue = parseInt(keepMessagesInput.value, 10);

    if (isNaN(newKeepValue) || newKeepValue < 1) {
      showSaveFeedback('Invalid!', true);
      return;
    }

    await chrome.storage.sync.set({ KEEP: newKeepValue });
    showSaveFeedback('Done!');
  };

  /**
   * Update the trim-on-load preference
   */
  const updateTrimOnLoadSetting = async (event) => {
    const isChecked = event.target.checked;
    await chrome.storage.sync.set({ trimOnLoad: isChecked });
  };

  // Event listeners
  saveButton.addEventListener('click', saveKeepMessages);
  trimOnLoadCheckbox.addEventListener('change', updateTrimOnLoadSetting);

  // Initialize the popup
  loadSettings();
});
