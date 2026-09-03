<?php
/**
 * ALIGNMENT+ MySQL connection
 *
 * Default values are suitable for a typical XAMPP/WAMP local setup:
 *   host: localhost
 *   user: root
 *   password: empty
 *   database: alignment_plus
 *
 * If your MySQL credentials are different, change them here.
 */
declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_NAME = 'alignment_plus';
const DB_USER = 'root';
const DB_PASSWORD = 'Zawad_14';

function getDatabase(): mysqli
{
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    $db->set_charset('utf8mb4');

    return $db;
}
