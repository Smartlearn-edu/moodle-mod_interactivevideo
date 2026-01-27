
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

            // Find the container created by classes/main.php (get_content)
            // It is usually wrapped by the Interactive Video module in a div with specific positioning classes (popup, drawer, etc.)
            // We look for our placeholder inside the annotation's unique container.
            const placeholderSelector = `.ivplugin-n8nchat-placeholder`;
            const $container = $(`div[data-id="${annotation.id}"]`).find(placeholderSelector);

            if ($container.length === 0) {
                console.error('n8n Chat: Container not found for annotation', annotation.id);
                return;
            }

            // Extract context data from data attributes
            const sectionName = $container.data('defaults-section') || '';
            const activityName = $container.data('defaults-activity') || '';
            const cmid = $container.data('defaults-cmid') || '';

            // Get current video time (if player is available)
            let currentVideoTime = 0;
            if (this.player && typeof this.player.getCurrentTime === 'function') {
                currentVideoTime = await this.player.getCurrentTime();
            }

            // Generate a unique ID for the target element *inside* our placeholder
            const targetId = 'n8n-chat-target-' + annotation.id;
            // Clear placeholder content and set the ID
            $container.html(`<div id="${targetId}" style="width: 100%; height: 100%; min-height: 400px; position: relative;"></div>`);

            // Inject n8n chat styles from CDN
            const cssId = 'n8n-chat-css-' + annotation.id;
            if (!document.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
                document.head.appendChild(link);
            }

            try {
                const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
                const createChat = module.createChat;

                const courseId = M.cfg.courseId;
                const userId = M.cfg.userId || 'guest';
                let effectiveCourseId = courseId;
                if (!effectiveCourseId) {
                    const urlParams = new URLSearchParams(window.location.search);
                    effectiveCourseId = urlParams.get('id');
                }

                // Robust title handling
                let chatTitle = 'AI Assistant';
                if (annotation.title && annotation.title !== 'null') {
                    chatTitle = annotation.title;
                }

                createChat({
                    webhookUrl: webhookUrl,
                    mode: 'fullscreen', // We use fullscreen relative to the TARGET container
                    chatInputKey: 'chatInput',
                    chatSessionKey: 'sessionId_iv_' + annotation.id,
                    loadPreviousSession: true,
                    showWelcomeScreen: true,
                    title: chatTitle,
                    initialMessages: [
                        welcomeMessage
                    ],
                    onSessionStart: () => {
                        // Optional: Handle session start
                    },
                    defaultLanguage: 'en',
                    metadata: {
                        userId: userId,
                        source: 'moodle_interactivevideo',
                        annotationId: annotation.id,
                        courseId: effectiveCourseId,
                        pageUrl: window.location.href,
                        timestamp: new Date().toISOString(),
                        sectionName: sectionName,
                        activityName: activityName,
                        activityId: cmid, // Interactive Video ID (CMID)
                        currentVideoTime: currentVideoTime
                    },
                    target: '#' + targetId
                });

                console.log('n8n Chat loaded for IV Annotation', annotation.id);

                // Inject styles to ensure the widget fills the container but doesn't overflow fixed
                // We scope it to the target ID
                const styleId = 'n8n-chat-style-' + annotation.id;
                if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = `
                        #${targetId} .n8n-chat-widget,
                        #${targetId} .chat-window {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            width: 100% !important;
                            height: 100% !important;
                            border-radius: 0 !important; 
                            box-shadow: none !important;
                            z-index: 1 !important;
                        }
                    `;
                    document.head.appendChild(style);
                }

            } catch (error) {
                console.error('Error loading n8n chat widget:', error);
            }
        }
    };
});
