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
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'add_product') {
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
    } elseif ($_POST['action'] === 'delete_product') {
        $id = $_POST['product_id'];
        try {
            // Verifica se o produto pertence à loja
            $stmt = $pdo->prepare("DELETE FROM produtos WHERE id = ? AND loja_id = ?");
            $stmt->execute([$id, $loja_id]);
            $msg = "Produto removido com sucesso!";
        } catch (PDOException $e) {
            $msg = "Erro ao remover produto: " . $e->getMessage();
        }
    } elseif ($_POST['action'] === 'edit_product') {
        $id = $_POST['product_id'];
        $nome = $_POST['nome'];
        $preco = str_replace(',', '.', $_POST['preco']); // Converte formato BR para SQL
        $descricao = $_POST['descricao'];
        $categoria = $_POST['categoria'];
        
        try {
            // Upload Imagem (se houver nova)
            if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
                $ext = pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION);
                $new_name = uniqid() . "." . $ext;
                move_uploaded_file($_FILES['imagem']['tmp_name'], "uploads/" . $new_name);
                
                $stmt = $pdo->prepare("UPDATE produtos SET nome=?, preco=?, descricao=?, categoria=?, imagem=? WHERE id=? AND loja_id=?");
                $stmt->execute([$nome, $preco, $descricao, $categoria, $new_name, $id, $loja_id]);
            } else {
                $stmt = $pdo->prepare("UPDATE produtos SET nome=?, preco=?, descricao=?, categoria=? WHERE id=? AND loja_id=?");
                $stmt->execute([$nome, $preco, $descricao, $categoria, $id, $loja_id]);
            }
            $msg = "Produto atualizado com sucesso!";
        } catch (PDOException $e) {
            $msg = "Erro ao atualizar produto: " . $e->getMessage();
        }
    } elseif ($_POST['action'] === 'update_settings') {
        $nome_loja = $_POST['nome_loja'];
        $horario = $_POST['horario_funcionamento'];
        $telefone = $_POST['telefone'];
        $endereco = $_POST['endereco_loja'];
        
        try {
            $stmt = $pdo->prepare("UPDATE usuarios SET nome_loja=?, horario_funcionamento=?, telefone=?, endereco_loja=? WHERE id=?");
            $stmt->execute([$nome_loja, $horario, $telefone, $endereco, $loja_id]);
            $_SESSION['user_nome_loja'] = $nome_loja; // Atualiza sessão se necessário
            $msg = "Configurações salvas!";
            $activeTab = 'settings';
        } catch (PDOException $e) {
            $msg = "Erro ao salvar configurações: " . $e->getMessage();
        }
    } elseif ($_POST['action'] === 'update_status') {
        $order_id = $_POST['order_id'];
        $new_status = $_POST['new_status'];
        try {
            $stmt = $pdo->prepare("UPDATE pedidos SET status = ? WHERE id = ? AND loja_id = ?");
            $stmt->execute([$new_status, $order_id, $loja_id]);
            $msg = "Status do pedido #$order_id atualizado!";
            $activeTab = 'orders';
        } catch (PDOException $e) {
            $msg = "Erro ao atualizar pedido: " . $e->getMessage();
        }
    }
}

// Buscar Dados
// 1. Produtos
$stmt = $pdo->query("SELECT * FROM produtos ORDER BY id DESC");
$produtos = $stmt->fetchAll();

