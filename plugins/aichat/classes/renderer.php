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

use core_ai\aiactions\responses\response_base;

/**
 * Class renderer to handle AI interactions
 *
 * @package    ivplugin_aichat
 * @copyright  2024 Sokunthearith Makara <sokunthearithmakara@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class renderer
{

    /**
     * Process the chat request
     *
     * @param int $contextid The context ID
     * @param string $question The user's question
     * @param float $timestamp The current video timestamp
     * @param string $transcript Context/Transcript text around the timestamp
     * @param string $systemprompt Custom system prompt override
     * @return array Response data
     */
    public static function process_chat_request($contextid, $question, $timestamp, $transcript, $systemprompt = '')
    {
        global $USER;

        // Check capabilities if needed, though ajax.php usually handles context checks.

        // Construct the prompt
        $finalprompt = "You are a helpful AI tutor assisting a student who is watching an educational video.\n";

        if (!empty($systemprompt)) {
            $finalprompt .= "Instruction: " . $systemprompt . "\n";
        }

        $finalprompt .= "Current Video Timestamp: " . self::format_time($timestamp) . "\n";
        if (!empty($transcript)) {
            $finalprompt .= "Transcript/Context around this time:\n\"" . $transcript . "\"\n";
        } else {
            $finalprompt .= "No transcript is available for this segment.\n";
        }

        $finalprompt .= "\nStudent Question: " . $question . "\n";
        $finalprompt .= "Answer concisely and helpfuly based on the context provided.";

        // Use Core AI to generate text
        // Note: In Moodle 4.4+, we use \core_ai\manager
        // We will use the 'generate_text' action.

        $action = new \core_ai\aiactions\generate_text(
            contextid: $contextid,
            userid: $USER->id,
            prompttext: $finalprompt
        );

        try {
            global $DB;
            $manager = new \core_ai\manager($DB);
            $result = $manager->process_action($action);

            if ($result->get_success()) {
                return [
                    'success' => true,
                    'response' => $result->get_response_data()['generatedcontent']
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $result->get_error_message()
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Helper to format seconds to MM:SS
     */
    private static function format_time($seconds)
    {
        $m = floor($seconds / 60);
        $s = floor($seconds % 60);
        return sprintf("%02d:%02d", $m, $s);
    }
}
