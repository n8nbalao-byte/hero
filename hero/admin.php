<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

// Verificar se é admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_tipo'] !== 'admin') {
    echo "<div class='container mx-auto p-4'><div class='bg-red-100 text-red-700 p-4 rounded'>Acesso restrito.</div></div>";
    include 'includes/footer.php';
    exit;
}

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'delete_user') {
        $id = $_POST['user_id'];
        if ($id != $_SESSION['user_id']) {
            try {
                $pdo->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$id]);
                $msg = "Usuário removido com sucesso.";
            } catch (PDOException $e) {
                $msg = "Erro ao remover usuário: " . $e->getMessage();
            }
        } else {
            $msg = "Você não pode excluir a si mesmo.";
        }
    }
}

// Stats
$total_users = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
$total_stores = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE tipo = 'store'")->fetchColumn();
$orders_today = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE DATE(criado_em) = CURDATE()")->fetchColumn();

// List Users
$users = $pdo->query("SELECT * FROM usuarios ORDER BY id DESC LIMIT 20")->fetchAll();
?>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Painel Administrativo</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
            <h3 class="text-lg font-bold mb-2 text-gray-600">Total Usuários</h3>
            <p class="text-3xl font-bold text-indigo-600"><?php echo $total_users; ?></p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 class="text-lg font-bold mb-2 text-gray-600">Lojas Parceiras</h3>
            <p class="text-3xl font-bold text-purple-600"><?php echo $total_stores; ?></p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 class="text-lg font-bold mb-2 text-gray-600">Pedidos Hoje</h3>
            <p class="text-3xl font-bold text-green-600"><?php echo $orders_today; ?></p>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-4 border-b bg-gray-50">
            <h2 class="font-bold text-gray-700">Usuários Recentes</h2>
        </div>
        <table class="w-full text-left">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="p-4 text-sm text-gray-600">ID</th>
                    <th class="p-4 text-sm text-gray-600">Nome</th>
                    <th class="p-4 text-sm text-gray-600">Email</th>
                    <th class="p-4 text-sm text-gray-600">Tipo</th>
                    <th class="p-4 text-sm text-gray-600">Data Cadastro</th>
                    <th class="p-4 text-sm text-gray-600">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                <?php foreach ($users as $u): ?>
                    <tr class="hover:bg-gray-50">
                        <td class="p-4 font-mono text-xs"><?php echo $u['id']; ?></td>
                        <td class="p-4 font-bold text-gray-800"><?php echo htmlspecialchars($u['nome']); ?></td>
                        <td class="p-4 text-gray-600"><?php echo htmlspecialchars($u['email']); ?></td>
                        <td class="p-4">
                            <span class="px-2 py-1 rounded text-xs font-bold uppercase 
                                <?php 
                                    echo match($u['tipo']) {
                                        'admin' => 'bg-red-100 text-red-700',
                                        'store' => 'bg-purple-100 text-purple-700',
                                        'courier' => 'bg-yellow-100 text-yellow-700',
                                        default => 'bg-gray-100 text-gray-700'
                                    };
                                ?>">
                                <?php echo $u['tipo']; ?>
                            </span>
                        </td>
                        <td class="p-4 text-gray-500 text-sm"><?php echo date('d/m/Y', strtotime($u['criado_em'])); ?></td>
                        <td class="p-4">
                            <?php if ($u['id'] != $_SESSION['user_id']): ?>
                                <form method="POST" onsubmit="return confirm('Tem certeza que deseja excluir este usuário?');">
                                    <input type="hidden" name="action" value="delete_user">
                                    <input type="hidden" name="user_id" value="<?php echo $u['id']; ?>">
                                    <button type="submit" class="text-red-600 hover:text-red-800">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
