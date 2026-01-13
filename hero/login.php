<?php
session_start();
require_once 'config.php';

$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($senha, $user['senha'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_nome'] = $user['nome'];
        $_SESSION['user_tipo'] = $user['tipo'];

        if ($user['tipo'] === 'store') {
            header("Location: shop.php");
        } elseif ($user['tipo'] === 'courier') {
            header("Location: courier.php");
        } elseif ($user['tipo'] === 'admin') {
            header("Location: admin.php");
        } else {
            header("Location: index.php");
        }
        exit;
    } else {
        $msg = "Email ou senha inválidos.";
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
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            max-width: 400px;
            width: 100%;
            background-color: #fff;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            text-align: center;
        }
        .form-input {
            width: 100%;
            padding: 12px 15px;
            margin-bottom: 20px;
            border-radius: 10px;
            border: 1px solid #ddd;
            font-size: 16px;
            outline: none;
            box-sizing: border-box;
        }
        .btn-login {
            width: 100%;
            padding: 14px;
            background-color: #DC0000;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
        }
        .btn-login:hover {
            background-color: #b90000;
        }
    </style>
</head>
<body>

<div class="login-card">
    <div class="mb-6 flex justify-center">
        <!-- Logo -->
        <a href="index.php" class="flex items-center gap-2 text-red-600">
            <i class="fas fa-motorcycle text-3xl"></i>
            <span class="text-2xl font-bold">Hero Delivery</span>
        </a>
    </div>

    <h2 class="text-2xl font-bold mb-6 text-gray-800">Bem-vindo de volta!</h2>

    <?php if ($msg): ?>
        <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            <?php echo $msg; ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <input type="email" name="email" class="form-input" placeholder="Seu Email" required>
        <input type="password" name="senha" class="form-input" placeholder="Sua Senha" required>
        
        <button type="submit" class="btn-login">Entrar</button>
    </form>

    <div class="mt-6 text-sm text-gray-600">
        Não tem uma conta? <a href="register.php" class="text-red-600 font-bold hover:underline">Cadastre-se</a>
    </div>
    
    <div class="mt-4">
        <a href="index.php" class="text-gray-400 hover:text-gray-600 text-sm">Voltar para Home</a>
    </div>
</div>

<!-- FontAwesome for Icon -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

</body>
</html>
