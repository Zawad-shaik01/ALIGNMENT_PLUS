-- ============================================================
-- ALIGNMENT+ MySQL Database
-- Database: alignment_plus
-- Purpose: Users, conditions, exercises, routines, progress,
--          settings, and media paths.
--
-- IMPORTANT:
--   Images/videos are NOT stored as BLOBs.
--   Only their relative paths/URLs are stored in MySQL.
--   Actual media remains in the application/server storage.
-- ============================================================

CREATE DATABASE IF NOT EXISTS alignment_plus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alignment_plus;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS exercise_progress;
DROP TABLE IF EXISTS routine_exercises;
DROP TABLE IF EXISTS routines;
DROP TABLE IF EXISTS condition_exercises;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS user_conditions;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS conditions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    account_status ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. USER PROFILES
-- ============================================================
CREATE TABLE user_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    age TINYINT UNSIGNED NULL,
    profile_image_path VARCHAR(500) NULL,
    bio VARCHAR(500) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. CONDITIONS
-- ============================================================
CREATE TABLE conditions (
    condition_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL,
    short_description TEXT NULL,
    full_description TEXT NULL,
    focus_area TEXT NULL,
    device_note TEXT NULL,
    image_path VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 4. USER CONDITIONS
-- Stores the conditions selected by a user.
-- One user can select multiple conditions.
-- ============================================================
CREATE TABLE user_conditions (
    user_condition_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    condition_id INT UNSIGNED NOT NULL,
    severity ENUM('Mild','Moderate','Severe') NOT NULL,
    selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_condition
        UNIQUE (user_id, condition_id),

    CONSTRAINT fk_user_condition_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_condition_condition
        FOREIGN KEY (condition_id) REFERENCES conditions(condition_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 5. EXERCISES
-- Media files stay outside MySQL.
-- image_path/video_path contain relative paths or URLs.
-- ============================================================
CREATE TABLE exercises (
    exercise_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    short_description VARCHAR(500) NULL,
    duration VARCHAR(50) NOT NULL,
    repetitions VARCHAR(50) NULL,
    difficulty ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
    image_path VARCHAR(500) NULL,
    video_path VARCHAR(500) NULL,
    breathing TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 6. EXERCISE INSTRUCTIONS
-- One exercise can have many ordered instructions.
-- ============================================================
CREATE TABLE exercise_instructions (
    instruction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT UNSIGNED NOT NULL,
    step_number SMALLINT UNSIGNED NOT NULL,
    instruction_text TEXT NOT NULL,

    CONSTRAINT uq_instruction_order
        UNIQUE (exercise_id, step_number),

    CONSTRAINT fk_instruction_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. EXERCISE FOCUS AREAS
-- ============================================================
CREATE TABLE exercise_focus_areas (
    focus_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT UNSIGNED NOT NULL,
    focus_name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_focus_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 8. COMMON MISTAKES
-- ============================================================
CREATE TABLE exercise_mistakes (
    mistake_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT UNSIGNED NOT NULL,
    mistake_text VARCHAR(500) NOT NULL,

    CONSTRAINT fk_mistake_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 9. CONDITION <-> EXERCISE
-- Many-to-many relationship.
-- The order column controls the routine sequence.
-- ============================================================
CREATE TABLE condition_exercises (
    condition_id INT UNSIGNED NOT NULL,
    exercise_id INT UNSIGNED NOT NULL,
    order_number SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    recommended_duration VARCHAR(50) NULL,
    notes TEXT NULL,

    PRIMARY KEY (condition_id, exercise_id),

    CONSTRAINT fk_ce_condition
        FOREIGN KEY (condition_id) REFERENCES conditions(condition_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ce_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. ROUTINES
-- A routine belongs to a user and can be generated from
-- one or more selected conditions.
-- ============================================================
CREATE TABLE routines (
    routine_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    routine_name VARCHAR(160) NOT NULL,
    status ENUM('draft','active','completed','archived') NOT NULL DEFAULT 'active',
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_routine_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 11. ROUTINE EXERCISES
-- Snapshot of the exercises assigned to a routine.
-- This means future exercise edits don't unexpectedly alter
-- an already-created routine.
-- ============================================================
CREATE TABLE routine_exercises (
    routine_exercise_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    routine_id BIGINT UNSIGNED NOT NULL,
    exercise_id INT UNSIGNED NOT NULL,
    order_number SMALLINT UNSIGNED NOT NULL,
    planned_duration VARCHAR(50) NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at DATETIME NULL,

    CONSTRAINT uq_routine_order
        UNIQUE (routine_id, order_number),

    CONSTRAINT fk_re_routine
        FOREIGN KEY (routine_id) REFERENCES routines(routine_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_re_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 12. EXERCISE PROGRESS
-- Historical completion data for analytics.
-- ============================================================
CREATE TABLE exercise_progress (
    progress_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    routine_id BIGINT UNSIGNED NULL,
    exercise_id INT UNSIGNED NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_duration_seconds INT UNSIGNED NULL,
    completed_at DATETIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_progress_user_date (user_id, completed_at),
    INDEX idx_progress_exercise (exercise_id),

    CONSTRAINT fk_progress_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_progress_routine
        FOREIGN KEY (routine_id) REFERENCES routines(routine_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_progress_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 13. USER SETTINGS
-- ============================================================
CREATE TABLE user_settings (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    light_mode BOOLEAN NOT NULL DEFAULT TRUE,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    care_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    progress_prompts BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_settings_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA: CONDITIONS
-- Taken from the current ALIGNMENT+ Conditions Page.
-- ============================================================
INSERT INTO conditions
(name, category, short_description, full_description, focus_area, device_note, image_path)
VALUES
('Scoliosis', 'Spinal',
 'Sideways curvature of the spine that may affect posture and body symmetry.',
 'Scoliosis is an abnormal sideways curvature of the spine, often forming an S or C shape. It may affect posture, shoulder height, rib alignment, and muscle balance.',
 'Muscle symmetry, core stability, spinal elongation, breathing control, and posture awareness.',
 'Back brace or posture support may be suggested only after medical consultation.',
 'Assets/Images/scoliosis.png'),

('Kyphosis', 'Spinal',
 'Excessive outward curve of the upper spine, often causing rounded back posture.',
 'Kyphosis is excessive rounding of the upper back. It can be postural or structural and may cause a hunched appearance.',
 'Thoracic extension, scapular retraction, chest opening, chin tucks, and postural awareness.',
 'A thoracic posture brace may help in some cases, but usage should be confirmed by a professional.',
 'Assets/Images/Kyphosis.png'),

('Lordosis', 'Spinal',
 'Excessive inward curve of the lower spine, often creating swayback posture.',
 'Lordosis is an exaggerated inward curve of the lower back. It is often linked with weak core muscles and tight hip flexors.',
 'Core strengthening, hip flexor stretching, glute activation, and neutral pelvis control.',
 'Lumbar support may help during sitting or standing, but it should not replace corrective exercise.',
 'Assets/Images/Lordosis.png'),

('Anterior Pelvic Tilt', 'Pelvic',
 'Forward tilt of the pelvis that may increase lower back arch and muscle imbalance.',
 'Anterior Pelvic Tilt occurs when the pelvis rotates forward, often increasing the lower back curve.',
 'Hip flexor stretching, glute strengthening, hamstring activation, and deep core control.',
 'Pelvic support belts may be used in specific cases after professional advice.',
 'Assets/Images/anterior-pelvic-tilt.png'),

('Posterior Pelvic Tilt', 'Pelvic',
 'Backward tilt of the pelvis that may flatten the lower back posture.',
 NULL, NULL, NULL, 'Assets/Images/posterior-pelvic-tilt.png'),

('Pelvic Obliquity', 'Pelvic',
 'Uneven pelvic height that may contribute to postural imbalance.',
 NULL, NULL, NULL, 'Assets/Images/pelvic-obliquity.png'),

('Knock Knees', 'Lower Limb',
 'Knees angle inward when standing or walking.',
 NULL, NULL, NULL, 'Assets/Images/knock-knees.jpg'),

('Bow Legs', 'Lower Limb',
 'Leg alignment creates an outward curve at the knees.',
 NULL, NULL, NULL, 'Assets/Images/bow-legs.jpg'),

('Flat Feet', 'Foot & Ankle',
 'Reduced or flattened foot arch that may affect lower-limb alignment.',
 NULL, NULL, NULL, 'Assets/Images/flat-feet.jpg'),

('High Arch', 'Foot & Ankle',
 'A higher-than-usual foot arch that may affect balance and load distribution.',
 NULL, NULL, NULL, 'Assets/Images/high-arch.png'),

('Hallux Valgus', 'Foot & Ankle',
 'A progressive alignment change affecting the big toe.',
 NULL, NULL, NULL, 'Assets/Images/hallux-valgus.png'),

('Ankle Instability', 'Foot & Ankle',
 'Reduced ankle stability that may affect balance and movement.',
 NULL, NULL, NULL, 'Assets/Images/ankle-instability.jpg'),

('Abnormal Gait', 'Movement',
 'A walking pattern that differs from typical movement mechanics.',
 NULL, NULL, NULL, 'Assets/Images/abnormal-gait.jpg'),

('Poor Balance', 'Movement',
 'Difficulty maintaining stable posture during standing or movement.',
 NULL, NULL, NULL, 'Assets/Images/poor-balance.png');

-- ============================================================
-- SEED DATA: CURRENT EXERCISES
-- These mirror the exercises currently hard-coded in
-- ExercisePlanPage/exercise-plan.js.
--
-- The media paths are placeholders until the real exercise
-- images/videos are added.
-- ============================================================
INSERT INTO exercises
(name, short_description, duration, repetitions, difficulty, image_path, video_path, breathing)
VALUES
('Left-Hand Raise',
 'Improves spinal flexibility.',
 '2 min',
 '10',
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/left-hand-raise.mp4',
 'Exhale while arching.'),

('Side-Lying Open Book',
 'Improves thoracic rotation and posture.',
 '3 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/side-lying-open-book.mp4',
 NULL),

('Dead Bug',
 'Strengthens the core and improves stability.',
 '3 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/dead-bug.mp4',
 NULL),

('Bird Dog',
 'Develops balance and spinal control.',
 '3 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/bird-dog.mp4',
 NULL),

('Glute Bridge',
 'Strengthens glutes and pelvic muscles.',
 '3 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/glute-bridge.mp4',
 NULL),

('Child''s Pose',
 'Relieves spinal tension and stretches the back.',
 '2 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/childs-pose.mp4',
 NULL),

('Modified Side Plank',
 'Improves core strength and posture.',
 '3 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/modified-side-plank.mp4',
 NULL),

('Diaphragmatic Breathing',
 'Encourages relaxation and breathing control.',
 '3 min',
 NULL,
 'Beginner',
 'Assets/Images/cat-camel.jpg',
 'assets/videos/diaphragmatic-breathing.mp4',
 NULL);

-- Instructions for exercise 1
INSERT INTO exercise_instructions (exercise_id, step_number, instruction_text)
VALUES
(1, 1, 'Start on hands and knees.'),
(1, 2, 'Arch your back upward.'),
(1, 3, 'Slowly lower your spine.');

-- Focus areas for exercise 1
INSERT INTO exercise_focus_areas (exercise_id, focus_name)
VALUES
(1, 'Spinal Mobility'),
(1, 'Core Stability');

-- Common mistakes for exercise 1
INSERT INTO exercise_mistakes (exercise_id, mistake_text)
VALUES
(1, 'Moving too fast'),
(1, 'Holding your breath');

-- ============================================================
-- Prototype condition-to-exercise mapping
--
-- These mappings are intentionally conservative and represent
-- the current prototype library. They should be reviewed by
-- a qualified physiotherapist before being used as clinical
-- recommendations.
-- ============================================================

-- Scoliosis
INSERT INTO condition_exercises (condition_id, exercise_id, order_number)
SELECT c.condition_id, e.exercise_id, x.order_number
FROM conditions c
JOIN (
    SELECT 1 AS exercise_id, 1 AS order_number
    UNION ALL SELECT 3, 2
    UNION ALL SELECT 4, 3
    UNION ALL SELECT 8, 4
) x
JOIN exercises e ON e.exercise_id = x.exercise_id
WHERE c.name = 'Scoliosis';

-- Kyphosis
INSERT INTO condition_exercises (condition_id, exercise_id, order_number)
SELECT c.condition_id, e.exercise_id, x.order_number
FROM conditions c
JOIN (
    SELECT 2 AS exercise_id, 1 AS order_number
    UNION ALL SELECT 3, 2
    UNION ALL SELECT 4, 3
    UNION ALL SELECT 6, 4
    UNION ALL SELECT 8, 5
) x
JOIN exercises e ON e.exercise_id = x.exercise_id
WHERE c.name = 'Kyphosis';

-- Lordosis
INSERT INTO condition_exercises (condition_id, exercise_id, order_number)
SELECT c.condition_id, e.exercise_id, x.order_number
FROM conditions c
JOIN (
    SELECT 3 AS exercise_id, 1 AS order_number
    UNION ALL SELECT 5, 2
    UNION ALL SELECT 6, 3
    UNION ALL SELECT 8, 4
) x
JOIN exercises e ON e.exercise_id = x.exercise_id
WHERE c.name = 'Lordosis';

-- Anterior Pelvic Tilt
INSERT INTO condition_exercises (condition_id, exercise_id, order_number)
SELECT c.condition_id, e.exercise_id, x.order_number
FROM conditions c
JOIN (
    SELECT 3 AS exercise_id, 1 AS order_number
    UNION ALL SELECT 5, 2
    UNION ALL SELECT 6, 3
) x
JOIN exercises e ON e.exercise_id = x.exercise_id
WHERE c.name = 'Anterior Pelvic Tilt';

-- Posterior Pelvic Tilt
INSERT INTO condition_exercises (condition_id, exercise_id, order_number)
SELECT c.condition_id, e.exercise_id, x.order_number
FROM conditions c
JOIN (
    SELECT 3 AS exercise_id, 1 AS order_number
    UNION ALL SELECT 5, 2
    UNION ALL SELECT 8, 3
) x
JOIN exercises e ON e.exercise_id = x.exercise_id
WHERE c.name = 'Posterior Pelvic Tilt';

-- ============================================================
-- Useful views
-- ============================================================

CREATE OR REPLACE VIEW v_exercise_library AS
SELECT
    e.exercise_id,
    e.name,
    e.short_description,
    e.duration,
    e.repetitions,
    e.difficulty,
    e.image_path,
    e.video_path,
    e.breathing
FROM exercises e
WHERE e.is_active = TRUE;

CREATE OR REPLACE VIEW v_condition_exercise_plan AS
SELECT
    c.condition_id,
    c.name AS condition_name,
    ce.order_number,
    e.exercise_id,
    e.name AS exercise_name,
    e.short_description,
    e.duration,
    e.repetitions,
    e.difficulty,
    e.image_path,
    e.video_path
FROM condition_exercises ce
JOIN conditions c ON c.condition_id = ce.condition_id
JOIN exercises e ON e.exercise_id = ce.exercise_id
WHERE c.is_active = TRUE
  AND e.is_active = TRUE;

-- ============================================================
-- Example queries
-- ============================================================

-- Get exercises for Scoliosis:
-- SELECT * FROM v_condition_exercise_plan
-- WHERE condition_name = 'Scoliosis'
-- ORDER BY order_number;

-- Get a user's selected conditions:
-- SELECT c.name, uc.severity
-- FROM user_conditions uc
-- JOIN conditions c ON c.condition_id = uc.condition_id
-- WHERE uc.user_id = 1;

-- Get completed exercise history:
-- SELECT ep.*, e.name
-- FROM exercise_progress ep
-- JOIN exercises e ON e.exercise_id = ep.exercise_id
-- WHERE ep.user_id = 1
-- ORDER BY ep.completed_at DESC;

-- ============================================================
-- END OF ALIGNMENT+ DATABASE
-- ============================================================
