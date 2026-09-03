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

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$age = $data['age'] ?? null;
$password = $data['password'] ?? '';


// =============================
// VALIDATION
// =============================

if ($name === '' || $email === '' || $age === null || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => 'All fields are required.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ]);
    exit;
}

if (!is_numeric($age) || $age < 10 || $age > 100) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid age.'
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters.'
    ]);
    exit;
}


try {

    // =============================
    // DATABASE CONNECTION
    // =============================

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );


    // =============================
    // CHECK EXISTING EMAIL
    // =============================

    $check = $pdo->prepare(
        'SELECT user_id
         FROM users
         WHERE email = ?
         LIMIT 1'
    );

    $check->execute([$email]);

    if ($check->fetch()) {

        echo json_encode([
            'success' => false,
            'message' => 'An account with this email already exists.'
        ]);

        exit;
    }


    // =============================
    // HASH PASSWORD
    // =============================

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );


    // =============================
    // CREATE USER
    // =============================

    $stmt = $pdo->prepare(
        'INSERT INTO users
        (email, password_hash, account_status)
        VALUES (?, ?, "active")'
    );

    $stmt->execute([
        $email,
        $passwordHash
    ]);

    $userId = $pdo->lastInsertId();


    // =============================
    // CREATE USER PROFILE
    // =============================

    $profile = $pdo->prepare(
        'INSERT INTO user_profiles
        (user_id, full_name, age)
        VALUES (?, ?, ?)'
    );

    $profile->execute([
        $userId,
        $name,
        $age
    ]);


    // =============================
    // CREATE DEFAULT SETTINGS
    // =============================

    $settings = $pdo->prepare(
        'INSERT INTO user_settings
        (user_id)
        VALUES (?)'
    );

    $settings->execute([
        $userId
    ]);

// =============================
// CREATE LOGIN SESSION
// =============================

session_regenerate_id(true);

$_SESSION['user_id'] = $userId;
$_SESSION['email'] = $email;
$_SESSION['logged_in'] = true;


// =============================
// SUCCESS
// =============================

echo json_encode([
    'success' => true,
    'message' => 'Account created successfully.',
    'user_id' => $userId,
    'email' => $email
]);


} catch (PDOException $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Database error.'
    ]);
}