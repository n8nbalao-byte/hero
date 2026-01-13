<?php
session_start();
require_once 'config.php';

$erro = '';
$sucesso = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = $_POST['senha'];
    $tipo = 'client'; // Padrão

    if ($nome && $email && $senha) {
        try {
            // Verifica se email já existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $erro = 'E-mail já cadastrado.';
            } else {
                $hash = password_hash($senha, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
                if ($stmt->execute([$nome, $email, $hash, $tipo])) {
                    $sucesso = 'Cadastro realizado com sucesso! <a href="login.php" class="underline">Faça login</a>.';
                } else {
                    $erro = 'Erro ao cadastrar.';
                }
            }
        } catch (PDOException $e) {
            $erro = 'Erro no banco de dados: ' . $e->getMessage();
        }
    } else {
        $erro = 'Preencha todos os campos.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro - Hero Delivery</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Criar Conta</h2>
        
        <?php if ($erro): ?>
            <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                <?php echo $erro; ?>
            </div>
        <?php endif; ?>
        <?php if ($sucesso): ?>
            <div class="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
                <?php echo $sucesso; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="nome">Nome Completo</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="nome" name="nome" type="text" placeholder="Seu Nome" required>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="email">E-mail</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" name="email" type="email" placeholder="seu@email.com" required>
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="senha">Senha</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="senha" name="senha" type="password" placeholder="********" required>
            </div>
            <div class="flex items-center justify-between">
                <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" type="submit">
                    Cadastrar
                </button>
            </div>
            <div class="mt-4 text-center">
                <a href="login.php" class="text-sm text-blue-600 hover:text-blue-800">Já tem conta? Faça login</a>
            </div>
        </form>
    </div>
</body>
</html>
