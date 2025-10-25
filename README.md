# <img src="docs/banner.png" height="128" />

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](#)
![Lines of code](https://img.shields.io/endpoint?url=https://ghloc.vercel.app/api/HoneyBearCodes/gpt-trimmer/badge?match=.js$,.css$,.html$,.json$,popup/\&style=flat\&color=blueviolet\&label=Lines%20of%20Code)

**Keep your ChatGPT conversations smooth, responsive, and clutter-free!**

GPT Trimmer is a lightweight browser extension that **trims old messages in ChatGPT**, making long conversations lag-free without interfering with your workflow.

## ✨ Features

* GPT Trimmer trims old messages to keep long ChatGPT conversations responsive.
* You can set the number of messages to keep.
* Auto-trim can be enabled to automatically remove messages that exceed your threshold on page load.
* The trim button is small and unobtrusive, staying out of your way.
* The extension shows banner notifications and can send system notifications if allowed.

## 🎬 Demo

![Demo GIF](docs/demo.gif)

## 🔍 How It Works

1. Install GPT Trimmer as a browser extension.
2. Set your preferred message limit via the extension icon.
3. Click the trim button or enable auto-trim for automatic cleanup.
4. Enable notifications to receive system alerts when trimming occurs.

> **Note:** Each user prompt and ChatGPT response counts as **1 message**.
> One exchange equals **2 messages**.

## 🔧 Installation

**Option 1: Clone the repository**

```bash
git clone https://github.com/HoneyBearCodes/gpt-trimmer.git
```

**Option 2: Download release ZIP**
Download `gpt-trimmer-v1.0.0.zip` and extract it.

**Load in browser:**

1. Open Chrome, Edge, or Brave → `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** → select the extension folder.
4. Set your message threshold and optionally enable notifications.

## 🛡️ Compliance and Safety

GPT Trimmer is **entirely client-side** and modifies only the ChatGPT UI:

* **No prompts or responses are altered**; no extra data is sent to OpenAI.
* **All operations occur locally** in the user’s browser.
* The extension does not circumvent usage limits or access controls.

This design ensures GPT Trimmer is **harmless, fully client-side, and compliant** with OpenAI’s architecture.

## 🤝 Contributing

Contributions, suggestions, or bug reports are welcome!

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit your changes:

   ```bash
   git commit -m 'Add new feature'
   ```
4. Push the branch:

   ```bash
   git push origin feature/YourFeature
   ```
5. Open a Pull Request.

## 📄 License

[MIT License](LICENSE) – free and open-source.
