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

use context_module;

/**
 * Subplugin form definition
 *
 * @package    ivplugin_subtitle
 * @copyright  2024 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ivmform
{

    /**
     * Defines forms elements
     *
     * @param \MoodleQuickForm $mform
     * @param \stdClass $current
     * @return bool
     */
    public static function definition($mform, $current)
    {
        $mform->addElement(
            'filemanager',
            'subtitles',
            get_string('uploadsubtitles', 'ivplugin_subtitle'),
            null,
            ['subdirs' => 0, 'maxbytes' => 0, 'maxfiles' => 5, 'accepted_types' => ['.vtt', '.srt']]
        );
        $mform->addHelpButton('subtitles', 'subtitles', 'ivplugin_subtitle');
        return true;
    }

    /**
     * Prepare data before applying to populating form.
     *
     * @param array $defaultvalues
     * @param string $suffix
     */
    public static function data_preprocessing(&$defaultvalues, $suffix = '')
    {
        $draftitemid = \file_get_submitted_draft_itemid('subtitles');
        $context = context_module::instance($defaultvalues['coursemodule']);

        \file_prepare_draft_area(
            $draftitemid,
            $context->id,
            'mod_interactivevideo',
            'subtitles',
            0,
            ['subdirs' => 0, 'maxfiles' => 5],
            null
        );
        $defaultvalues['subtitles'] = $draftitemid;
    }

    /**
     * Saves subplugin instance data.
     *
     * @param \stdClass $moduleinstance
     * @param \mod_interactivevideo_mod_form $mform
     * @param \context_module $context
     */
    public static function add_instance($moduleinstance, $mform, $context)
    {
        self::save_files($moduleinstance, $context);
    }

    /**
     * Updates subplugin instance data.
     *
     * @param \stdClass $moduleinstance
     * @param \mod_interactivevideo_mod_form $mform
     * @param \context_module $context
     */
    public static function update_instance($moduleinstance, $mform, $context)
    {
        self::save_files($moduleinstance, $context);
    }

    /**
     * Deletes subplugin instance data.
     *
     * @param \stdClass $moduleinstance
     * @param \stdClass $cm
     */
    public static function delete_instance($moduleinstance, $cm)
    {
        $context = context_module::instance($cm->id);
        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'mod_interactivevideo', 'subtitles');
    }

    /**
     * Helper to save files from draft area
     *
     * @param \stdClass $moduleinstance
     * @param \context_module $context
     */
    private static function save_files($moduleinstance, $context)
    {
        if (isset($moduleinstance->subtitles)) {
            file_save_draft_area_files(
                $moduleinstance->subtitles,
                $context->id,
                'mod_interactivevideo',
                'subtitles',
                0
            );
        }
    }

    /**
     * Get tracks for the player
     *
     * @param \stdClass $cm
     * @param \context_module $context
     * @return array
     */
    public static function get_tracks($cm, $context)
    {
        $fs = get_file_storage();
        $files = $fs->get_area_files($context->id, 'mod_interactivevideo', 'subtitles', 0, 'sortorder, itemid, filepath, filename', false);
        $tracks = [];
        foreach ($files as $file) {
            $url = \moodle_url::make_pluginfile_url(
                $file->get_contextid(),
                $file->get_component(),
                $file->get_filearea(),
                $file->get_itemid(),
                $file->get_filepath(),
                $file->get_filename()
            );
            $lang = 'en'; // Default or extracted from filename? Simple default for now.
            // Try to guess lang from filename e.g. "en.vtt", "fr-captions.vtt"
            if (preg_match('/([a-z]{2})/', $file->get_filename(), $matches)) {
                $lang = $matches[1];
            }

            $tracks[] = [
                'src' => $url->out(),
                'srclang' => $lang,
                'label' => $file->get_filename(),
                'kind' => 'subtitles',
            ];
        }
        return $tracks;
    }
}
