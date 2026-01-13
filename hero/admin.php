<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

// Verificar se é admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_tipo'] !== 'admin') {
    echo "<div class='container mx-auto p-4'><div class='bg-red-100 text-red-700 p-4 rounded'>Acesso restrito.</div></div>";
    include 'includes/footer.php';
    exit;
}
?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Painel Administrativo</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold mb-2">Usuários</h3>
            <p class="text-3xl font-bold text-indigo-600">0</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold mb-2">Lojas</h3>
            <p class="text-3xl font-bold text-indigo-600">0</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold mb-2">Pedidos Hoje</h3>
            <p class="text-3xl font-bold text-indigo-600">0</p>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
