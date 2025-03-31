# WhatsApp Emergency Detection Agent

A WhatsApp bot that passively monitors group messages to detect emergency situations (mental health crises, medical emergencies, or aggressive behavior) and sends private alerts to administrators.

## Overview

This system uses OpenAI's language models via LangChain to analyze messages in WhatsApp groups for potential emergency situations. When emergency content is detected, it sends a private WhatsApp DM to the designated administrator with details about the detected emergency.

## Features

- Connects to WhatsApp Web via whatsapp-web.js
- Monitors specific groups in real-time
- Uses LangChain and OpenAI to classify messages
- Detects different emergency categories (mental health, medical, conflict)
- Sends private alerts via WhatsApp DM
- Stores only flagged messages for future reference

## Prerequisites

- Node.js (v18 or later)
- MongoDB server
- OpenAI API key
- WhatsApp account

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/whatsapp-emergency-detection-agent.git
   cd whatsapp-emergency-detection-agent
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create .env file:

   ```
   cp .env.example .env
   ```

4. Update the .env file with your configuration:
   - Add your OpenAI API key
   - Set your MongoDB connection string
   - Configure your admin WhatsApp number
   - Add the groups you want to monitor

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Initial Setup

On first run, you'll need to scan a QR code with your WhatsApp to authenticate. The QR code will appear in the console.

## Configuration

The following environment variables are used to configure the application:

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGO_URI`: MongoDB connection string
- `ADMIN_PHONE_NUMBER`: WhatsApp number to receive alerts
- `MONITORED_GROUP_IDS`: Comma-separated list of WhatsApp group IDs to monitor
- `LOG_LEVEL`: Logging level (default: info)
- `EMERGENCY_CONFIDENCE_THRESHOLD`: Minimum confidence score to trigger an alert (default: 0.75)

## Project Structure

```
whatsapp-emergency-detection-agent/
├── src/
│   ├── config/          # Configuration handling
│   ├── models/          # Database models
│   ├── services/        # Core services (WhatsApp, classification, alerts)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (logging, database)
│   └── index.ts         # Application entry point
├── .env                 # Environment variables (created from .env.example)
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## License

ISC

## Note

This system is designed to be deployed privately and used ethically. It does not store regular conversations, only messages flagged as potential emergencies.
