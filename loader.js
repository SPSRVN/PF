/* Terminal Loader Script */
const terminalLines = [
    { text: "XR DEV SYSTEM v1.1.0 INITIALIZING...", type: "header" },
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
    { text: "Launching Saravana Prakash portfolio...", type: "launch" }
];

const asciiLogo = `
 __  ______     ____   _______     __
 \\ \\/ /  _ \\   |  _ \\ | ____\\ \\   / /
  \\  /| |_) |  | | | ||  _|  \\ \\ / / 
  /  \\|  _ <   | |_| || |___  \\ V /  
 /_/\\_\\_| \\_\\  |____/ |_____|  \\_/   
                                    
`;

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('terminal-loader');
    const terminalBody = document.getElementById('terminal-body');
    const terminalContainer = document.getElementById('terminal-content');
    const portfolioContent = document.getElementById('portfolio-content');

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

                // Trigger portfolio reveal
                if (portfolioContent) {
                    portfolioContent.classList.add('active');

                    // Force refresh GSAP ScrollTriggers after the reveal starts
                    if (typeof ScrollTrigger !== 'undefined') {
                        setTimeout(() => ScrollTrigger.refresh(), 500);
                    }
                }

                // Ensure main page content is visible
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 800);
            }, 400);
            return;
        }

        const lineData = terminalLines[currentLineIndex];
        const lineElement = document.createElement('div');
        lineElement.className = 'terminal-line';

        if (lineData.type === 'header') {
            lineElement.style.color = '#bd93f9';
            lineElement.style.fontWeight = 'bold';
            lineElement.style.marginBottom = '1rem';
        } else if (lineData.type === 'launch') {
            lineElement.style.marginTop = '1rem';
            lineElement.style.color = '#50fa7b';
            lineElement.style.fontSize = '1.1rem';
        }

        terminalContainer.appendChild(lineElement);

        let charIndex = 0;
        const typingSpeed = Math.random() * 8 + 2; // Fast typing

        function typeChar() {
            if (charIndex < lineData.text.length) {
                lineElement.textContent += lineData.text.charAt(charIndex);
                charIndex++;

                if (terminalBody) {
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }

                setTimeout(typeChar, typingSpeed);
            } else {
                lineElement.classList.add('visible');

                if (lineData.status) {
                    const text = lineElement.textContent;
                    const statusStr = `[ ${lineData.status} ]`;
                    if (text.includes(statusStr)) {
                        const parts = text.split(statusStr);
                        lineElement.innerHTML = `${parts[0]}<span class="status-${lineData.status.toLowerCase()}">${statusStr}</span>${parts[1] || ''}`;
                    }
                }

                currentLineIndex++;
                const nextDelay = lineData.status === 'WAIT' ? 150 : 80;
                setTimeout(typeLine, nextDelay);
            }
        }

        typeChar();
    }

    // Start delay
    setTimeout(() => {
        document.body.style.overflow = 'hidden';
        typeLine();
    }, 200);
});
