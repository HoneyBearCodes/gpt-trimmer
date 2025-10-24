chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ KEEP: 20 }, (data) => {
    if (data.KEEP === undefined) chrome.storage.sync.set({ KEEP: 20 });
  });
});
