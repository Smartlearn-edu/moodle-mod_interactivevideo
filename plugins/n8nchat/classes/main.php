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

namespace ivplugin_n8nchat;

/**
 * Class main
 *
 * @package    ivplugin_n8nchat
 * @copyright  2024 Antigravity
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
            'name' => 'n8nchat',
            'icon' => 'bi bi-robot',
            'title' => get_string('pluginname', 'ivplugin_n8nchat'),
            'amdmodule' => 'ivplugin_n8nchat/main',
            'class' => 'ivplugin_n8nchat\\main',
            'form' => 'ivplugin_n8nchat\\form',
            'hascompletion' => false,
            'hastimestamp' => false, // n8n handles its own time logic usually, or we can enable if we want to tie it to a marker
            'description' => get_string('pluginname', 'ivplugin_n8nchat') . ' Integration',
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
        global $PAGE, $DB;

        // Default values
        $sectionName = '';
        $activityName = '';
        $cmid = 0;

        if (isset($PAGE->cm->id)) {
            $cmid = $PAGE->cm->id;
            // Try to get section name
            $modinfo = get_fast_modinfo($PAGE->course);
            $cm = $modinfo->get_cm($cmid);
            if ($cm) {
                $activityName = $cm->name;
                $section = $modinfo->get_section_info($cm->sectionnum);
                $sectionName = $section->name ?? '';
                if (!$sectionName && $section->section == 0) {
                    $sectionName = get_string('general');
                }
            }
        }

        // We render a minimal placeholder because the JS will append the chat widget to the body.
        // However, the editor needs something to "see", and we treat this as the data transport.
        return '<div class="ivplugin-n8nchat-placeholder d-flex align-items-center justify-content-center p-3 border rounded bg-light text-muted"
                     data-defaults-section="' . s($sectionName) . '"
                     data-defaults-activity="' . s($activityName) . '"
                     data-defaults-cmid="' . s($cmid) . '">
                    <i class="bi bi-robot fs-1 me-2"></i>
                    <div>
                        <strong>' . get_string('pluginname', 'ivplugin_n8nchat') . '</strong><br>
                        <small>Chat widget will appear here during playback.</small>
                    </div>
                </div>';
    }
}
