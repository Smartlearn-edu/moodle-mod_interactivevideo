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

use mod_interactivevideo\local\pluginform;

/**
 * Form for adding/editing a n8n Chat annotation.
 *
 * @package    ivplugin_n8nchat
 * @copyright  2024 Antigravity
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class form extends pluginform
{

    /**
     * Define the form fields
     */
    public function definition()
    {
        $mform = $this->_form;

        $mform->addElement('header', 'general', get_string('pluginname', 'ivplugin_n8nchat'));

        // Webhook URL
        $mform->addElement('text', 'webhookurl', get_string('webhookurl', 'ivplugin_n8nchat'));
        $mform->setType('webhookurl', PARAM_URL);
        $mform->addRule('webhookurl', null, 'required', null, 'client');
        $mform->addHelpButton('webhookurl', 'webhookurl', 'ivplugin_n8nchat');

        // Welcome Message (Optional)
        $mform->addElement('text', 'welcomemessage', get_string('welcomemessage', 'ivplugin_n8nchat'));
        $mform->setType('welcomemessage', PARAM_TEXT);
        $mform->addHelpButton('welcomemessage', 'welcomemessage', 'ivplugin_n8nchat');
        $mform->setDefault('welcomemessage', 'Welcome! How can I assist you today?');
    }
}
