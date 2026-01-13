<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// Contagem do carrinho
$cart_count = isset($_SESSION['cart']) ? count($_SESSION['cart']) : 0;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hero Delivery</title>
    <!-- Tailwind CSS (CDN) para utilitários -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Custom Style (Exact React Look) -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">

    <!-- Navbar Vermelho (#DC0000) -->
    <nav class="navbar flex justify-between items-center shadow-md sticky top-0 z-50">
        <div class="flex items-center gap-4">
            <?php if (isset($_SESSION['user_tipo']) && $_SESSION['user_tipo'] === 'admin'): ?>
                <span class="font-bold text-xl">Painel Administrativo</span>
            <?php else: ?>
                <a href="index.php" class="flex items-center">
                    <!-- Logo placeholder se não tiver imagem -->
                    <div class="flex items-center gap-2">
                         <i class="fas fa-motorcycle text-2xl"></i>
                         <span class="text-2xl font-bold tracking-tight">Hero Delivery</span>
                    </div>
                </a>
            <?php endif; ?>
        </div>

        <div class="flex items-center gap-6">
            <?php if (isset($_SESSION['user_id'])): ?>
                <div class="flex items-center gap-4">
                    <span class="hidden md:inline">Olá, <strong><?php echo htmlspecialchars($_SESSION['user_nome']); ?></strong></span>
                    
                    <?php if ($_SESSION['user_tipo'] === 'client'): ?>
                        <a href="client-dashboard.php" class="hover:underline">Meus Pedidos</a>
                        <a href="cart.php" class="flex items-center gap-1 relative">
                            <i class="fas fa-shopping-cart text-xl"></i>
                            <?php if ($cart_count > 0): ?>
                                <span class="badge-count"><?php echo $cart_count; ?></span>
                            <?php endif; ?>
                        </a>
                    <?php elseif ($_SESSION['user_tipo'] === 'store'): ?>
                        <a href="shop.php" class="font-bold border border-white px-3 py-1 rounded hover:bg-white hover:text-red-600 transition">Painel da Loja</a>
                    <?php elseif ($_SESSION['user_tipo'] === 'courier'): ?>
                        <a href="courier.php" class="font-bold border border-white px-3 py-1 rounded hover:bg-white hover:text-red-600 transition">Entregas</a>
                    <?php endif; ?>

                    <a href="logout.php" class="text-sm border border-white px-2 py-1 rounded hover:bg-white hover:text-red-600 transition">Sair</a>
                </div>
            <?php else: ?>
                <a href="cart.php" class="flex items-center gap-1">
                    <i class="fas fa-shopping-cart text-xl"></i>
                    <?php if ($cart_count > 0): ?>
                        <span class="badge-count"><?php echo $cart_count; ?></span>
                    <?php endif; ?>
                </a>
                <a href="login.php" class="font-semibold hover:underline">Login / Cadastro</a>
            <?php endif; ?>
        </div>
    </nav>
    
    <div class="flex-grow">
