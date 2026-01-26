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

namespace ivplugin_subtitle;

/**
 * Class main
 *
 * @package    ivplugin_subtitle
 * @copyright  2024 Antigravity
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class main
{
    /**
     * Constructor.
     */
    public function __construct() {}

    /**
     * Check if the subtitle can be used.
     * @return bool True if the subtitle can be used, false otherwise.
     */
    public function can_used()
    {
        return true;
    }

    /**
     * Returns the property of the subtitle type
     * @return array
     */
    public function get_property()
    {
        return [
            'name' => 'subtitle',
            'title' => get_string('subtitlecontent', 'ivplugin_subtitle'),
            'icon' => 'bi bi-card-text',
            'amdmodule' => 'ivplugin_subtitle/main',
            'class' => 'ivplugin_subtitle\\main',
            'form' => 'ivplugin_subtitle\\form',
            'hascompletion' => false,
            'hastimestamp' => true,
            'allowmultiple' => true,
            'hasreport' => false,
            'description' => get_string('subtitledescription', 'ivplugin_subtitle'),
            'author' => 'Antigravity',
            'preloadstrings' => true,
        ];
    }

    /**
     * Get the content.
     * @param array $arg The arguments.
     * @return string The content.
     */
    public function get_content($arg)
    {
        $content = isset($arg['content']) ? $arg['content'] : '';
        $id = $arg["id"];

        $showsubtitle = isset($arg['intg1']) && $arg['intg1'] == 1;

        // We embed the raw content in a data attribute
        // encoding it to be safe for HTML attribute
        $encodedContent = base64_encode($content);

        $html = '<div class="ivplugin-subtitle-container ' . ($showsubtitle ? '' : 'd-none') . '" 
                        data-subtitle-content="' . $encodedContent . '" 
                        data-show-subtitle="' . ($showsubtitle ? '1' : '0') . '">
                        <div class="subtitle-text p-2 text-center bg-dark text-white opacity-75 rounded">
                            <span class="iv-subtitle-current-text">...</span>
                        </div>
                    </div>';

        return $html;
    }

    /**
     * Copies interactive video data from one course module to another.
     *
     * @param int $fromcourse The ID of the source course.
     * @param int $tocourse The ID of the destination course.
     * @param int $fromcm The ID of the source course module.
     * @param int $tocm The ID of the destination course module.
     * @param mixed $annotation Additional annotation or metadata for the copy process.
     * @param int $oldcontextid The ID of the old context.
     * @return mixed
     */
    public function copy($fromcourse, $tocourse, $fromcm, $tocm, $annotation, $oldcontextid)
    {
        // No special file copying needed since we store data in content field
        return $annotation;
    }

    /**
     * Get the content type.
     * @return string The content type.
     */
    public function get_content_type()
    {
        return $this->get_property()['name'];
    }

    /**
     * Get the icon.
     * @return string The icon.
     */
    public function get_icon()
    {
        return $this->get_property()['icon'] ?? '';
    }

    /**
     * Get the title.
     * @return string The title.
     */
    public function get_title()
    {
        return $this->get_property()['title'] ?? '';
    }
}
