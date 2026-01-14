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

$msg = '';

// Ações
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'accept_delivery') {
        $order_id = $_POST['order_id'];
        $courier_id = $_SESSION['user_id'];
        try {
            $stmt = $pdo->prepare("UPDATE pedidos SET status = 'picked_up', entregador_id = ? WHERE id = ? AND status = 'ready'");
            $stmt->execute([$courier_id, $order_id]);
            $msg = "Entrega #$order_id aceita!";
        } catch (PDOException $e) {
            $msg = "Erro ao aceitar entrega: " . $e->getMessage();
        }
    } elseif ($_POST['action'] === 'finish_delivery') {
        $order_id = $_POST['order_id'];
        $courier_id = $_SESSION['user_id'];
        try {
            $stmt = $pdo->prepare("UPDATE pedidos SET status = 'delivered' WHERE id = ? AND entregador_id = ?");
            $stmt->execute([$order_id, $courier_id]);
            $msg = "Entrega #$order_id finalizada!";
        } catch (PDOException $e) {
            $msg = "Erro ao finalizar entrega: " . $e->getMessage();
        }
    }
}

// Buscar Entregas Disponíveis (Status 'ready')
$stmt = $pdo->query("SELECT p.*, u.nome as loja_nome FROM pedidos p JOIN usuarios u ON p.loja_id = u.id WHERE p.status = 'ready' ORDER BY p.criado_em ASC");
$available_deliveries = $stmt->fetchAll();

// Buscar Minhas Entregas Atuais (Status 'picked_up')
$stmt = $pdo->prepare("SELECT p.*, u.nome as loja_nome FROM pedidos p JOIN usuarios u ON p.loja_id = u.id WHERE p.entregador_id = ? AND p.status = 'picked_up'");
$stmt->execute([$_SESSION['user_id']]);
$my_deliveries = $stmt->fetchAll();

?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Painel do Entregador</h1>
    
    <?php if ($msg): ?>
        <div class="bg-green-100 text-green-700 p-4 rounded mb-6 flex items-center gap-2">
            <i class="fas fa-check-circle"></i> <?php echo $msg; ?>
        </div>
    <?php endif; ?>

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

    <!-- Minhas Entregas em Andamento -->
    <?php if (!empty($my_deliveries)): ?>
        <h2 class="text-xl font-bold mb-4 text-blue-800">Em Andamento</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <?php foreach ($my_deliveries as $delivery): ?>
                <div class="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-lg">Pedido #<?php echo $delivery['id']; ?></h3>
                            <p class="text-gray-600"><i class="fas fa-store mr-1"></i> <?php echo htmlspecialchars($delivery['loja_nome']); ?></p>
                        </div>
                        <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">Em Rota</span>
                    </div>
                    
                    <div class="mb-4 text-gray-700">
                        <p class="mb-2"><i class="fas fa-map-marker-alt text-red-500 mr-2"></i> <strong>Destino:</strong></p>
                        <p class="ml-6 text-sm bg-gray-50 p-2 rounded border"><?php echo htmlspecialchars($delivery['endereco_entrega']); ?></p>
                    </div>

                    <div class="flex justify-between items-center mt-4">
                        <span class="font-bold text-lg">R$ <?php echo number_format($delivery['total'], 2, ',', '.'); ?></span>
                        <form method="POST">
                            <input type="hidden" name="action" value="finish_delivery">
                            <input type="hidden" name="order_id" value="<?php echo $delivery['id']; ?>">
                            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-md w-full md:w-auto">
                                <i class="fas fa-check mr-2"></i> Finalizar Entrega
                            </button>
                        </form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- Entregas Disponíveis -->
    <h2 class="text-xl font-bold mb-4">Entregas Disponíveis</h2>
    <?php if (empty($available_deliveries)): ?>
        <div class="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Nenhuma entrega disponível no momento. Aguarde...
        </div>
    <?php else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($available_deliveries as $delivery): ?>
                <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-100">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-gray-800">Pedido #<?php echo $delivery['id']; ?></h3>
                            <p class="text-sm text-gray-500"><?php echo date('H:i', strtotime($delivery['criado_em'])); ?></p>
                        </div>
                        <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">R$ 5,00 (Taxa)</span>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-1"><i class="fas fa-store mr-1 text-gray-400"></i> <?php echo htmlspecialchars($delivery['loja_nome']); ?></p>
                        <p class="text-sm text-gray-800 font-medium"><i class="fas fa-map-pin mr-1 text-red-500"></i> <?php echo htmlspecialchars($delivery['endereco_entrega']); ?></p>
                    </div>

                    <form method="POST" class="mt-4">
                        <input type="hidden" name="action" value="accept_delivery">
                        <input type="hidden" name="order_id" value="<?php echo $delivery['id']; ?>">
                        <button type="submit" class="w-full bg-gray-900 text-white py-2 rounded-lg font-bold hover:bg-gray-800 transition">
                            Aceitar Corrida
                        </button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
