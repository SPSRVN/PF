/* Terminal Loader Script */
const terminalLines = [
    { text: "XR DEV SYSTEM v1.0.4 INITIALIZING...", type: "header" },
    { text: "Checking ADB installation...", status: "WAIT" },
    { text: "ADB version 34.0.4-10411341 [ OK ]", status: "OK" },
    { text: "Scanning USB devices...", status: "WAIT" },
    { text: "Device Found: Meta Quest 3 [ VR-MODE ]", status: "CONNECTED" },
    { text: "Establishing secure ADB bridge...", status: "WAIT" },
    { text: "Bridge Established [ CONNECTED ]", status: "CONNECTED" },
    { text: "Initializing XR runtime...", status: "WAIT" },
    { text: "Loading OpenXR modules...", status: "OK" },
    { text: "Preparing developer environment...", status: "OK" },
    { text: "Portfolio interface ready.", status: "OK" },
    { text: "Launching XR Developer Portfolio...", type: "launch" }
];

const asciiLogo = `
 __  ______     ____  _______     __
 \\ \\/ /  _ \\   / ___|| ____\\ \\   / /
  \\  /| |_) | | |  _ |  _|  \\ \\ / / 
  /  \\|  _ <  | |_| || |___  \\ V /  
 /_/\\_\\_| \\_\\  \\____||_____|  \\_/   
                                    
`;

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('terminal-loader');
    const terminalContainer = document.getElementById('terminal-content');

    if (!loader || !terminalContainer) return;

    // Add ASCII Logo first (instant)
    const logoDiv = document.createElement('div');
    logoDiv.className = 'ascii-logo';
    logoDiv.textContent = asciiLogo;
    terminalContainer.appendChild(logoDiv);

    let currentLineIndex = 0;

    function typeLine() {
        if (currentLineIndex >= terminalLines.length) {
            // End sequence
            setTimeout(() => {
                loader.classList.add('fade-out');
                // Ensure main page content is visible and animations can play
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 800);
            }, 1000);
            return;
        }

        const lineData = terminalLines[currentLineIndex];
        const lineElement = document.createElement('div');
        lineElement.className = 'terminal-line';

        if (lineData.type === 'header') {
            lineElement.style.color = '#a855f7';
            lineElement.style.fontWeight = 'bold';
            lineElement.style.marginBottom = '1.5rem';
        } else if (lineData.type === 'launch') {
            lineElement.style.marginTop = '1.5rem';
            lineElement.style.color = '#00ff00';
            lineElement.style.fontSize = '1.2rem';
        }

        terminalContainer.appendChild(lineElement);

        let charIndex = 0;
        const typingSpeed = Math.random() * 30 + 10; // Varied typing speed

        function typeChar() {
            if (charIndex < lineData.text.length) {
                lineElement.textContent += lineData.text.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typingSpeed);
            } else {
                // Done typing this line
                lineElement.classList.add('visible');

                // If there's a status, wrap it in a span for coloring
                if (lineData.status) {
                    const text = lineElement.textContent;
                    const statusStr = `[ ${lineData.status} ]`;
                    if (text.includes(statusStr)) {
                        const parts = text.split(statusStr);
                        lineElement.innerHTML = `${parts[0]}<span class="status-${lineData.status.toLowerCase()}">${statusStr}</span>${parts[1] || ''}`;
                    }
                }

                currentLineIndex++;
                const nextDelay = lineData.status === 'WAIT' ? 600 : 300;
                setTimeout(typeLine, nextDelay);
            }
        }

        typeChar();
    }

    // Start with a small initial delay
    setTimeout(() => {
        document.body.style.overflow = 'hidden'; // Lock scrolling during boot
        typeLine();
    }, 500);
});
