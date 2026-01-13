<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

// Verificação de acesso
if (!isset($_SESSION['user_id']) || $_SESSION['user_tipo'] !== 'store') {
    echo "<script>window.location.href='login.php';</script>";
    exit;
}

$loja_id = 1; // Fixo para este exemplo simplificado ou pegaria da session se tivesse tabela lojas linkada

// Processamento de Formulários
$msg = '';
$activeTab = isset($_GET['tab']) ? $_GET['tab'] : 'dashboard';

// Adicionar Produto
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_product') {
    $nome = $_POST['nome'];
    $preco = $_POST['preco'];
    $descricao = $_POST['descricao'];
    $categoria = $_POST['categoria'];
    
    // Upload Imagem
    $imagem = '';
    if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === 0) {
        $ext = pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION);
        $novo_nome = uniqid() . "." . $ext;
        if (move_uploaded_file($_FILES['imagem']['tmp_name'], 'uploads/' . $novo_nome)) {
            $imagem = $novo_nome;
        }
    }

    try {
        $sql = "INSERT INTO produtos (nome, descricao, preco, imagem, loja_id, categoria) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $descricao, $preco, $imagem, $loja_id, $categoria]);
        $msg = "Produto adicionado com sucesso!";
        $activeTab = 'products';
    } catch (PDOException $e) {
        $msg = "Erro: " . $e->getMessage();
    }
}

// Buscar Dados
// 1. Produtos
$stmt = $pdo->query("SELECT * FROM produtos ORDER BY id DESC");
$produtos = $stmt->fetchAll();

// 2. Pedidos (Mock/Placeholder se não tiver tabela)
$pedidos = []; // Implementar se tiver tabela pedidos
// Exemplo simples:
// $pedidos = $pdo->query("SELECT * FROM pedidos WHERE loja_id = $loja_id")->fetchAll();

?>

<div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-lg hidden md:block">
        <div class="p-6">
            <h2 class="text-2xl font-bold text-red-600 mb-6">Minha Loja</h2>
            <nav class="space-y-2">
                <a href="?tab=dashboard" class="flex items-center gap-3 p-3 rounded-lg <?php echo $activeTab === 'dashboard' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:bg-gray-50'; ?>">
                    <i class="fas fa-chart-line"></i> Dashboard
                </a>
                <a href="?tab=products" class="flex items-center gap-3 p-3 rounded-lg <?php echo $activeTab === 'products' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:bg-gray-50'; ?>">
                    <i class="fas fa-box"></i> Produtos
                </a>
                <a href="?tab=orders" class="flex items-center gap-3 p-3 rounded-lg <?php echo $activeTab === 'orders' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:bg-gray-50'; ?>">
                    <i class="fas fa-clipboard-list"></i> Pedidos
                    <span class="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">0</span>
                </a>
                <a href="?tab=settings" class="flex items-center gap-3 p-3 rounded-lg <?php echo $activeTab === 'settings' ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:bg-gray-50'; ?>">
                    <i class="fas fa-cog"></i> Configurações
                </a>
            </nav>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8">
        <?php if ($msg): ?>
            <div class="bg-green-100 text-green-700 p-4 rounded mb-6 flex items-center gap-2">
                <i class="fas fa-check-circle"></i> <?php echo $msg; ?>
            </div>
        <?php endif; ?>

        <!-- Dashboard Tab -->
        <?php if ($activeTab === 'dashboard'): ?>
            <h1 class="text-2xl font-bold mb-6">Visão Geral</h1>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-sm mb-1">Vendas Hoje</div>
                    <div class="text-3xl font-bold text-gray-800">R$ 0,00</div>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-sm mb-1">Pedidos Pendentes</div>
                    <div class="text-3xl font-bold text-yellow-600">0</div>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-sm mb-1">Total Produtos</div>
                    <div class="text-3xl font-bold text-blue-600"><?php echo count($produtos); ?></div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Products Tab -->
        <?php if ($activeTab === 'products'): ?>
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">Meus Produtos</h1>
                <button onclick="document.getElementById('modal-add-product').classList.remove('hidden')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                    <i class="fas fa-plus"></i> Novo Produto
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="p-4 font-semibold text-gray-600">Imagem</th>
                            <th class="p-4 font-semibold text-gray-600">Nome</th>
                            <th class="p-4 font-semibold text-gray-600">Preço</th>
                            <th class="p-4 font-semibold text-gray-600">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <?php foreach ($produtos as $prod): ?>
                            <tr class="hover:bg-gray-50">
                                <td class="p-4">
                                    <?php if ($prod['imagem']): ?>
                                        <img src="uploads/<?php echo htmlspecialchars($prod['imagem']); ?>" class="w-12 h-12 object-cover rounded-lg border">
                                    <?php else: ?>
                                        <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            <i class="fas fa-image"></i>
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td class="p-4 font-medium text-gray-800"><?php echo htmlspecialchars($prod['nome']); ?></td>
                                <td class="p-4 text-green-600 font-bold">R$ <?php echo number_format($prod['preco'], 2, ',', '.'); ?></td>
                                <td class="p-4">
                                    <button class="text-blue-600 hover:text-blue-800 mr-2"><i class="fas fa-edit"></i></button>
                                    <button class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php if (empty($produtos)): ?>
                    <div class="p-8 text-center text-gray-500">
                        Nenhum produto cadastrado.
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <!-- Orders Tab -->
        <?php if ($activeTab === 'orders'): ?>
            <h1 class="text-2xl font-bold mb-6">Pedidos Recentes</h1>
            <div class="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
                <i class="fas fa-clipboard-list text-4xl mb-3 text-gray-300"></i>
                <p>Nenhum pedido recebido ainda.</p>
            </div>
        <?php endif; ?>

        <!-- Settings Tab -->
        <?php if ($activeTab === 'settings'): ?>
            <h1 class="text-2xl font-bold mb-6">Configurações da Loja</h1>
            <div class="bg-white p-6 rounded-xl shadow-sm max-w-2xl">
                <form>
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-gray-700 mb-1">Nome da Loja</label>
                        <input type="text" class="w-full border rounded-lg p-2" value="Minha Loja Exemplo">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-gray-700 mb-1">Horário de Funcionamento</label>
                        <input type="text" class="w-full border rounded-lg p-2" placeholder="Ex: 08:00 - 18:00">
                    </div>
                    <button class="bg-red-600 text-white px-4 py-2 rounded-lg">Salvar Alterações</button>
                </form>
            </div>
        <?php endif; ?>

    </main>
</div>

<!-- Modal Add Product -->
<div id="modal-add-product" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">Adicionar Produto</h3>
            <button onclick="document.getElementById('modal-add-product').classList.add('hidden')" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        
        <form method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="add_product">
            
            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
                <input type="text" name="nome" class="w-full border rounded-lg p-2" required>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" name="preco" class="w-full border rounded-lg p-2" required>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                    <select name="categoria" class="w-full border rounded-lg p-2">
                        <option>Lanches</option>
                        <option>Bebidas</option>
                        <option>Sobremesas</option>
                        <option>Outros</option>
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea name="descricao" class="w-full border rounded-lg p-2" rows="3"></textarea>
            </div>

            <div class="mb-6">
                <label class="block text-sm font-bold text-gray-700 mb-1">Foto do Produto</label>
                <input type="file" name="imagem" class="w-full border rounded-lg p-2 text-sm text-gray-500">
            </div>

            <div class="flex justify-end gap-3">
                <button type="button" onclick="document.getElementById('modal-add-product').classList.add('hidden')" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold">Salvar Produto</button>
            </div>
        </form>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
