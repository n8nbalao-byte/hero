<?php
session_start();
require_once 'config.php';

$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
    $tipo = $_POST['tipo']; // client, store, courier
    $telefone = $_POST['telefone'];

    // Campos extras
    $veiculo_tipo = $_POST['veiculo_tipo'] ?? null;
    $veiculo_placa = $_POST['veiculo_placa'] ?? null;
    $nome_loja = $_POST['nome_loja'] ?? null;

    try {
        // Verifica email duplicado
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $msg = "Este email já está cadastrado.";
        } else {
            $sql = "INSERT INTO usuarios (nome, email, senha, tipo, telefone, veiculo_tipo, veiculo_placa, nome_loja) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $email, $senha, $tipo, $telefone, $veiculo_tipo, $veiculo_placa, $nome_loja]);

            $msg = "Cadastro realizado com sucesso! Faça login.";
            // Opcional: Redirecionar direto para login
             header("refresh:2;url=login.php");
        }
    } catch (PDOException $e) {
        $msg = "Erro ao cadastrar: " . $e->getMessage();
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
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }
        .register-card {
            max-width: 500px;
            width: 100%;
            background-color: #fff;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .role-box {
            padding: 15px 10px;
            border-radius: 16px;
            border: 2px solid #f0f0f0;
            background-color: #fff;
            text-align: center;
            cursor: pointer;
            transition: 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        .role-box.selected {
            border-color: #DC0000;
            background-color: #fff4f4;
        }
        .form-input {
            width: 100%;
            padding: 12px 15px;
            border-radius: 12px;
            border: 1px solid #ddd;
            font-size: 15px;
            outline: none;
            transition: border-color 0.3s;
        }
        .form-input:focus {
            border-color: #DC0000;
        }
        .btn-register {
            width: 100%;
            padding: 16px;
            background-color: #DC0000;
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(220, 0, 0, 0.2);
            transition: 0.3s;
        }
        .btn-register:hover {
            background-color: #b90000;
        }
    </style>
    <script>
        function selectRole(role) {
            document.querySelectorAll('.role-box').forEach(el => el.classList.remove('selected'));
            document.getElementById('role-' + role).classList.add('selected');
            document.getElementById('input-tipo').value = role;

            document.getElementById('extra-courier').style.display = role === 'courier' ? 'block' : 'none';
            document.getElementById('extra-store').style.display = role === 'store' ? 'block' : 'none';
        }
    </script>
</head>
<body>

<div class="register-card">
    <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Crie sua Conta</h2>
        <p class="text-gray-500">Comece a usar o Hero Delivery hoje mesmo</p>
    </div>

    <?php if ($msg): ?>
        <div class="<?php echo strpos($msg, 'sucesso') !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'; ?> p-3 rounded mb-6 text-sm text-center">
            <?php echo $msg; ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <input type="hidden" name="tipo" id="input-tipo" value="client">

        <div class="grid grid-cols-3 gap-3 mb-6">
            <div id="role-client" class="role-box selected" onclick="selectRole('client')">
                <i class="fas fa-user text-xl text-gray-600"></i>
                <span class="text-sm font-semibold">Cliente</span>
            </div>
            <div id="role-store" class="role-box" onclick="selectRole('store')">
                <i class="fas fa-store text-xl text-gray-600"></i>
                <span class="text-sm font-semibold">Loja</span>
            </div>
            <div id="role-courier" class="role-box" onclick="selectRole('courier')">
                <i class="fas fa-motorcycle text-xl text-gray-600"></i>
                <span class="text-sm font-semibold">Entregador</span>
            </div>
        </div>

        <div class="space-y-4">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input type="text" name="nome" class="form-input" required>
            </div>
            
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" name="email" class="form-input" required>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                    <input type="password" name="senha" class="form-input" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Telefone</label>
                    <input type="text" name="telefone" class="form-input" required>
                </div>
            </div>

            <!-- Campos Extras Courier -->
            <div id="extra-courier" style="display: none;" class="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                <h4 class="font-bold text-gray-700 mb-3 text-sm">Dados do Veículo</h4>
                <div class="space-y-3">
                    <select name="veiculo_tipo" class="form-input">
                        <option value="moto">Moto</option>
                        <option value="carro">Carro</option>
                        <option value="bicicleta">Bicicleta</option>
                    </select>
                    <input type="text" name="veiculo_placa" class="form-input" placeholder="Placa do Veículo">
                </div>
            </div>

            <!-- Campos Extras Loja -->
            <div id="extra-store" style="display: none;" class="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                <h4 class="font-bold text-gray-700 mb-3 text-sm">Dados da Loja</h4>
                <div class="space-y-3">
                    <input type="text" name="nome_loja" class="form-input" placeholder="Nome Fantasia da Loja">
                </div>
            </div>

            <button type="submit" class="btn-register mt-4">Criar Conta</button>
        </div>
    </form>

    <div class="mt-6 text-center text-sm text-gray-600">
        Já tem uma conta? <a href="login.php" class="text-red-600 font-bold hover:underline">Fazer Login</a>
    </div>
</div>

</body>
</html>
