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
 * Class form
 *
 * @package    ivplugin_subtitle
 * @copyright  2024 Antigravity
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
// Initialized form for subtitle plugin
class form extends \mod_interactivevideo\form\base_form
{
    /**
     * Sets data for dynamic submission
     * @return void
     */
    public function set_data_for_dynamic_submission(): void
    {
        $data = $this->set_data_default();

        $draftitemid = file_get_submitted_draft_itemid('subtitlefile');

        file_prepare_draft_area(
            $draftitemid,
            $data->contextid,
            'mod_interactivevideo',
            'content',
            $data->id,
            ['subdirs' => 0, 'maxfiles' => 1]
        );

        $data->subtitlefile = $draftitemid;

        // Restore other fields
        $data->intg1 = $data->intg1 ?? 0;

        $this->set_data($data);
    }

    /**
     * Process dynamic submission
     *
     * @return void
     */
    public function process_dynamic_submission()
    {
        global $DB;
        $fromform = $this->get_data();
        $fromform = $this->pre_processing_data($fromform);
        $fromform->advanced = $this->process_advanced_settings($fromform);

        if ($fromform->id > 0) {
            $fromform->timemodified = time();
            $DB->update_record('interactivevideo_items', $fromform);
        } else {
            $fromform->timecreated = time();
            $fromform->timemodified = $fromform->timecreated;
            $fromform->id = $DB->insert_record('interactivevideo_items', $fromform);
        }

        // Save file
        $draftitemid = file_get_submitted_draft_itemid('subtitlefile');
        file_save_draft_area_files(
            $draftitemid,
            $fromform->contextid,
            'mod_interactivevideo',
            'content',
            $fromform->id,
            ['subdirs' => 0, 'maxfiles' => 1]
        );

        // We update the record again just to be safe, though not strictly necessary if no new fields added
        $DB->update_record('interactivevideo_items', $fromform);

        return $fromform;
    }

    /**
     * Form definition
     *
     * @return void
     */
    public function definition()
    {
        $mform = &$this->_form;

        $this->standard_elements();

        $mform->addElement('text', 'title', '<i class="bi bi-quote iv-mr-2"></i>' . get_string('title', 'mod_interactivevideo'));
        $mform->setType('title', PARAM_TEXT);
        $mform->setDefault('title', 'Subtitle');
        $mform->addRule('title', get_string('required'), 'required', null, 'client');

        // File Manager for Subtitle
        $mform->addElement(
            'filemanager',
            'subtitlefile',
            get_string('uploadfile', 'ivplugin_subtitle'),
            null,
            ['subdirs' => 0, 'maxbytes' => 1048576, 'maxfiles' => 1, 'accepted_types' => ['.vtt', '.srt']]
        );

        // Toggle for showing subtitle
        $mform->addElement('selectyesno', 'intg1', get_string('showsubtitle', 'ivplugin_subtitle'));
        $mform->setDefault('intg1', 1);

        $this->display_options_field();
        $this->advanced_form_fields([
            'hascompletion' => false,
        ]);
        $this->close_form();
    }
}
