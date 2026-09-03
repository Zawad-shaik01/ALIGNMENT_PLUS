# ALIGNMENT+ MySQL Integration

This version changes the Exercise Plan from a hard-coded JavaScript exercise
array to a MySQL-backed API.

## Flow

Conditions Page
  -> selectedConditions in localStorage
  -> Exercise Plan
  -> `api/exercises.php`
  -> MySQL `alignment_plus`
  -> Exercise Plan renders the returned exercises
  -> Start Routine stores the fetched exercises in sessionStorage
  -> Routine Page reads `routineData`

## Setup with XAMPP

1. Start Apache and MySQL in XAMPP.
2. Copy the `repair CX` folder into your XAMPP `htdocs` directory.
3. Open phpMyAdmin.
4. Import:
   `repair CX/database/alignment_plus.sql`
5. Check `repair CX/CorrectX _UI/api/config.php`.
   Default XAMPP credentials are:
   - host: localhost
   - user: root
   - password: empty
   - database: alignment_plus
6. Open the project through Apache, for example:
   `http://localhost/repair%20CX/CorrectX%20_UI/LandPage/index.html`
   Do NOT open the HTML file directly with `file://`.

## Media

Images and videos are NOT stored in MySQL.
MySQL stores their paths. The actual files remain in `repair CX/Assets/`.

## Important

The initial condition-to-exercise mappings are prototype data based on the
current project library. They should be reviewed by a qualified physiotherapist
before being presented as clinical treatment recommendations.

## If the API says it cannot connect

Check:
- MySQL is running.
- `alignment_plus` exists.
- The SQL import completed.
- `api/config.php` has the correct MySQL username/password.
- The project is being opened through Apache/PHP.
