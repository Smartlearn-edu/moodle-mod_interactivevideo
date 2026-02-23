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

        // Load existing content
        if (!empty($data->contentform)) {
            $data->subtitletext = $data->contentform;
        }

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

        // Map subtitletext to content
        $fromform->content = $fromform->subtitletext;

        if ($fromform->id > 0) {
            $fromform->timemodified = time();
            $DB->update_record('interactivevideo_items', $fromform);
        } else {
            $fromform->timecreated = time();
            $fromform->timemodified = $fromform->timecreated;
            $fromform->id = $DB->insert_record('interactivevideo_items', $fromform);
        }

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

        // Text Area for Subtitle Content (VTT/SRT)
        $mform->addElement(
            'textarea',
            'subtitletext',
            get_string('subtitlecontent', 'ivplugin_subtitle'),
            ['rows' => 10, 'class' => 'w-100']
        );
        $mform->setType('subtitletext', PARAM_RAW);
        $mform->addRule('subtitletext', get_string('required'), 'required', null, 'client');
        $mform->addHelpButton('subtitletext', 'subtitlecontent', 'ivplugin_subtitle');

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
