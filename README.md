# <img src="docs/banner.png" height="128" />

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](#)
![Repo size](https://img.shields.io/github/repo-size/HoneyBearCodes/gpt-trimmer)

**Keep your ChatGPT conversations smooth, responsive, and clutter-free!**

GPT Trimmer is a lightweight browser extension that trims old messages in ChatGPT, making your long conversations lag-free without interfering with your workflow.

## 🌟 Features

- **Trim Old Messages Instantly**
  A sleek trim button at the bottom-right of the screen lets you remove old messages up to your set threshold.

- **Customizable Message Limit**
  Set the number of messages to keep via the extension icon. Each user input and ChatGPT response counts as one message.

- **Auto-Trim on Page Load**
  Enable auto-trim to automatically delete older messages when the page loads, keeping your chat smooth at all times.

- **Non-Intrusive UI**
  The trim button is designed to stay out of your way while still being easily accessible.

- **Notifications**
  GPT Trimmer features banner notifications for trimming actions. If the user grants notification permissions, it can also send system notifications to alert you when messages are trimmed.

## 🎬 Demo

![Demo GIF](docs/demo.gif)

## ⚡ How It Works

1. Install GPT Trimmer as a browser extension.
2. Set your preferred message limit via the extension icon.
3. Click the trim button to remove old messages or enable auto-trim for automatic cleanup.
4. Allow notifications to receive system alerts when trimming occurs.

> **Note:** Messages are counted individually:
>
> - User prompt = 1 message
> - ChatGPT response = 1 message

So, one exchange equals **2 messages**.

## 🔧 Installation

1. Clone or download the repository:

   ```bash
   git clone https://github.com/HoneyBearCodes/gpt-trimmer.git
   ```

2. Open Chrome/Edge/Brave → Extensions → Load unpacked → Select the project folder.
3. Set your message threshold and enjoy a faster ChatGPT experience!
4. Optionally, enable notifications for system alerts.

## 💡 Why Use GPT Trimmer?

Long conversations in ChatGPT can make scrolling laggy or unresponsive. GPT Trimmer keeps your chat history lightweight and optimized, giving you a smooth, uninterrupted workflow—now with optional system notifications to keep you informed.

## 🤝 Contributing

Contributions, suggestions, or bug reports are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## 📄 License

[MIT License](LICENSE) – free and open-source.
