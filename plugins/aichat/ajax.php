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

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');

$action = required_param('action', PARAM_TEXT);
$contextid = required_param('contextid', PARAM_INT);
$sesskey = required_param('sesskey', PARAM_RAW);

require_login();
require_sesskey();

$context = context::instance_by_id($contextid);
$PAGE->set_context($context);

$result = ['success' => false];

switch ($action) {
    case 'chat':
        $question = required_param('question', PARAM_TEXT);
        $timestamp = required_param('timestamp', PARAM_FLOAT);
        $transcript = optional_param('transcript', '', PARAM_RAW);
        $itemid = required_param('itemid', PARAM_INT); // The annotation ID to get the system prompt

        // Fetch the annotation to get the system prompt (text2)
        global $DB;
        $item = $DB->get_record('interactivevideo_items', ['id' => $itemid], '*', MUST_EXIST);
        $systemprompt = $item->text2 ?? '';

        $result = \ivplugin_aichat\renderer::process_chat_request(
            $contextid,
            $question,
            $timestamp,
            $transcript,
            $systemprompt
        );
        break;

    default:
        $result['error'] = 'Invalid action';
        break;
}

echo json_encode($result);
die;
