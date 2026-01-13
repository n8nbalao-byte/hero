<?php
session_start();
require_once 'config.php';

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = $_POST['senha'];

    if ($email && $senha) {
        try {
            $stmt = $pdo->prepare("SELECT id, nome, senha, tipo FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $usuario = $stmt->fetch();

            if ($usuario && password_verify($senha, $usuario['senha'])) {
                // Login sucesso
                $_SESSION['user_id'] = $usuario['id'];
                $_SESSION['user_nome'] = $usuario['nome'];
                $_SESSION['user_tipo'] = $usuario['tipo'];
                header('Location: index.php');
                exit;
            } else {
                // Tentar verificar sem hash (para migração/teste se senhas estiverem em texto plano, embora inseguro)
                // Remover este bloco em produção se todas senhas estiverem hash
                if ($usuario && $senha === $usuario['senha']) {
                     $_SESSION['user_id'] = $usuario['id'];
                     $_SESSION['user_nome'] = $usuario['nome'];
                     $_SESSION['user_tipo'] = $usuario['tipo'];
                     header('Location: index.php');
                     exit;
                }
                $erro = 'E-mail ou senha inválidos.';
            }
        } catch (PDOException $e) {
            $erro = 'Erro ao processar login.';
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
    <title>Login - Hero Delivery</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        
        <?php if ($erro): ?>
            <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                <?php echo $erro; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="email">E-mail</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" name="email" type="email" placeholder="seu@email.com" required>
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="senha">Senha</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="senha" name="senha" type="password" placeholder="********" required>
            </div>
            <div class="flex items-center justify-between">
                <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" type="submit">
                    Entrar
                </button>
            </div>
            <div class="mt-4 text-center">
                <a href="register.php" class="text-sm text-blue-600 hover:text-blue-800">Não tem conta? Cadastre-se</a>
            </div>
            <div class="mt-2 text-center">
                <a href="index.php" class="text-sm text-gray-600 hover:text-gray-800">Voltar para Home</a>
            </div>
        </form>
    </div>
</body>
</html>
