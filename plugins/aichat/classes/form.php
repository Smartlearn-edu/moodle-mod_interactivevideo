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
 * Class form
 *
 * @package    ivplugin_aichat
 * @copyright  2024 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class form extends \mod_interactivevideo\form\base_form
{
    /**
     * Sets data for dynamic submission
     * @return void
     */
    public function set_data_for_dynamic_submission(): void
    {
        $data = $this->set_data_default();

        // text1 will store the welcome message
        $data->text1 = $this->optional_param('text1', get_string('welcomemessage_default', 'ivplugin_aichat'), PARAM_TEXT);
        // text2 will store the system prompt
        $data->text2 = $this->optional_param('text2', '', PARAM_TEXT);

        $this->set_data($data);
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
        $mform->setDefault('title', get_string('aichatcontent', 'ivplugin_aichat'));
        $mform->addRule('title', get_string('required'), 'required', null, 'client');

        $mform->addElement('textarea', 'text1', '<i class="bi bi-chat-quote iv-mr-2"></i>' . get_string('welcomemessage', 'ivplugin_aichat'), ['rows' => 3]);
        $mform->setType('text1', PARAM_TEXT);
        $mform->addHelpButton('text1', 'welcomemessage', 'ivplugin_aichat');

        $mform->addElement('textarea', 'text2', '<i class="bi bi-cpu iv-mr-2"></i>' . get_string('systemprompt', 'ivplugin_aichat'), ['rows' => 3]);
        $mform->setType('text2', PARAM_TEXT);
        $mform->addHelpButton('text2', 'systemprompt', 'ivplugin_aichat');

        // Allow display options (popup, side, etc.)
        $this->display_options_field('side'); // Default to side panel

        $this->close_form();
    }
}
