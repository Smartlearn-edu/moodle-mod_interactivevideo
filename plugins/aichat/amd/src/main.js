// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Main class for the AI Chat plugin
 *
 * @module     ivplugin_aichat/main
 * @copyright  2024 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import $ from 'jquery';
import Base from 'mod_interactivevideo/type/base';
import { get_string as getString } from 'core/str';

export default class AIChat extends Base {

    /**
     * Called when the content is rendered.
     */
    postContentRender(annotation) {
        this.initChatListeners(annotation);
    }

    /**
     * Initialize listeners for the chat interface
     */
    initChatListeners(annotation) {
        const container = $(`#message[data-id='${annotation.id}']`);
        const sendBtn = container.find('.aichat-send');
        const input = container.find('.aichat-input');
        const messagesArea = container.find('.aichat-messages');

        const sendMessage = async () => {
            const text = input.val().trim();
            if (!text) return;

            // Add User Message
            this.appendMessage(messagesArea, text, 'user');
            input.val('');
            input.prop('disabled', true);
            sendBtn.prop('disabled', true);

            // Add Loading Indicator
            const loadingId = this.appendLoading(messagesArea);

            // Get Context
            const timestamp = await this.player.getCurrentTime();
            const transcript = await this.getTranscriptContext(timestamp);

            // Send to Backend
            $.ajax({
                url: M.cfg.wwwroot + '/mod/interactivevideo/plugins/aichat/ajax.php',
                method: "POST",
                dataType: "json",
                data: {
                    action: 'chat',
                    contextid: M.cfg.contextid,
                    sesskey: M.cfg.sesskey,
                    itemid: annotation.id,
                    question: text,
                    timestamp: timestamp,
                    transcript: transcript
                },
                success: (data) => {
                    this.removeMessage(loadingId);
                    if (data.success) {
                        this.appendMessage(messagesArea, data.response, 'ai');
                    } else {
                        this.appendMessage(messagesArea, M.util.get_string('error_noresponse', 'ivplugin_aichat') + (data.error ? ' (' + data.error + ')' : ''), 'ai text-danger');
                    }
                },
                error: () => {
                    this.removeMessage(loadingId);
                    this.appendMessage(messagesArea, M.util.get_string('error_noresponse', 'ivplugin_aichat'), 'ai text-danger');
                },
                complete: () => {
                    input.prop('disabled', false);
                    sendBtn.prop('disabled', false);
                    input.focus();
                }
            });
        };

        sendBtn.off('click').on('click', sendMessage);
        input.off('keypress').on('keypress', (e) => {
            if (e.which === 13) sendMessage();
        });
    }

    /**
     * Try to extract transcript text from the player's active tracks around the current time.
     */
    async getTranscriptContext(currentTime) {
        // 1. Check if Generic Subtitle Plugin provides data
        if (window.IV && window.IV.subtitle && typeof window.IV.subtitle.getTranscript === 'function') {
            const transcript = window.IV.subtitle.getTranscript(currentTime);
            if (transcript) {
                return transcript;
            }
        }

        // 2. Fallback: Attempt to access text tracks from the HTML5 video element
        let tracks = [];
        let videoElement = null;

        // Try to find the video element in the player container
        const playerNode = document.getElementById('player'); // Standard ID used in other plugins
        if (playerNode && playerNode.tagName === 'VIDEO') {
            videoElement = playerNode;
        } else if (playerNode) {
            videoElement = playerNode.querySelector('video');
        }

        if (videoElement) {
            // Iterate over text tracks
            for (let i = 0; i < videoElement.textTracks.length; i++) {
                let track = videoElement.textTracks[i];
                if (track.mode === 'showing' || track.mode === 'hidden') { // Use active or hidden tracks
                    if (track.cues) {
                        let contextText = [];
                        // Get cues within +/- 30 seconds
                        for (let j = 0; j < track.cues.length; j++) {
                            let cue = track.cues[j];
                            if (cue.endTime >= currentTime - 30 && cue.startTime <= currentTime + 30) {
                                contextText.push(cue.text);
                            }
                        }
                        if (contextText.length > 0) {
                            return contextText.join("\n");
                        }
                    }
                }
            }
        }

        return "";
    }

    appendMessage(container, text, type) {
        const isAi = type === 'ai';
        const icon = isAi ? 'bi-stars text-primary' : 'bi-person-circle text-secondary';
        const bg = isAi ? 'bg-white' : 'bg-primary text-white';
        const align = isAi ? 'align-items-start' : 'align-items-end flex-row-reverse';
        const margin = isAi ? 'me-2' : 'ms-2';

        // Convert simple markdown-like formatting to HTML (basic commonmark)
        if (isAi) {
            // Very simple formatter: bold, code blocks, newlines
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/\n/g, '<br>');
        }

        const html = `
        <div class="aichat-message ${type} mb-3 w-100">
            <div class="d-flex ${align}">
                <i class="bi ${icon} fs-4 ${margin}"></i>
                <div class="${bg} p-2 px-3 rounded shadow-sm" style="max-width: 85%;">
                    ${text}
                </div>
            </div>
        </div>`;

        container.append(html);
        this.scrollToBottom(container);
    }

    appendLoading(container) {
        const id = 'loading-' + Date.now();
        const html = `
        <div id="${id}" class="aichat-message ai mb-3 w-100">
            <div class="d-flex align-items-start">
                <i class="bi bi-stars text-primary fs-4 me-2"></i>
                <div class="bg-white p-2 px-3 rounded shadow-sm">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span class="ms-2 fs-6 text-muted">${M.util.get_string('thinking', 'ivplugin_aichat')}</span>
                </div>
            </div>
        </div>`;
        container.append(html);
        this.scrollToBottom(container);
        return id;
    }

    removeMessage(id) {
        $(`#${id}`).remove();
    }

    scrollToBottom(container) {
        const element = container[0];
        element.scrollTop = element.scrollHeight;
    }
}
