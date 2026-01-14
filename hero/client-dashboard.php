<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Buscar Pedidos do Cliente
$stmt = $pdo->prepare("
    SELECT p.*, u.nome as loja_nome 
    FROM pedidos p 
    JOIN usuarios u ON p.loja_id = u.id 
    WHERE p.cliente_id = ? 
    ORDER BY p.criado_em DESC
");
$stmt->execute([$user_id]);
$pedidos = $stmt->fetchAll();

// Status labels
$status_labels = [
    'pending' => ['label' => 'Pendente', 'class' => 'bg-yellow-100 text-yellow-700'],
    'accepted' => ['label' => 'Aceito pela Loja', 'class' => 'bg-blue-100 text-blue-700'],
    'ready' => ['label' => 'Pronto para Entrega', 'class' => 'bg-purple-100 text-purple-700'],
    'picked_up' => ['label' => 'Saiu para Entrega', 'class' => 'bg-indigo-100 text-indigo-700'],
    'delivered' => ['label' => 'Entregue', 'class' => 'bg-green-100 text-green-700'],
    'cancelled' => ['label' => 'Cancelado', 'class' => 'bg-red-100 text-red-700'],
];
?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Meus Pedidos</h1>

    <?php if (isset($_GET['success'])): ?>
        <div class="bg-green-100 text-green-700 p-4 rounded mb-6 flex items-center gap-2">
            <i class="fas fa-check-circle"></i> Pedido realizado com sucesso! Acompanhe o status abaixo.
        </div>
    <?php endif; ?>

    <?php if (empty($pedidos)): ?>
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
            <i class="fas fa-receipt text-6xl text-gray-200 mb-4"></i>
            <p class="text-gray-500 text-lg mb-4">Você ainda não fez nenhum pedido.</p>
            <a href="index.php" class="btn-primary inline-block">Fazer meu primeiro pedido</a>
        </div>
    <?php else: ?>
        <div class="space-y-6">
            <?php foreach ($pedidos as $pedido): ?>
                <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
                        <div>
                            <span class="font-bold text-gray-700">Pedido #<?php echo $pedido['id']; ?></span>
                            <span class="text-gray-500 text-sm mx-2">•</span>
                            <span class="text-gray-600"><?php echo date('d/m/Y H:i', strtotime($pedido['criado_em'])); ?></span>
                            <span class="text-gray-500 text-sm mx-2">•</span>
                            <span class="font-semibold text-gray-800"><?php echo htmlspecialchars($pedido['loja_nome']); ?></span>
                        </div>
                        <?php 
                            $st = $status_labels[$pedido['status']] ?? ['label' => $pedido['status'], 'class' => 'bg-gray-100 text-gray-700'];
                        ?>
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide <?php echo $st['class']; ?>">
                            <?php echo $st['label']; ?>
                        </span>
                    </div>
                    
                    <div class="p-4">
                        <?php
                            // Buscar Itens deste pedido
                            $stmtItens = $pdo->prepare("
                                SELECT ip.*, p.nome, p.imagem 
                                FROM itens_pedido ip 
                                JOIN produtos p ON ip.produto_id = p.id 
                                WHERE ip.pedido_id = ?
                            ");
                            $stmtItens->execute([$pedido['id']]);
                            $itens = $stmtItens->fetchAll();
                        ?>
                        <div class="divide-y">
                            <?php foreach ($itens as $item): ?>
                                <div class="py-3 flex items-center gap-4">
                                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden">
                                        <?php if ($item['imagem']): ?>
                                            <img src="uploads/<?php echo htmlspecialchars($item['imagem']); ?>" class="w-full h-full object-cover">
                                        <?php else: ?>
                                            <i class="fas fa-image"></i>
                                        <?php endif; ?>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-800"><?php echo htmlspecialchars($item['nome']); ?></p>
                                        <p class="text-sm text-gray-500"><?php echo $item['quantidade']; ?>x R$ <?php echo number_format($item['preco_unitario'], 2, ',', '.'); ?></p>
                                    </div>
                                    <div class="font-bold text-gray-800">
                                        R$ <?php echo number_format($item['quantidade'] * $item['preco_unitario'], 2, ',', '.'); ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <div class="mt-4 pt-4 border-t flex justify-between items-center">
                            <div class="text-sm text-gray-600">
                                <i class="fas fa-map-marker-alt text-red-500 mr-1"></i> 
                                <?php echo htmlspecialchars($pedido['endereco_entrega']); ?>
                            </div>
                            <div class="text-xl font-bold text-gray-900">
                                Total: R$ <?php echo number_format($pedido['total'], 2, ',', '.'); ?>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
