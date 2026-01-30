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
 * Form for adding/editing a n8n Chat annotation.
 *
 * @package    ivplugin_n8nchat
 * @copyright  2024 Antigravity
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

        // text1 = webhookurl
        $data->text1 = $this->optional_param('text1', '', \PARAM_URL);
        // text2 = welcomemessage
        $data->text2 = $this->optional_param('text2', \get_string('welcomemessage_default', 'ivplugin_n8nchat'), \PARAM_TEXT);

        $this->set_data($data);
    }

    /**
     * Define the form fields
     */
    public function definition()
    {
        $mform = $this->_form;

        // Add standard elements (time, duration, etc.)
        $this->standard_elements();

        // Header
        $mform->addElement('header', 'general', \get_string('pluginname', 'ivplugin_n8nchat'));

        // Title
        $mform->addElement('text', 'title', \get_string('title', 'mod_interactivevideo'));
        $mform->setType('title', \PARAM_TEXT);
        $mform->addRule('title', null, 'required', null, 'client');
        $mform->setDefault('title', 'Chat With Video');

        // Webhook URL (mapped to text1 for storage)
        $mform->addElement('text', 'text1', \get_string('webhookurl', 'ivplugin_n8nchat'));
        $mform->setType('text1', \PARAM_URL);
        $mform->addRule('text1', null, 'required', null, 'client');
        $mform->addHelpButton('text1', 'webhookurl', 'ivplugin_n8nchat');

        // Welcome Message (mapped to text2 for storage)
        $mform->addElement('text', 'text2', \get_string('welcomemessage', 'ivplugin_n8nchat'));
        $mform->setType('text2', \PARAM_TEXT);
        $mform->addHelpButton('text2', 'welcomemessage', 'ivplugin_n8nchat');
        $mform->setDefault('text2', 'Welcome! How can I assist you today?');

        // Allow display options (popup, side, etc.)
        $this->display_options_field('side');

        // Close form (standard buttons)
        $this->close_form();
    }
}
