document.addEventListener('DOMContentLoaded', () => {
  const keepInput = document.getElementById('keepValue');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');
  const trimOnLoadToggle = document.getElementById('trimOnLoadToggle');

  const DEFAULT_KEEP = 20;

  chrome.storage.sync.get(['KEEP'], (result) => {
    const keepVal = result.KEEP ?? DEFAULT_KEEP;
    keepInput.value = keepVal;
  });

  saveBtn.addEventListener('click', () => {
    const newValue = parseInt(keepInput.value, 10);
    if (isNaN(newValue) || newValue < 1) {
      statusMsg.textContent = 'Please enter a valid number.';
      statusMsg.classList.add('visible');
      return;
    }

    chrome.storage.sync.set({ KEEP: newValue }, () => {
      statusMsg.textContent = `Changes saved!`;
      statusMsg.classList.add('visible');
      setTimeout(() => statusMsg.classList.remove('visible'), 2500);
    });
  });

  chrome.storage.sync.get({ trimOnLoad: true }, ({ trimOnLoad }) => {
    trimOnLoadToggle.checked = trimOnLoad;
  });

  trimOnLoadToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ trimOnLoad: trimOnLoadToggle.checked });
  });
});