// 2. Pedidos
$stmt = $pdo->prepare("
    SELECT p.*, u.nome as cliente_nome 
    FROM pedidos p 
    JOIN usuarios u ON p.cliente_id = u.id 
    WHERE p.loja_id = ? 
    ORDER BY p.criado_em DESC
");
$stmt->execute([$loja_id]);
$pedidos = $stmt->fetchAll();

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
            <?php 
                $pending_count = count(array_filter($pedidos, fn($p) => $p['status'] === 'pending'));
                $sales_today = 0; // Calcular se necessário
            ?>
            <h1 class="text-2xl font-bold mb-6">Visão Geral</h1>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-sm mb-1">Vendas Hoje</div>
                    <div class="text-3xl font-bold text-gray-800">R$ 0,00</div>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-sm mb-1">Pedidos Pendentes</div>
                    <div class="text-3xl font-bold text-yellow-600"><?php echo $pending_count; ?></div>
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
            <?php if (empty($pedidos)): ?>
                <div class="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
                    <i class="fas fa-clipboard-list text-4xl mb-3 text-gray-300"></i>
                    <p>Nenhum pedido recebido ainda.</p>
                </div>
            <?php else: ?>
                <div class="space-y-4">
                    <?php foreach ($pedidos as $pedido): ?>
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div class="p-4 bg-gray-50 border-b flex justify-between items-center">
                                <div>
                                    <span class="font-bold text-gray-800">Pedido #<?php echo $pedido['id']; ?></span>
                                    <span class="mx-2 text-gray-400">|</span>
                                    <span class="text-gray-600"><?php echo htmlspecialchars($pedido['cliente_nome']); ?></span>
                                </div>
                                <span class="font-bold text-sm uppercase px-3 py-1 rounded-full 
                                    <?php 
                                        echo match($pedido['status']) {
                                            'pending' => 'bg-yellow-100 text-yellow-700',
                                            'accepted' => 'bg-blue-100 text-blue-700',
                                            'ready' => 'bg-purple-100 text-purple-700',
                                            'picked_up' => 'bg-indigo-100 text-indigo-700',
                                            'delivered' => 'bg-green-100 text-green-700',
                                            'cancelled' => 'bg-red-100 text-red-700',
                                            default => 'bg-gray-100 text-gray-700'
                                        };
                                    ?>">
                                    <?php echo $pedido['status']; ?>
                                </span>
                            </div>
                            <div class="p-4">
                                <div class="flex justify-between items-center mb-4">
                                    <div class="text-sm text-gray-600">
                                        <p><strong>Entrega:</strong> <?php echo htmlspecialchars($pedido['endereco_entrega']); ?></p>
                                        <p><strong>Data:</strong> <?php echo date('d/m/Y H:i', strtotime($pedido['criado_em'])); ?></p>
                                    </div>
                                    <div class="text-xl font-bold text-gray-800">
                                        R$ <?php echo number_format($pedido['total'], 2, ',', '.'); ?>
                                    </div>
                                </div>
                                
                                <div class="flex gap-2 justify-end border-t pt-4">
                                    <?php if ($pedido['status'] === 'pending'): ?>
                                        <form method="POST">
                                            <input type="hidden" name="action" value="update_status">
                                            <input type="hidden" name="order_id" value="<?php echo $pedido['id']; ?>">
                                            <input type="hidden" name="new_status" value="accepted">
                                            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold">Aceitar Pedido</button>
                                        </form>
                                        <form method="POST">
                                            <input type="hidden" name="action" value="update_status">
                                            <input type="hidden" name="order_id" value="<?php echo $pedido['id']; ?>">
                                            <input type="hidden" name="new_status" value="cancelled">
                                            <button type="submit" class="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200 font-bold">Rejeitar</button>
                                        </form>
                                    <?php elseif ($pedido['status'] === 'accepted'): ?>
                                        <form method="POST">
                                            <input type="hidden" name="action" value="update_status">
                                            <input type="hidden" name="order_id" value="<?php echo $pedido['id']; ?>">
                                            <input type="hidden" name="new_status" value="ready">
                                            <button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-bold">Marcar como Pronto</button>
                                        </form>
                                    <?php elseif ($pedido['status'] === 'ready'): ?>
                                        <div class="text-gray-500 italic flex items-center gap-2">
                                            <i class="fas fa-spinner fa-spin"></i> Aguardando Entregador...
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
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

<!-- Modal Edit Product -->
<div id="modal-edit-product" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">Editar Produto</h3>
            <button onclick="document.getElementById('modal-edit-product').classList.add('hidden')" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        
        <form method="POST" enctype="multipart/form-data" id="form-edit-product">
            <input type="hidden" name="action" value="edit_product">
            <input type="hidden" name="product_id" id="edit-id">
            
            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
                <input type="text" name="nome" id="edit-nome" class="w-full border rounded-lg p-2" required>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Preço (R$)</label>
                    <input type="text" name="preco" id="edit-preco" class="w-full border rounded-lg p-2" required>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                    <select name="categoria" id="edit-categoria" class="w-full border rounded-lg p-2">
                        <option value="Lanches">Lanches</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Sobremesas">Sobremesas</option>
                        <option value="Combos">Combos</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea name="descricao" id="edit-descricao" class="w-full border rounded-lg p-2" rows="3"></textarea>
            </div>

            <div class="mb-6">
                <label class="block text-sm font-bold text-gray-700 mb-1">Imagem (Opcional)</label>
                <input type="file" name="imagem" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100">
                <p class="text-xs text-gray-500 mt-1">Deixe em branco para manter a atual.</p>
            </div>

            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                Salvar Alterações
            </button>
        </form>
    </div>
</div>

<script>
function openEditModal(prod) {
    document.getElementById('edit-id').value = prod.id;
    document.getElementById('edit-nome').value = prod.nome;
    document.getElementById('edit-preco').value = prod.preco;
    document.getElementById('edit-descricao').value = prod.descricao;
    document.getElementById('edit-categoria').value = prod.categoria;
    document.getElementById('modal-edit-product').classList.remove('hidden');
}
</script>

<?php include 'includes/footer.php'; ?>
