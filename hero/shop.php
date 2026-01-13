<?php
session_start();
require_once 'config.php';
include 'includes/header.php';

// Verificar se é loja
if (!isset($_SESSION['user_id']) || $_SESSION['user_tipo'] !== 'store') {
    // Redireciona ou mostra erro
    // Por enquanto, para facilitar, vamos simular que é loja se não estiver logado ou redirecionar
    if (!isset($_SESSION['user_id'])) {
        echo "<script>window.location.href='login.php';</script>";
        exit;
    } else {
        echo "<div class='container mx-auto p-4'><div class='bg-red-100 text-red-700 p-4 rounded'>Acesso restrito a lojas.</div></div>";
        include 'includes/footer.php';
        exit;
    }
}

$msg = '';

// Adicionar Produto
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    $nome = $_POST['nome'];
    $preco = $_POST['preco'];
    $descricao = $_POST['descricao'];
    $loja_id = 1; // Temporário: Pegar da tabela lojas vinculado ao user_id

    // Upload de Imagem Simples
    $imagem = '';
    if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === 0) {
        $ext = pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION);
        $novo_nome = uniqid() . "." . $ext;
        move_uploaded_file($_FILES['imagem']['tmp_name'], 'uploads/' . $novo_nome);
        $imagem = $novo_nome;
    }

    try {
        // Tentar pegar loja_id do usuário logado
        // $stmt = $pdo->prepare("SELECT id FROM lojas WHERE usuario_id = ?");
        // $stmt->execute([$_SESSION['user_id']]);
        // $loja = $stmt->fetch();
        // $loja_id = $loja ? $loja['id'] : 1; 

        // Como a tabela lojas pode não estar populada corretamente com o usuário atual, vamos inserir com loja_id fixo ou criar lógica
        // Assumindo que a tabela produtos tem loja_id. Se der erro, ajustamos.
        
        $sql = "INSERT INTO produtos (nome, descricao, preco, imagem, loja_id) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $descricao, $preco, $imagem, $loja_id]);
        $msg = "Produto adicionado com sucesso!";
    } catch (PDOException $e) {
        $msg = "Erro ao adicionar: " . $e->getMessage();
    }
}

// Listar Produtos da Loja
// $stmt = $pdo->prepare("SELECT * FROM produtos WHERE loja_id = ?"); // Idealmente filtrar pela loja do usuário
$stmt = $pdo->query("SELECT * FROM produtos ORDER BY id DESC"); // Por enquanto mostra todos para teste
$produtos = $stmt->fetchAll();

?>

<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Painel da Loja</h1>
        <button onclick="document.getElementById('modal-add').classList.remove('hidden')" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <i class="fas fa-plus"></i> Novo Produto
        </button>
    </div>

    <?php if ($msg): ?>
        <div class="bg-green-100 text-green-700 p-4 rounded mb-6"><?php echo $msg; ?></div>
    <?php endif; ?>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full leading-normal">
            <thead>
                <tr>
                    <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Produto</th>
                    <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preço</th>
                    <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($produtos as $p): ?>
                <tr>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 w-10 h-10">
                                <?php if ($p['imagem']): ?>
                                    <img class="w-full h-full rounded-full object-cover" src="uploads/<?php echo htmlspecialchars($p['imagem']); ?>" alt="" />
                                <?php else: ?>
                                    <div class="w-full h-full rounded-full bg-gray-300 flex items-center justify-center"><i class="fas fa-image"></i></div>
                                <?php endif; ?>
                            </div>
                            <div class="ml-3">
                                <p class="text-gray-900 whitespace-no-wrap"><?php echo htmlspecialchars($p['nome']); ?></p>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p class="text-gray-900 whitespace-no-wrap">R$ <?php echo number_format($p['preco'], 2, ',', '.'); ?></p>
                    </td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <span class="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                            <span aria-hidden class="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                            <span class="relative">Editar</span>
                        </span>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Adicionar Produto -->
<div id="modal-add" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Adicionar Produto</h3>
            <form class="mt-2 text-left" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="action" value="add">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Nome</label>
                    <input type="text" name="nome" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Preço</label>
                    <input type="number" step="0.01" name="preco" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
                    <textarea name="descricao" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Imagem</label>
                    <input type="file" name="imagem" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </div>
                <div class="flex items-center justify-between mt-4">
                    <button type="button" onclick="document.getElementById('modal-add').classList.add('hidden')" class="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
