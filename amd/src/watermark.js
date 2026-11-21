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
 * Periodic corner-rotating canvas watermark with anti-tamper protection.
 *
 * @module     mod_interactivevideo/watermark
 * @copyright  2026 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['core/notification', 'core/str'], function(Notification, Str) {
    const VALID_CORNERS = ['tl', 'tr', 'br', 'bl'];
    const SIZE_PRESETS = {
        small: {titlePx: 11, detailPx: 10, lineGap: 13},
        medium: {titlePx: 14, detailPx: 12, lineGap: 16},
        large: {titlePx: 18, detailPx: 15, lineGap: 20},
    };

    /**
     * Format a Date timestamp with server offset as YYYY-MM-DD HH:MM:SS.
     *
     * @param {number} offsetMs Offset between server time and client Date.now().
     * @return {string}
     */
    const formatLiveClock = function(offsetMs) {
        const d = new Date(Date.now() + offsetMs);
        const pad = function(n) {
            return String(n).padStart(2, '0');
        };
        return d.getFullYear() + '-' +
            pad(d.getMonth() + 1) + '-' +
            pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' +
            pad(d.getMinutes()) + ':' +
            pad(d.getSeconds());
    };

    /**
     * Pause active interactive video playback.
     *
     * @param {HTMLElement} wrapper
     */
    const pausePlayback = function(wrapper) {
        if (window.IVPLAYER && typeof window.IVPLAYER.pause === 'function') {
            try {
                window.IVPLAYER.pause();
            } catch (e) {
                // Ignore adapter errors during pause.
            }
        }
        const videos = wrapper ? wrapper.querySelectorAll('video') : [];
        videos.forEach(function(video) {
            if (!video.paused) {
                try {
                    video.pause();
                } catch (e) {
                    // Ignore media errors.
                }
            }
        });
    };

    /**
     * Create a fresh watermark canvas element.
     *
     * @return {HTMLCanvasElement}
     */
    const createCanvas = function() {
        const canvas = document.createElement('canvas');
        canvas.id = 'iv-watermark-canvas';
        canvas.className = 'iv-watermark-canvas position-absolute top-0 start-0 w-100 h-100';
        canvas.setAttribute('aria-hidden', 'true');
        return canvas;
    };

    /**
     * Compute a contrasting shadow color for the given #rrggbb text color.
     *
     * @param {string} hex Hex color in #rrggbb format.
     * @return {string}
     */
    const getShadowColor = function(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.35 ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.85)';
    };

    /**
     * Initialize the periodic corner-rotating watermark on #video-wrapper.
     *
     * @param {Object} config
     * @param {number} config.opacity Opacity between 0.05 and 1.0.
     * @param {string} config.color Text hex color (#rrggbb).
     * @param {number} config.interval Rotation interval in seconds (0 = static).
     * @param {string} config.size Size preset: small, medium, or large.
     * @param {string[]} config.positions Enabled corners from ['tl', 'tr', 'br', 'bl'].
     * @param {string} config.fullname Viewer full name.
     * @param {number|string} config.userid Viewer Moodle user ID.
     * @param {string} config.userhandle Viewer email or username.
     * @param {number} config.servertime Server Unix timestamp in seconds.
     */
    const init = function(config) {
        const wrapper = document.getElementById('video-wrapper');
        if (!wrapper) {
            return;
        }

        const opacity = Math.max(0.05, Math.min(1, parseFloat(config && config.opacity) || 0.35));
        const rawColor = (config && config.color) ? String(config.color).trim() : '#ffffff';
        const color = /^#[0-9a-f]{6}$/i.test(rawColor) ? rawColor : '#ffffff';
        const shadowColor = getShadowColor(color);
        const rawInterval = (config && config.interval !== undefined && config.interval !== null)
            ? parseInt(config.interval, 10)
            : 60;
        const intervalSeconds = isNaN(rawInterval) ? 60 : Math.max(0, rawInterval);
        const sizePreset = SIZE_PRESETS[config && config.size] || SIZE_PRESETS.medium;
        const rawPositions = Array.isArray(config && config.positions) ? config.positions : VALID_CORNERS;
        const positions = rawPositions.filter(function(pos) {
            return VALID_CORNERS.indexOf(pos) !== -1;
        });
        if (positions.length === 0) {
            positions.push('tl', 'tr', 'br', 'bl');
        }

        const fullname = (config && config.fullname) ? String(config.fullname) : '';
        const userid = (config && config.userid !== undefined && config.userid !== null) ? String(config.userid) : '';
        const userhandle = (config && config.userhandle) ? String(config.userhandle) : '';
        const serverOffsetMs = (config && config.servertime)
            ? (Number(config.servertime) * 1000) - Date.now()
            : 0;

        let tamperTitle = 'Security alert';
        let tamperMessage = 'Watermark modification detected. Video playback has been paused.';
        Str.get_strings([
            {key: 'watermarktampertitle', component: 'mod_interactivevideo'},
            {key: 'watermarktamperwarning', component: 'mod_interactivevideo'},
        ]).then(function(strings) {
            if (strings && strings[0]) {
                tamperTitle = strings[0];
            }
            if (strings && strings[1]) {
                tamperMessage = strings[1];
            }
        }).catch(function() {
            // Keep English fallback strings.
        });

        let canvas = document.getElementById('iv-watermark-canvas');
        if (!canvas || canvas.parentElement !== wrapper) {
            canvas = createCanvas();
            wrapper.appendChild(canvas);
        }

        let ctx = canvas.getContext('2d');
        let cornerIndex = 0;
        let lastAlertAt = 0;
        let isRestoring = false;

        const drawWatermark = function() {
            if (!ctx || !canvas.width || !canvas.height) {
                return;
            }

            const scale = canvas.width < 400 ? Math.max(0.75, canvas.width / 400) : 1;
            const titlePx = Math.round(sizePreset.titlePx * scale);
            const detailPx = Math.round(sizePreset.detailPx * scale);
            const lineGap = Math.round(sizePreset.lineGap * scale);

            const corner = positions[cornerIndex % positions.length];
            const isRight = corner === 'tr' || corner === 'br';
            const isBottom = corner === 'bl' || corner === 'br';

            const padX = 18;
            const padTop = 18;
            const padBottom = 24;

            const line1 = fullname;
            const line2 = 'ID: ' + userid + (userhandle ? ' | ' + userhandle : '');
            const line3 = formatLiveClock(serverOffsetMs);

            const x = isRight ? Math.max(padX, canvas.width - padX) : padX;
            const y = isBottom
                ? Math.max(padTop + titlePx, canvas.height - padBottom - (lineGap * 2))
                : padTop + titlePx;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 4;
            ctx.textAlign = isRight ? 'right' : 'left';
            ctx.textBaseline = 'alphabetic';

            ctx.font = 'bold ' + titlePx + 'px sans-serif';
            ctx.fillText(line1, x, y);
            ctx.font = detailPx + 'px sans-serif';
            ctx.fillText(line2, x, y + lineGap);
            ctx.fillText(line3, x, y + (lineGap * 2));
            ctx.restore();
        };

        const syncSize = function() {
            if (!canvas) {
                return;
            }
            const rect = wrapper.getBoundingClientRect();
            const w = Math.max(1, Math.round(rect.width || wrapper.clientWidth || 1280));
            const h = Math.max(1, Math.round(rect.height || wrapper.clientHeight || 720));
            if (canvas.width !== w || canvas.height !== h) {
                isRestoring = true;
                canvas.width = w;
                canvas.height = h;
                isRestoring = false;
            }
            drawWatermark();
        };

        const triggerTamperAlert = function() {
            const now = Date.now();
            if (now - lastAlertAt < 3000) {
                return;
            }
            lastAlertAt = now;
            Notification.alert(tamperTitle, tamperMessage);
        };

        const repairCanvas = function() {
            isRestoring = true;
            try {
                let current = document.getElementById('iv-watermark-canvas');
                if (!current || current.parentElement !== wrapper || current.tagName !== 'CANVAS') {
                    if (current && current.parentElement) {
                        current.parentElement.removeChild(current);
                    }
                    canvas = createCanvas();
                    wrapper.appendChild(canvas);
                    ctx = canvas.getContext('2d');
                } else {
                    canvas = current;
                    canvas.removeAttribute('style');
                    canvas.className = 'iv-watermark-canvas position-absolute top-0 start-0 w-100 h-100';
                }
            } finally {
                isRestoring = false;
            }
            syncSize();
        };

        const checkIntegrity = function() {
            if (isRestoring) {
                return;
            }
            const current = document.getElementById('iv-watermark-canvas');
            if (!current || current !== canvas || current.parentElement !== wrapper || !document.body.contains(current)) {
                pausePlayback(wrapper);
                triggerTamperAlert();
                repairCanvas();
                return;
            }

            const style = window.getComputedStyle(current);
            const zIndex = parseInt(style.zIndex, 10);
            const wrapperRect = wrapper.getBoundingClientRect();
            const canvasRect = current.getBoundingClientRect();
            const shrunk = wrapperRect.width > 50 && wrapperRect.height > 50 &&
                (canvasRect.width < wrapperRect.width * 0.5 || canvasRect.height < wrapperRect.height * 0.5);

            if (style.display === 'none' ||
                style.visibility === 'hidden' ||
                parseFloat(style.opacity) < 0.5 ||
                (!isNaN(zIndex) && zIndex < 10) ||
                shrunk) {
                pausePlayback(wrapper);
                triggerTamperAlert();
                repairCanvas();
            }
        };

        syncSize();
        if (typeof window.ResizeObserver === 'function') {
            const resizeObserver = new window.ResizeObserver(function() {
                syncSize();
            });
            resizeObserver.observe(wrapper);
        }
        window.addEventListener('resize', syncSize);
        document.addEventListener('fullscreenchange', syncSize);

        const mutationObserver = new MutationObserver(function(mutations) {
            if (isRestoring) {
                return;
            }
            let shouldCheck = false;
            mutations.forEach(function(mutation) {
                if (mutation.target === canvas) {
                    shouldCheck = true;
                } else if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach(function(node) {
                        if (node === canvas || (node.contains && node.contains(canvas))) {
                            shouldCheck = true;
                        }
                    });
                }
            });
            if (shouldCheck) {
                checkIntegrity();
            }
        });

        mutationObserver.observe(wrapper, {
            childList: true,
            attributes: true,
            attributeFilter: ['id', 'style', 'class', 'hidden', 'width', 'height'],
            subtree: true,
        });

        const clockTimer = window.setInterval(drawWatermark, 1000);
        const integrityTimer = window.setInterval(checkIntegrity, 1500);
        let rotateTimer = null;
        if (intervalSeconds > 0 && positions.length > 1) {
            rotateTimer = window.setInterval(function() {
                cornerIndex = (cornerIndex + 1) % positions.length;
                drawWatermark();
            }, intervalSeconds * 1000);
        }

        window.addEventListener('beforeunload', function() {
            window.clearInterval(clockTimer);
            window.clearInterval(integrityTimer);
            if (rotateTimer !== null) {
                window.clearInterval(rotateTimer);
            }
        });
    };

    return {
        init: init,
    };
});
