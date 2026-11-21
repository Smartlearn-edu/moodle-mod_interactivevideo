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
 * Palette swatch helper for the watermark color picker.
 *
 * @module     mod_interactivevideo/watermarkpicker
 * @copyright  2026 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    /**
     * Normalize a hex color string to #rrggbb lowercase, or null if invalid.
     *
     * @param {string} raw Input color string.
     * @return {string|null} Normalized hex color or null.
     */
    const normalizeHex = function(raw) {
        const val = String(raw || '').trim().toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(val)) {
            return val;
        }
        if (/^[0-9a-f]{6}$/.test(val)) {
            return '#' + val;
        }
        const shortMatch = val.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/);
        if (shortMatch) {
            return '#' + shortMatch[1] + shortMatch[1] + shortMatch[2] + shortMatch[2] + shortMatch[3] + shortMatch[3];
        }
        return null;
    };

    /**
     * Find the enclosing watermark color form group container.
     *
     * @param {HTMLElement} el Element inside the color group.
     * @return {HTMLElement|null} Group container.
     */
    const getGroup = function(el) {
        return el ? el.closest('[data-groupname="watermarkcolorgroup"], .felement[data-fieldtype="group"], .felement') : null;
    };

    const TEXT_INPUT_SELECTOR = 'input[name="watermarkcolor"], .iv-watermark-color-wrap input[type="text"], ' +
        '.iv-watermark-color-input input[type="text"], input.iv-watermark-color-input';

    /**
     * Find the text input inside a color group container.
     *
     * @param {HTMLElement|null} group Enclosing group container.
     * @return {HTMLInputElement|null} Text input element.
     */
    const getTextInput = function(group) {
        return group ? group.querySelector(TEXT_INPUT_SELECTOR) : null;
    };

    /**
     * Synchronize text input, native color picker, and preset swatches.
     *
     * @param {HTMLElement} group Enclosing group container.
     * @param {string} rawColor Color string.
     * @param {string} source Source control ('init'|'swatch'|'native'|'text'|'textblur').
     */
    const syncColorUI = function(group, rawColor, source) {
        if (!group) {
            return;
        }
        const normalized = normalizeHex(rawColor);
        const textInput = getTextInput(group);
        const nativePicker = group.querySelector('.iv-watermark-native-picker');

        if (normalized) {
            if (textInput && source !== 'text' && source !== 'init') {
                textInput.value = normalized;
            }
            if (nativePicker && source !== 'native') {
                nativePicker.value = normalized;
            }
        }

        group.querySelectorAll('.iv-watermark-swatch').forEach(function(btn) {
            const swatchColor = normalizeHex(btn.getAttribute('data-color'));
            btn.classList.toggle('active', Boolean(normalized && swatchColor === normalized));
        });
    };

    /**
     * Sync all watermark color groups currently in the DOM.
     */
    const syncAll = function() {
        document.querySelectorAll(TEXT_INPUT_SELECTOR).forEach(function(input) {
            const group = getGroup(input);
            syncColorUI(group, input.value || '#ffffff', 'init');
        });
    };

    /**
     * Bind delegated listeners for watermark color picker controls and sync initial state.
     */
    const init = function() {
        syncAll();

        if (document.body.dataset.ivWatermarkPickerBound === '1') {
            return;
        }
        document.body.dataset.ivWatermarkPickerBound = '1';

        document.addEventListener('click', function(e) {
            const swatch = e.target.closest('.iv-watermark-swatch');
            if (!swatch) {
                return;
            }
            e.preventDefault();
            const hex = normalizeHex(swatch.getAttribute('data-color'));
            const group = getGroup(swatch);
            const textInput = getTextInput(group);
            if (!group || !textInput || !hex) {
                return;
            }
            syncColorUI(group, hex, 'swatch');
            textInput.dispatchEvent(new Event('input', {bubbles: true}));
            textInput.dispatchEvent(new Event('change', {bubbles: true}));
        });

        const handleControlChange = function(e) {
            const target = e.target;
            if (!target) {
                return;
            }
            if (target.classList && target.classList.contains('iv-watermark-native-picker')) {
                const group = getGroup(target);
                const textInput = getTextInput(group);
                syncColorUI(group, target.value, 'native');
                if (textInput) {
                    textInput.dispatchEvent(new Event(e.type, {bubbles: true}));
                }
            } else if (target.matches && target.matches(TEXT_INPUT_SELECTOR)) {
                const group = getGroup(target);
                syncColorUI(group, target.value, e.type === 'change' ? 'textblur' : 'text');
            }
        };

        document.addEventListener('input', handleControlChange);
        document.addEventListener('change', handleControlChange);
    };

    return {
        init: init,
    };
});
