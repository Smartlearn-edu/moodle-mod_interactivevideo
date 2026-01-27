
/**
 * Main class for the Subtitle plugin
 *
 * @module     ivplugin_subtitle/main
 * @copyright  2024 Antigravity
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import $ from 'jquery';
import Base from 'mod_interactivevideo/type/base';
import { dispatchEvent } from 'core/event_dispatcher';

export default class Subtitle extends Base {

    /**
     * Initialize the subtitle functionality.
     */
    async init() {
        // Find the subtitle annotation(s)
        const subtitleAnnotations = this.annotations.filter(x => x.type === 'subtitle');
        if (!subtitleAnnotations.length) {
            return;
        }

        // We assume there's one active subtitle track we care about, or we handle the first one.
        const annotation = subtitleAnnotations[0];

        // 1. Fetch the content to get the File URL
        // We use the Base class's render method which fetches via ajax/fragment
        let htmlContent = '';
        try {
            htmlContent = await this.render(annotation);
        } catch (e) {
            console.error("Failed to render subtitle content:", e);
            return;
        }

        const $content = $(htmlContent);
        // If it's wrapped in other divs, we need to find our container
        const $container = $content.is('.ivplugin-subtitle-container') ? $content : $content.find('.ivplugin-subtitle-container');

        const fileUrl = $container.attr('data-subtitle-url');
        const showSubtitle = $container.attr('data-show-subtitle') === '1';

        if (!fileUrl) {
            return;
        }

        // 2. Fetch and Parse the VTT file
        try {
            const response = await fetch(fileUrl);
            const text = await response.text();
            this.cues = this.parseVTT(text);

            // Expose globally
            window.IV = window.IV || {};
            window.IV.subtitle = {
                current: null,
                all: this.cues,
                getTranscript: (timestamp) => this.getTranscript(timestamp),
                getFullTranscript: () => text
            };

            // Dispatch event saying subtitles are ready
            dispatchEvent('iv:subtitle:ready', { cues: this.cues });

        } catch (e) {
            console.error("Failed to fetch or parse subtitle file:", e);
            return;
        }

        // 3. Setup UI if needed
        let outputContainer = null;
        if (showSubtitle) {
            // Check if we need to append a container below the video
            // We'll trust the parent layout or append to a known area if 'showSubtitle' is strictly enabled via our simple UI logic
            // The `main.php` outputted a div, but that dives "inside" the annotation viewer only when it's rendered/clicked.
            // We want it persistent.

            // We will append a persistent container to the video wrapper if it doesn't exist
            // OR we use the fact that this annotation might be "rendered" somewhere?
            // Actually, best to just inject into the video container for overlay or below it.
            // Let's inject below the video-wrapper for now, or inside it.
            if ($('#iv-subtitle-display').length === 0) {
                $('#video-wrapper').append('<div id="iv-subtitle-display" class="text-center p-2 mt-2" style="position: absolute; bottom: 50px; width: 100%; pointer-events: none; z-index: 99;"></div>');
            }
            outputContainer = $('#iv-subtitle-display');
        }

        // 4. Start Time Loop
        // We hook into the player time updates.
        // Since we don't want to modify parent, we can try to intercept events or just poll.
        // InteractiveVideo doesn't always broadcast timeUpdate globally.
        // But we have `this.player`.

        const updateSubtitle = async () => {
            const time = await this.player.getCurrentTime();
            const activeCue = this.cues.find(cue => time >= cue.start && time <= cue.end);

            const currentText = activeCue ? activeCue.text : '';

            // Update global state
            if (window.IV.subtitle.current !== currentText) {
                window.IV.subtitle.current = currentText;
                dispatchEvent('iv:subtitle:change', { text: currentText, time: time });

                if (outputContainer) {
                    if (currentText) {
                        outputContainer.html(`<span class="d-inline-block bg-dark text-white opacity-75 px-2 py-1 rounded small">${currentText}</span>`);
                        outputContainer.show();
                    } else {
                        outputContainer.hide();
                    }
                }
            }
        };

        // Try to bind to player events if possible, otherwise poll
        // Most IV players (videojs etc) support 'timeupdate' check via wrapper?
        // The IV `player` object in `amd/src/player/*` usually doesn't expose `on` directly for all types consistently?
        // But standard HTML5 does.
        // Let's use a safe polling fall-back which is robust. 
        setInterval(updateSubtitle, 250);
    }

    /**
     * Simple VTT parser
     * @param {string} vttText 
     * @returns {Array} Array of cue objects {start, end, text}
     */
    parseVTT(vttText) {
        const lines = vttText.trim().split(/\r?\n/);
        const cues = [];
        let currentCue = null;

        const timeToSeconds = (timeStr) => {
            const parts = timeStr.split(':');
            let hours = 0, minutes = 0, seconds = 0, ms = 0;

            if (parts.length === 3) {
                hours = parseInt(parts[0], 10);
                minutes = parseInt(parts[1], 10);
                seconds = parseFloat(parts[2]); // handles seconds.ms
            } else if (parts.length === 2) {
                minutes = parseInt(parts[0], 10);
                seconds = parseFloat(parts[1]);
            }

            return (hours * 3600) + (minutes * 60) + seconds;
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "WEBVTT" || line === "") continue;

            // Time line: 00:00:00.000 --> 00:00:05.000
            if (line.includes('-->')) {
                const times = line.split('-->');
                if (times.length === 2) {
                    currentCue = {
                        start: timeToSeconds(times[0].trim()),
                        end: timeToSeconds(times[1].trim()),
                        text: []
                    };
                    cues.push(currentCue);
                }
            } else if (currentCue) {
                // Text line
                currentCue.text.push(line);
            }
        }

        // Flatten text arrays
        cues.forEach(cue => {
            cue.text = cue.text.join(' ').replace(/<[^>]*>/g, '');
        });

        return cues;
    }

    /**
     * Public helper to get transcript around a timestamp
     */
    getTranscript(timestamp) {
        // Return 30 seconds context
        if (!this.cues) return '';
        const context = this.cues.filter(cue =>
            (cue.start >= timestamp - 30) && (cue.end <= timestamp + 30)
        );
        return context.map(c => c.text).join(' ');
    }

    /**
     * Run the interaction (required override).
     * We don't do much here as we are a background worker mainly.
     */
    runInteraction(annotation) {
        // If we are visible, maybe show a modal?
        // But for subtitle, we usually just want to run in background.
        // We override to prevent default blocking behavior if any.
        super.runInteraction(annotation);
    }
}
