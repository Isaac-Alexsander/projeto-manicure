<?php
// php/session.php
// Versão simples: inicializa a sessão sem parâmetros avançados para reduzir complexidade
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
?>
