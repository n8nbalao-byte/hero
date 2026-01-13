<?php
require_once 'config.php';
include 'includes/header.php';

// Busca Produtos
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

// Categorias Estáticas (Baseado no React)
$categorias = [
    'Eletrônicos', 'Moda', 'Casa e Jardim', 'Esportes', 'Beleza', 'Brinquedos', 'Automotivo', 'Livros', 'Pet Shop', 'Games'
];
?>

<!-- Hero Section Vermelho -->
<div class="hero-section">
    <div class="container mx-auto">
        <h1 class="text-3xl font-bold mb-2">Entregas Rápidas e Seguras</h1>
        <p class="text-lg opacity-90">Tudo o que você precisa, entregue em minutos.</p>
    </div>
</div>

<!-- Search Input Flutuante -->
<div class="search-container">
    <form action="" method="GET">
        <input type="text" name="q" class="search-input" placeholder="O que você está procurando hoje?">
        <button type="submit" class="absolute right-8 top-4 text-gray-400 hover:text-red-600">
            <i class="fas fa-search text-xl"></i>
        </button>
    </form>
</div>

<!-- Layout Principal: Sidebar + Grid -->
<div class="container mx-auto px-4 pb-12 flex flex-col md:flex-row gap-8" style="min-height: 600px;">
    
    <!-- Sidebar Categorias -->
    <aside class="sidebar w-full md:w-64 flex-shrink-0 hidden md:block">
        <div class="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <i class="fas fa-bars"></i> Categorias
        </div>
        <nav>
            <?php foreach ($categorias as $cat): ?>
                <a href="?categoria=<?php echo urlencode($cat); ?>" class="category-item">
                    <?php echo htmlspecialchars($cat); ?>
                </a>
            <?php endforeach; ?>
        </nav>
    </aside>

    <!-- Grid de Produtos -->
    <main class="flex-1">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Produtos Recentes</h2>
            <div class="flex gap-2">
                 <select class="border rounded px-3 py-1 text-sm bg-white">
                     <option>Mais Relevantes</option>
                     <option>Menor Preço</option>
                     <option>Maior Preço</option>
                 </select>
            </div>
        </div>

        <?php if (isset($erro)): ?>
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow" role="alert">
                <p class="font-bold">Atenção</p>
                <p><?php echo $erro; ?></p>
            </div>
        <?php endif; ?>

        <?php if (empty($produtos) && !isset($erro)): ?>
            <div class="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm p-8">
                <i class="fas fa-box-open text-6xl mb-4 text-gray-300"></i>
                <p class="text-xl">Nenhum produto cadastrado ainda.</p>
                <p class="text-sm mt-2">Acesse o painel da loja para adicionar.</p>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <?php foreach ($produtos as $produto): ?>
                    <div class="product-card group">
                        <div class="h-48 bg-gray-100 rounded-t-lg mb-3 overflow-hidden relative">
                            <?php if (!empty($produto['imagem'])): ?>
                                <img src="uploads/<?php echo htmlspecialchars($produto['imagem']); ?>" alt="<?php echo htmlspecialchars($produto['nome']); ?>" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                            <?php else: ?>
                                <div class="w-full h-full flex items-center justify-center text-gray-300">
                                    <i class="fas fa-image text-4xl"></i>
                                </div>
                            <?php endif; ?>
                            
                            <!-- Badge Novo (Exemplo) -->
                            <span class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">NOVO</span>
                        </div>

                        <div class="flex-grow flex flex-col justify-between">
                            <div>
                                <h3 class="font-bold text-gray-800 text-lg mb-1 leading-tight line-clamp-2"><?php echo htmlspecialchars($produto['nome']); ?></h3>
                                <p class="text-gray-500 text-sm mb-3 line-clamp-2 h-10"><?php echo htmlspecialchars($produto['descricao']); ?></p>
                            </div>
                            
                            <div class="mt-2">
                                <div class="flex justify-between items-end mb-3">
                                    <span class="text-2xl font-bold text-gray-900">R$ <?php echo number_format($produto['preco'], 2, ',', '.'); ?></span>
                                    <span class="text-xs text-gray-500">à vista</span>
                                </div>
                                <button class="btn-primary w-full flex justify-center items-center gap-2">
                                    <i class="fas fa-cart-plus"></i> Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </main>
</div>

<?php include 'includes/footer.php'; ?>
