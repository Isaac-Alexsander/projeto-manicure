<?php
// php/logout.php

require 'session.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // logout via AJAX/fetch
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }
    session_unset();
    session_destroy();

    header('Content-Type: application/json');
    echo json_encode(['mensagem' => 'Logout efetuado']);
    exit;
}

// fallback for direct GET access
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'], $params['secure'], $params['httponly']
    );
}
session_unset();
session_destroy();
header('Location: ../auth.html');
exit;
?>
