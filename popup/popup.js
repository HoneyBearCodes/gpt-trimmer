document.addEventListener('DOMContentLoaded', () => {
  const keepInput = document.getElementById('keepValue');
  const saveBtn = document.getElementById('saveBtn');
  const trimOnLoadToggle = document.getElementById('trimOnLoadToggle');

  const DEFAULT_KEEP = 20;

  // Initialize input value from storage
  chrome.storage.sync.get(['KEEP'], (result) => {
    const keepVal = result.KEEP ?? DEFAULT_KEEP;
    keepInput.value = keepVal;
  });

  // Save button click
  saveBtn.addEventListener('click', () => {
    const newValue = parseInt(keepInput.value, 10);

    if (isNaN(newValue) || newValue < 1) {
      // Invalid input: temporarily swap text and colors
      saveBtn.textContent = 'Invalid!';
      saveBtn.classList.add('swap-color');
      setTimeout(() => {
        saveBtn.textContent = 'Save';
        saveBtn.classList.remove('swap-color');
      }, 800);
      return;
    }

    // Valid input: save and show Done! animation
    chrome.storage.sync.set({ KEEP: newValue }, () => {
      saveBtn.textContent = 'Done!';
      saveBtn.classList.add('swap-color');
      setTimeout(() => {
        saveBtn.textContent = 'Save';
        saveBtn.classList.remove('swap-color');
      }, 800);
    });
  });

  // Initialize toggle
  chrome.storage.sync.get({ trimOnLoad: true }, ({ trimOnLoad }) => {
    trimOnLoadToggle.checked = trimOnLoad;
  });

  trimOnLoadToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ trimOnLoad: trimOnLoadToggle.checked });
  });
});
