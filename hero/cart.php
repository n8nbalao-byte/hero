<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

// Inicializa carrinho se não existir
if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

$msg = '';

// Ações do Carrinho
if (isset($_POST['action'])) {
    if ($_POST['action'] === 'add') {
        $id = $_POST['product_id'];
        $qtd = (int)$_POST['quantity'];
        
        // Busca info do produto para garantir preço atual
        $stmt = $pdo->prepare("SELECT * FROM produtos WHERE id = ?");
        $stmt->execute([$id]);
        $prod = $stmt->fetch();

        if ($prod) {
            if (isset($_SESSION['cart'][$id])) {
                $_SESSION['cart'][$id]['quantidade'] += $qtd;
            } else {
                $_SESSION['cart'][$id] = [
                    'id' => $prod['id'],
                    'nome' => $prod['nome'],
                    'preco' => $prod['preco'],
                    'imagem' => $prod['imagem'],
                    'loja_id' => $prod['loja_id'],
                    'quantidade' => $qtd
                ];
            }
            $msg = "Produto adicionado ao carrinho!";
        }
    } elseif ($_POST['action'] === 'remove') {
        $id = $_POST['product_id'];
        unset($_SESSION['cart'][$id]);
        $msg = "Produto removido.";
    } elseif ($_POST['action'] === 'update') {
        $id = $_POST['product_id'];
        $qtd = (int)$_POST['quantity'];
        if ($qtd > 0) {
            $_SESSION['cart'][$id]['quantidade'] = $qtd;
        } else {
            unset($_SESSION['cart'][$id]);
        }
        $msg = "Carrinho atualizado.";
    } elseif ($_POST['action'] === 'checkout') {
        // Finalizar Pedido
        if (!isset($_SESSION['user_id'])) {
            header("Location: login.php?redirect=cart.php");
            exit;
        }

        if (empty($_SESSION['cart'])) {
            $msg = "Carrinho vazio.";
        } else {
            // Agrupar itens por loja (cada loja gera um pedido diferente, ou tudo num só? 
            // O modelo Uber Eats geralmente separa pedidos por loja. Vamos simplificar: 
            // Se houver produtos de lojas diferentes, gerar múltiplos pedidos ou bloquear.
            // Vamos permitir múltiplos pedidos para simplificar a UX do usuário, mas no backend criar N pedidos.)
            
            $byStore = [];
            foreach ($_SESSION['cart'] as $item) {
                $byStore[$item['loja_id']][] = $item;
            }

            $endereco = $_POST['endereco'];
            $cliente_id = $_SESSION['user_id'];

            try {
                $pdo->beginTransaction();

                foreach ($byStore as $loja_id => $items) {
                    $total = 0;
                    foreach ($items as $item) {
                        $total += $item['preco'] * $item['quantidade'];
                    }

                    // Criar Pedido
                    $stmt = $pdo->prepare("INSERT INTO pedidos (cliente_id, loja_id, total, status, endereco_entrega, criado_em) VALUES (?, ?, ?, 'pending', ?, NOW())");
                    $stmt->execute([$cliente_id, $loja_id, $total, $endereco]);
                    $pedido_id = $pdo->lastInsertId();

                    // Inserir Itens
                    $stmtItem = $pdo->prepare("INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)");
                    foreach ($items as $item) {
                        $stmtItem->execute([$pedido_id, $item['id'], $item['quantidade'], $item['preco']]);
                    }
                }

                $pdo->commit();
                $_SESSION['cart'] = []; // Limpa carrinho
                header("Location: client-dashboard.php?success=1");
                exit;

            } catch (Exception $e) {
                $pdo->rollBack();
                $msg = "Erro ao finalizar pedido: " . $e->getMessage();
            }
        }
    }
}

