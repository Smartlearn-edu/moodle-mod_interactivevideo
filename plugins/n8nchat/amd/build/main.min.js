
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
            const webhookUrl = annotation.text1;
            const welcomeMessage = annotation.text2 || 'Welcome! How can I assist you today?';
            const containerId = 'n8n-chat-wrapper-' + annotation.id;

            try {
                // Dynamically import the n8n chat bundle
                const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
                const createChat = module.createChat;

                const courseId = M.cfg.courseId;
                const userId = M.cfg.userId || 'guest';
                let effectiveCourseId = courseId;
                if (!effectiveCourseId) {
                    const urlParams = new URLSearchParams(window.location.search);
                    effectiveCourseId = urlParams.get('id');
                }

                // Create a dedicated wrapper with STRICT sizing
                if (!document.getElementById(containerId)) {
                    const wrapper = document.createElement('div');
                    wrapper.id = containerId;
                    wrapper.style.cssText = `
                        position: fixed !important;
                        bottom: 80px !important;
                        right: 20px !important;
                        width: 400px !important;
                        height: 600px !important;
                        max-width: 90vw !important;
                        max-height: 80vh !important;
                        z-index: 99999 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        pointer-events: none; /* Let events pass through transparency, but children will re-enable */
                    `;
                    document.body.appendChild(wrapper);
                }

                createChat({
                    webhookUrl: webhookUrl,
                    mode: 'window',
                    chatInputKey: 'chatInput',
                    chatSessionKey: 'sessionId_iv_' + annotation.id,
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
                    target: '#' + containerId
                });

                console.log('n8n Chat loaded for IV Annotation', annotation.id);

                // Add window controls and customization
                this.addWindowControls(containerId);
                this.applyCustomStyles();

                // Ensure wrapper content has pointer events
                const wrapper = document.getElementById(containerId);
                if (wrapper) {
                    const children = wrapper.children;
                    for (let child of children) {
                        child.style.pointerEvents = 'auto';
                    }
                }

                // Monitor DOM
                const observer = new MutationObserver(() => {
                    this.addWindowControls(containerId);
                    // Re-assert pointer events on new children
                    const wrapper = document.getElementById(containerId);
                    if (wrapper) {
                        const children = wrapper.children;
                        for (let child of children) {
                            child.style.pointerEvents = 'auto';
                        }
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

            } catch (error) {
                console.error('Error loading n8n chat widget:', error);
            }
        }

        addWindowControls(containerId) {
            // Find header WITHIN our container if possible, or broadly if needed
            const wrapper = document.getElementById(containerId);
            if (!wrapper) return;

            // Try to find the chat root inside the wrapper
            // The widget likely appends itself inside the target

            const selectors = [
                'div[class*="Header"]',
                '.chat-header',
                '[class*="chat-header"]',
                'div[class*="header"]',
                'header'
            ];

            let header = null;
            // First look strictly inside wrapper
            for (const selector of selectors) {
                const elements = wrapper.querySelectorAll(selector);
                if (elements.length > 0) {
                    header = elements[0];
                    break;
                }
            }

            if (header && !header.dataset.controlsAdded) {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'window-controls';
                controlsDiv.style.cssText = `
                    display: flex !important;
                    gap: 8px !important;
                    margin-left: auto !important;
                    z-index: 10000 !important;
                    position: absolute !important;
                    right: 16px !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    pointer-events: auto !important;
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
                    // Toggle visibility of the WRAPPER instead of internal classes
                    if (wrapper.style.height === '50px') {
                        // Restore
                        wrapper.style.height = '600px';
                        wrapper.style.overflow = 'visible';
                        minimizeBtn.innerHTML = '−';
                    } else {
                        // Minimize
                        wrapper.style.height = '50px';
                        wrapper.style.overflow = 'hidden';
                        minimizeBtn.innerHTML = '+';
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
                    wrapper.style.display = 'none';
                    // Attempt to show launcher if it exists, though in this mode we might not have one externally
                };

                [minimizeBtn, closeBtn].forEach(btn => {
                    btn.onmouseover = () => btn.style.background = 'rgba(255, 255, 255, 0.2) !important';
                    btn.onmouseout = () => btn.style.background = 'rgba(255, 255, 255, 0.1) !important';
                });

                controlsDiv.appendChild(minimizeBtn);
                controlsDiv.appendChild(closeBtn);

                header.style.position = 'relative';
                header.appendChild(controlsDiv);
                header.dataset.controlsAdded = 'true';
            }
        }

        replaceIcon() {
            // Optional icon replacement
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
