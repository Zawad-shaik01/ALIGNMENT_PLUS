<?php
/**
 * ALIGNMENT+ Exercise Plan API
 *
 * GET:
 *   exercises.php?conditions=Scoliosis
 *   exercises.php?conditions=Scoliosis,Kyphosis
 *
 * Returns exercises mapped to the selected condition(s).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/config.php';

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function mediaPath(?string $path): string
{
    if (!$path) {
        return '';
    }

    // Database stores media locations as application-relative paths.
    // The Exercise Plan page lives one directory below CorrectX_UI.
    $path = str_replace('\\', '/', $path);

    if (str_starts_with($path, 'Assets/')) {
        return '../../' . $path;
    }

    if (str_starts_with($path, 'assets/')) {
        return '../../' . preg_replace('/^assets\//', 'Assets/', $path);
    }

    return '../../' . ltrim($path, '/');
}

try {
    $rawConditions = trim((string)($_GET['conditions'] ?? ''));

    if ($rawConditions === '') {
        respond([
            'success' => false,
            'message' => 'No condition was selected.'
        ], 400);
    }

    $conditions = array_values(array_unique(array_filter(
        array_map('trim', explode(',', $rawConditions)),
        static fn(string $value): bool => $value !== ''
    )));

    if (!$conditions) {
        respond([
            'success' => false,
            'message' => 'No valid condition was selected.'
        ], 400);
    }

    $db = getDatabase();

    $placeholders = implode(',', array_fill(0, count($conditions), '?'));
    $types = str_repeat('s', count($conditions));

    // Condition metadata.
    $conditionSql = "
        SELECT condition_id, name, short_description, full_description,
               focus_area, device_note, image_path
        FROM conditions
        WHERE is_active = TRUE
          AND name IN ($placeholders)
        ORDER BY FIELD(name, $placeholders)
    ";

    // FIELD() needs the condition values a second time.
    $conditionStmt = $db->prepare($conditionSql);
    $conditionTypes = $types . $types;
    $conditionParams = array_merge($conditions, $conditions);
    $conditionStmt->bind_param($conditionTypes, ...$conditionParams);
    $conditionStmt->execute();
    $conditionResult = $conditionStmt->get_result();

    $selectedConditionRows = [];
    while ($row = $conditionResult->fetch_assoc()) {
        $row['image_path'] = mediaPath($row['image_path']);
        $selectedConditionRows[] = $row;
    }
    $conditionStmt->close();

    if (!$selectedConditionRows) {
        respond([
            'success' => false,
            'message' => 'The selected condition is not available in the database.'
        ], 404);
    }

    // Exercises for all selected conditions. DISTINCT prevents duplicates
    // when the same exercise is mapped to multiple selected conditions.
    $exerciseSql = "
        SELECT
            e.exercise_id,
            e.name,
            e.short_description,
            e.duration,
            e.repetitions,
            e.difficulty,
            e.image_path,
            e.video_path,
            e.breathing,
            MIN(ce.order_number) AS order_number
        FROM condition_exercises ce
        INNER JOIN conditions c ON c.condition_id = ce.condition_id
        INNER JOIN exercises e ON e.exercise_id = ce.exercise_id
        WHERE c.is_active = TRUE
          AND e.is_active = TRUE
          AND c.name IN ($placeholders)
        GROUP BY
            e.exercise_id, e.name, e.short_description, e.duration,
            e.repetitions, e.difficulty, e.image_path, e.video_path,
            e.breathing
        ORDER BY order_number, e.exercise_id
    ";

    $exerciseStmt = $db->prepare($exerciseSql);
    $exerciseStmt->bind_param($types, ...$conditions);
    $exerciseStmt->execute();
    $exerciseResult = $exerciseStmt->get_result();

    $exercises = [];

    while ($exercise = $exerciseResult->fetch_assoc()) {
        $exerciseId = (int)$exercise['exercise_id'];

        $instructionStmt = $db->prepare("
            SELECT instruction_text
            FROM exercise_instructions
            WHERE exercise_id = ?
            ORDER BY step_number
        ");
        $instructionStmt->bind_param('i', $exerciseId);
        $instructionStmt->execute();
        $instructionResult = $instructionStmt->get_result();

        $instructions = [];
        while ($instruction = $instructionResult->fetch_assoc()) {
            $instructions[] = $instruction['instruction_text'];
        }
        $instructionStmt->close();

        $focusStmt = $db->prepare("
            SELECT focus_name
            FROM exercise_focus_areas
            WHERE exercise_id = ?
            ORDER BY focus_id
        ");
        $focusStmt->bind_param('i', $exerciseId);
        $focusStmt->execute();
        $focusResult = $focusStmt->get_result();

        $focus = [];
        while ($item = $focusResult->fetch_assoc()) {
            $focus[] = $item['focus_name'];
        }
        $focusStmt->close();

        $mistakeStmt = $db->prepare("
            SELECT mistake_text
            FROM exercise_mistakes
            WHERE exercise_id = ?
            ORDER BY mistake_id
        ");
        $mistakeStmt->bind_param('i', $exerciseId);
        $mistakeStmt->execute();
        $mistakeResult = $mistakeStmt->get_result();

        $mistakes = [];
        while ($item = $mistakeResult->fetch_assoc()) {
            $mistakes[] = $item['mistake_text'];
        }
        $mistakeStmt->close();

        $breathing = $exercise['breathing']
            ? [$exercise['breathing']]
            : ['Breathe slowly and normally throughout the exercise.'];

        $exercises[] = [
            'id' => $exerciseId,
            'name' => $exercise['name'],
            'description' => $exercise['short_description'] ?? '',
            'duration' => $exercise['duration'],
            'repetitions' => $exercise['repetitions'],
            'level' => $exercise['difficulty'],
            'image' => mediaPath($exercise['image_path']),
            'video' => mediaPath($exercise['video_path']),
            'instructions' => $instructions,
            'focus' => $focus,
            'breathing' => $breathing,
            'mistakes' => $mistakes
        ];
    }

    $exerciseStmt->close();
    $db->close();

    respond([
        'success' => true,
        'conditions' => $selectedConditionRows,
        'condition' => implode(' + ', array_map(
            static fn(array $row): string => $row['name'],
            $selectedConditionRows
        )),
        'exercises' => $exercises,
        'count' => count($exercises)
    ]);
} catch (Throwable $error) {
    error_log('ALIGNMENT+ API error: ' . $error->getMessage());

    respond([
        'success' => false,
        'message' => 'Unable to load exercises from MySQL. Check the database setup and connection settings.'
    ], 500);
}
