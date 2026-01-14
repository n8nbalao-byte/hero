<?php
require_once 'config.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Tabela Usuarios
    $sql = "CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        tipo ENUM('client', 'store', 'courier', 'admin') NOT NULL DEFAULT 'client',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);
    echo "Tabela 'usuarios' verificada/criada.<br>";

    // 2. Tabela Produtos
    $sql = "CREATE TABLE IF NOT EXISTS produtos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10, 2) NOT NULL,
        imagem VARCHAR(255),
        loja_id INT,
        categoria VARCHAR(100),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loja_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )";
    $pdo->exec($sql);
    echo "Tabela 'produtos' verificada/criada.<br>";

    // 3. Tabela Pedidos
    $sql = "CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        loja_id INT NOT NULL,
        entregador_id INT DEFAULT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'accepted', 'ready', 'picked_up', 'delivered', 'cancelled') DEFAULT 'pending',
        endereco_entrega TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
        FOREIGN KEY (loja_id) REFERENCES usuarios(id),
        FOREIGN KEY (entregador_id) REFERENCES usuarios(id)
    )";
    $pdo->exec($sql);
    echo "Tabela 'pedidos' verificada/criada.<br>";

    // 4. Tabela Itens do Pedido
    $sql = "CREATE TABLE IF NOT EXISTS itens_pedido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pedido_id INT NOT NULL,
        produto_id INT NOT NULL,
        quantidade INT NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )";
    $pdo->exec($sql);
    echo "Tabela 'itens_pedido' verificada/criada.<br>";

    echo "Banco de dados configurado com sucesso!";

} catch (PDOException $e) {
    die("Erro ao configurar banco de dados: " . $e->getMessage());
}
?>
