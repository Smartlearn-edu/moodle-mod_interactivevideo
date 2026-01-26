<?php
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

namespace ivplugin_aichat;

/**
 * Class main
 *
 * @package    ivplugin_aichat
 * @copyright  2024 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class main extends \ivplugin_richtext\main
{
    /**
     * Get the property.
     */
    public function get_property()
    {
        return [
            'name' => 'aichat',
            'icon' => 'bi bi-stars',
            'title' => get_string('aichatcontent', 'ivplugin_aichat'),
            'amdmodule' => 'ivplugin_aichat/main',
            'class' => 'ivplugin_aichat\\main',
            'form' => 'ivplugin_aichat\\form',
            'hascompletion' => false,
            'hastimestamp' => true,
            'description' => get_string('aichatdescription', 'ivplugin_aichat'),
            'author' => 'Antigravity',
        ];
    }

    /**
     * Get the content.
     *
     * @param array $arg The arguments.
     * @return string The content.
     */
    public function get_content($arg)
    {
        // We render a placeholder container.
        // The actual chat UI will be built by JS or a mustache template
        // But for simplicity, we can output the HTML structure here.

        $welcomemessage = !empty($arg['text1']) ? $arg['text1'] : get_string('welcomemessage_default', 'ivplugin_aichat');

        $content = '
        <div class="aichat-container d-flex flex-column h-100" style="min-height: 400px; max-height: 80vh;">
            <div class="aichat-messages flex-grow-1 overflow-auto p-3 bg-light border rounded mb-2" style="font-size: 0.95rem;">
                <div class="aichat-message ai mb-3">
                    <div class="d-flex align-items-start">
                        <i class="bi bi-stars text-primary fs-4 me-2"></i>
                        <div class="bg-white p-2 px-3 rounded shadow-sm" style="max-width: 85%;">
                            ' . htmlspecialchars($welcomemessage) . '
                        </div>
                    </div>
                </div>
            </div>
            <div class="aichat-input-area d-flex gap-2">
                <input type="text" class="form-control aichat-input" placeholder="' . get_string('typeyourquestion', 'ivplugin_aichat') . '">
                <button class="btn btn-primary aichat-send">
                    <i class="bi bi-send"></i>
                </button>
            </div>
        </div>';

        return $content;
    }
}
