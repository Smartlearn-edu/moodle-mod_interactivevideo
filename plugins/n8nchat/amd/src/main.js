
/**
 * Main class for the n8n Chat plugin
 *
 * @module     ivplugin_n8nchat/main
 * @copyright  2024 Antigravity
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'mod_interactivevideo/type/base'], function ($, Base) {

    return class N8nChat extends Base {

        /**
         * Called when the content is rendered.
         */
        postContentRender(annotation) {
            this.initChat(annotation);
        }

        /**
         * Initialize the n8n chat widget
         */
        async initChat(annotation) {
            const webhookUrl = annotation.webhookurl;
            const welcomeMessage = annotation.welcomemessage;

            try {
                // Dynamically import the n8n chat bundle
                // Note: We use dynamic import which is supported in modern browsers.
                // If this fails in older environments, we might need a script tag fallback.
                const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
                const createChat = module.createChat;

                const courseId = M.cfg.courseId; // Sometimes available
                const userId = M.cfg.userId || 'guest';

                // Attempt to get course ID from URL if not in cfg
                let effectiveCourseId = courseId;
                if (!effectiveCourseId) {
                    const urlParams = new URLSearchParams(window.location.search);
                    effectiveCourseId = urlParams.get('id');
                }

                createChat({
                    webhookUrl: webhookUrl,
                    mode: 'window',
                    chatInputKey: 'chatInput',
                    chatSessionKey: 'sessionId_iv_' + annotation.id, // Unique session per annotation
                    loadPreviousSession: true,
                    showWelcomeScreen: true,
                    initialMessages: [
                        welcomeMessage
                    ],
                    defaultLanguage: 'en',
                    metadata: {
                        userId: userId,
                        source: 'moodle_interactivevideo',
                        annotationId: annotation.id,
                        courseId: effectiveCourseId,
                        pageUrl: window.location.href,
                        timestamp: new Date().toISOString()
                    },
                    target: 'body' // Important: Append to body to overlay over everything
                });

                console.log('n8n Chat loaded for IV Annotation', annotation.id);

                // Add window controls and customization
                this.addWindowControls();
                this.applyCustomStyles();

                // Monitor DOM changes for dynamically loaded elements within the chat shadow/iframe
                const observer = new MutationObserver(() => {
                    this.addWindowControls();
                    this.replaceIcon();
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

            } catch (error) {
                console.error('Error loading n8n chat widget:', error);
            }
        }

        addWindowControls() {
            // Try multiple selector strategies to find the header
            const selectors = [
                'div[class*="Header"]',
                '.chat-header',
                '[class*="chat-header"]',
                'div[class*="header"]',
                'header'
            ];

            // We need to look carefully because the chat might render differently
            let header = null;
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    // Heuristic: Check if this looks like our chat header
                    if (el.textContent.includes('AI Assistant') ||
                        el.closest('[class*="window"]') ||
                        el.closest('[class*="chat"]')) {
                        header = el;
                        break;
                    }
                }
                if (header) break;
            }

            if (header && !header.dataset.controlsAdded) {

                // Create controls container
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'window-controls';
                // Styles are applied via CSS file where possible, but inline ensures priority over widget styles
                controlsDiv.style.cssText = `
                    display: flex !important;
                    gap: 8px !important;
                    margin-left: auto !important;
                    z-index: 10000 !important;
                    position: absolute !important;
                    right: 16px !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                `;

                const btnStyle = `
                    width: 32px !important;
                    height: 32px !important;
                    border: none !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    cursor: pointer !important;
                    border-radius: 4px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 18px !important;
                    font-weight: bold !important;
                `;

                // Minimize button
                const minimizeBtn = document.createElement('button');
                minimizeBtn.className = 'window-control-btn minimize';
                minimizeBtn.innerHTML = '−';
                minimizeBtn.title = 'Minimize';
                minimizeBtn.style.cssText = btnStyle;
                minimizeBtn.onclick = (e) => {
                    e.stopPropagation();
                    const chatWindow = header.closest('[class*="window"]') || header.closest('[class*="chat"]');
                    if (chatWindow) {
                        chatWindow.classList.toggle('chat-minimized');
                    }
                };

                // Maximize button
                const maximizeBtn = document.createElement('button');
                maximizeBtn.className = 'window-control-btn maximize';
                maximizeBtn.innerHTML = '□';
                maximizeBtn.title = 'Maximize';
                maximizeBtn.style.cssText = btnStyle;
                maximizeBtn.onclick = (e) => {
                    e.stopPropagation();
                    const chatWindow = header.closest('[class*="window"]') || header.closest('[class*="chat"]');
                    if (chatWindow) {
                        chatWindow.classList.toggle('chat-maximized');
                        maximizeBtn.innerHTML = chatWindow.classList.contains('chat-maximized') ? 'NB' : '□';
                    }
                };

                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'window-control-btn close';
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Close';
                closeBtn.style.cssText = btnStyle;
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    const chatWindow = header.closest('[class*="window"]') || header.closest('[class*="chat"]');
                    if (chatWindow) {
                        chatWindow.style.display = 'none';
                    }
                    const launcher = document.querySelector('button[class*="launcher"], .chat-window-toggle');
                    if (launcher) launcher.style.display = 'flex';
                };

                // Attach Events for Hover
                [minimizeBtn, maximizeBtn, closeBtn].forEach(btn => {
                    btn.onmouseover = () => btn.style.background = 'rgba(255, 255, 255, 0.2) !important';
                    btn.onmouseout = () => btn.style.background = 'rgba(255, 255, 255, 0.1) !important';
                });

                // Add buttons to controls
                controlsDiv.appendChild(minimizeBtn);
                controlsDiv.appendChild(maximizeBtn);
                controlsDiv.appendChild(closeBtn);

                // Ensure header has relative positioning
                header.style.position = 'relative';

                // Add controls to header
                header.appendChild(controlsDiv);
                header.dataset.controlsAdded = 'true';
            }
        }

        replaceIcon() {
            // Replace launcher button icon if needed, can be customized via CSS too
        }

        applyCustomStyles() {
            if (!document.getElementById('ivplugin-n8nchat-styles')) {
                const link = document.createElement('link');
                link.id = 'ivplugin-n8nchat-styles';
                link.rel = 'stylesheet';
                link.href = M.cfg.wwwroot + '/mod/interactivevideo/plugins/n8nchat/styles.css';
                document.head.appendChild(link);
            }
        }
    };
});
