# XR Dev Tool Loader

A terminal-style bootloader for Meta Quest development.

## Setup Instructions

1. **Install Node.js**: Download and install from [nodejs.org](https://nodejs.org/).
2. **Ensure ADB is installed**: 
   - This tool automatically looks for ADB in your system path.
   - Fallback: It checks for ADB in the default `Meta Quest Developer Hub` installation path.
3. **Enable Developer Mode**:
   - Open the Meta Quest mobile app.
   - Go to Menu > Devices > [Your Headset] > Headset Settings > Developer Mode.
   - Toggle it **ON**.
4. **Connect Headset**: 
   - Connect via USB-C cable (and accept the prompt inside the headset).
   - Alternatively, ensure ADB over WiFi is configured.

## Running the tool

Navigate to this directory in your terminal and run:

```bash
# Install dependencies
npm install

# Start the tool
npm start
```

## Features
- Sequential terminal-style output.
- Real-time ADB status checking.
- Automatic Quest model detection.
- Hacker/Developer aesthetic with colors and spinners.
