<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

// Verificar se é entregador
if (!isset($_SESSION['user_id']) || $_SESSION['user_tipo'] !== 'courier') {
    echo "<div class='container mx-auto p-4'><div class='bg-red-100 text-red-700 p-4 rounded'>Acesso restrito a entregadores.</div></div>";
    include 'includes/footer.php';
    exit;
}
?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Painel do Entregador</h1>
    
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div class="flex">
            <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div class="ml-3">
                <p class="text-sm text-yellow-700">
                    Mantenha seu GPS ativado para receber entregas próximas.
                </p>
            </div>
        </div>
    </div>

    <h2 class="text-xl font-bold mb-4">Entregas Disponíveis</h2>
    <div class="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        Nenhuma entrega disponível no momento.
    </div>
</div>

<?php include 'includes/footer.php'; ?>
