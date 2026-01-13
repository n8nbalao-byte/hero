<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hero Delivery</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">

    <!-- Navbar -->
    <nav class="bg-indigo-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <a href="index.php" class="flex items-center space-x-2">
                    <i class="fas fa-motorcycle text-2xl"></i>
                    <span class="text-xl font-bold">Hero Delivery</span>
                </a>
            </div>
            <div class="space-x-4 flex items-center">
                <a href="index.php" class="hover:text-indigo-200">Home</a>
                
                <?php if (isset($_SESSION['user_id'])): ?>
                    <?php if ($_SESSION['user_tipo'] === 'store'): ?>
                        <a href="shop.php" class="hover:text-indigo-200">Minha Loja</a>
                    <?php elseif ($_SESSION['user_tipo'] === 'courier'): ?>
                        <a href="courier.php" class="hover:text-indigo-200">Entregas</a>
                    <?php elseif ($_SESSION['user_tipo'] === 'admin'): ?>
                        <a href="admin.php" class="hover:text-indigo-200">Admin</a>
                    <?php endif; ?>
                    
                    <a href="cart.php" class="hover:text-indigo-200 relative">
                        <i class="fas fa-shopping-cart"></i>
                        <!-- Badge opcional se tiver itens -->
                    </a>
                    
                    <div class="relative group inline-block">
                        <button class="hover:text-indigo-200 font-semibold flex items-center">
                            Olá, <?php echo htmlspecialchars($_SESSION['user_nome']); ?> <i class="fas fa-caret-down ml-1"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg hidden group-hover:block z-50">
                            <a href="logout.php" class="block px-4 py-2 hover:bg-gray-100">Sair</a>
                        </div>
                    </div>
                <?php else: ?>
                    <a href="login.php" class="hover:text-indigo-200">Login</a>
                    <a href="register.php" class="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition">Cadastrar</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>
    
    <div class="flex-grow">
