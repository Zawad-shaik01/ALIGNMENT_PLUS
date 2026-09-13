<?php

session_start();

header('Content-Type: application/json');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($email === '' || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required.'
    ]);
    exit;
}

try {

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $stmt = $pdo->prepare(
        'SELECT user_id, email, password_hash, account_status
         FROM users
         WHERE email = ?
         LIMIT 1'
    );

    $stmt->execute([$email]);

    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password.'
        ]);
        exit;
    }

    if ($user['account_status'] !== 'active') {
        echo json_encode([
            'success' => false,
            'message' => 'This account is not active.'
        ]);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password.'
        ]);
        exit;
    }

    // Successful login
    session_regenerate_id(true);

    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['logged_in'] = true;

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user_id' => $user['user_id'],
        'email' => $user['email']
    ]);

} catch (PDOException $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Database error.'
    ]);
}