// Calcular Total
$total_geral = 0;
foreach ($_SESSION['cart'] as $item) {
    $total_geral += $item['preco'] * $item['quantidade'];
}
?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Meu Carrinho</h1>

    <?php if ($msg): ?>
        <div class="bg-blue-100 text-blue-700 p-4 rounded mb-6">
            <?php echo $msg; ?>
        </div>
    <?php endif; ?>

    <?php if (empty($_SESSION['cart'])): ?>
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
            <i class="fas fa-shopping-cart text-6xl text-gray-200 mb-4"></i>
            <p class="text-gray-500 text-lg mb-4">Seu carrinho está vazio.</p>
            <a href="index.php" class="btn-primary inline-block">Ver Produtos</a>
        </div>
    <?php else: ?>
        <div class="flex flex-col md:flex-row gap-8">
            <!-- Lista de Itens -->
            <div class="flex-1">
                <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="p-4 text-left text-sm font-semibold text-gray-600">Produto</th>
                                <th class="p-4 text-center text-sm font-semibold text-gray-600">Qtd</th>
                                <th class="p-4 text-right text-sm font-semibold text-gray-600">Subtotal</th>
                                <th class="p-4 text-center text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <?php foreach ($_SESSION['cart'] as $id => $item): ?>
                                <tr>
                                    <td class="p-4 flex items-center gap-4">
                                        <?php if ($item['imagem']): ?>
                                            <img src="uploads/<?php echo htmlspecialchars($item['imagem']); ?>" class="w-16 h-16 object-cover rounded-lg">
                                        <?php else: ?>
                                            <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                <i class="fas fa-image"></i>
                                            </div>
                                        <?php endif; ?>
                                        <div>
                                            <h3 class="font-bold text-gray-800"><?php echo htmlspecialchars($item['nome']); ?></h3>
                                            <p class="text-sm text-gray-500">R$ <?php echo number_format($item['preco'], 2, ',', '.'); ?></p>
                                        </div>
                                    </td>
                                    <td class="p-4 text-center">
                                        <form method="POST" class="inline-flex items-center">
                                            <input type="hidden" name="action" value="update">
                                            <input type="hidden" name="product_id" value="<?php echo $id; ?>">
                                            <input type="number" name="quantity" value="<?php echo $item['quantidade']; ?>" min="1" class="w-16 border rounded p-1 text-center" onchange="this.form.submit()">
                                        </form>
                                    </td>
                                    <td class="p-4 text-right font-bold text-gray-800">
                                        R$ <?php echo number_format($item['preco'] * $item['quantidade'], 2, ',', '.'); ?>
                                    </td>
                                    <td class="p-4 text-center">
                                        <form method="POST">
                                            <input type="hidden" name="action" value="remove">
                                            <input type="hidden" name="product_id" value="<?php echo $id; ?>">
                                            <button type="submit" class="text-red-500 hover:text-red-700">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Resumo do Pedido -->
            <div class="w-full md:w-80">
                <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                    <h2 class="text-xl font-bold mb-4">Resumo</h2>
                    <div class="flex justify-between mb-2 text-gray-600">
                        <span>Subtotal</span>
                        <span>R$ <?php echo number_format($total_geral, 2, ',', '.'); ?></span>
                    </div>
                    <div class="flex justify-between mb-4 text-gray-600">
                        <span>Entrega</span>
                        <span class="text-green-600">Grátis</span>
                    </div>
                    <div class="border-t pt-4 mb-6 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>R$ <?php echo number_format($total_geral, 2, ',', '.'); ?></span>
                    </div>

                    <form method="POST">
                        <input type="hidden" name="action" value="checkout">
                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-1">Endereço de Entrega</label>
                            <textarea name="endereco" class="w-full border rounded-lg p-2 text-sm" rows="3" required placeholder="Rua, Número, Bairro..."></textarea>
                        </div>
                        
                        <?php if (isset($_SESSION['user_id'])): ?>
                            <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
                                Finalizar Pedido
                            </button>
                        <?php else: ?>
                            <a href="login.php?redirect=cart.php" class="block text-center w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">
                                Faça Login para Finalizar
                            </a>
                        <?php endif; ?>
                    </form>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
