<?php
require_once 'config.php';

// Buscar produtos
try {
    // Verifica se a tabela existe antes de consultar (para evitar erro fatal na primeira vez)
    $stmt = $pdo->query("SHOW TABLES LIKE 'produtos'");
    if ($stmt->rowCount() > 0) {
        $stmt = $pdo->query("SELECT * FROM produtos ORDER BY id DESC LIMIT 20");
        $produtos = $stmt->fetchAll();
    } else {
        $produtos = [];
        $erro = "Tabela 'produtos' não encontrada.";
    }
} catch (PDOException $e) {
    $produtos = [];
    $erro = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hero Delivery - Home</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-800">

    <!-- Navbar -->
    <nav class="bg-indigo-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <i class="fas fa-motorcycle text-2xl"></i>
                <span class="text-xl font-bold">Hero Delivery</span>
            </div>
            <div class="space-x-4">
                <a href="index.php" class="hover:text-indigo-200">Home</a>
                <a href="login.php" class="hover:text-indigo-200">Login</a>
                <a href="register.php" class="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition">Cadastrar</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-indigo-700 text-white py-12">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-4xl font-bold mb-4">Entregas Rápidas e Seguras</h1>
            <p class="text-lg mb-8">Encontre os melhores produtos e receba no conforto da sua casa.</p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
        <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Produtos Recentes</h2>
        
        <?php if (isset($erro)): ?>
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow" role="alert">
                <p class="font-bold">Atenção</p>
                <p><?php echo $erro; ?></p>
            </div>
        <?php endif; ?>

        <?php if (empty($produtos) && !isset($erro)): ?>
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-box-open text-6xl mb-4"></i>
                <p class="text-xl">Nenhum produto cadastrado ainda.</p>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <?php foreach ($produtos as $produto): ?>
                    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300">
                        <div class="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                            <?php if (!empty($produto['imagem'])): ?>
                                <!-- Ajustar caminho da imagem conforme necessidade -->
                                <img src="uploads/<?php echo htmlspecialchars($produto['imagem']); ?>" alt="<?php echo htmlspecialchars($produto['nome']); ?>" class="w-full h-full object-cover">
                            <?php else: ?>
                                <i class="fas fa-image text-gray-400 text-4xl"></i>
                            <?php endif; ?>
                        </div>
                        <div class="p-4">
                            <h3 class="font-bold text-lg mb-2 truncate"><?php echo htmlspecialchars($produto['nome']); ?></h3>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-2"><?php echo htmlspecialchars($produto['descricao']); ?></p>
                            <div class="flex justify-between items-center">
                                <span class="text-indigo-600 font-bold text-xl">R$ <?php echo number_format($produto['preco'], 2, ',', '.'); ?></span>
                                <button class="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition" title="Adicionar ao Carrinho">
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p>&copy; 2024 Hero Delivery. Todos os direitos reservados.</p>
        </div>
    </footer>

</body>
</html>
