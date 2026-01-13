<?php
session_start();
require_once 'config.php';
include 'includes/header.php';
?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Carrinho de Compras</h1>

    <div class="bg-white rounded-lg shadow-md p-6 text-center">
        <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
        <h2 class="text-xl font-semibold text-gray-700">Seu carrinho está vazio</h2>
        <p class="text-gray-500 mb-6">Adicione produtos para começar.</p>
        <a href="index.php" class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
            Voltar para a Loja
        </a>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
