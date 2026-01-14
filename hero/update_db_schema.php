<?php
require_once 'config.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Adicionar colunas faltantes na tabela usuarios
    $columns = [
        "ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)",
        "ADD COLUMN IF NOT EXISTS nome_loja VARCHAR(255)",
        "ADD COLUMN IF NOT EXISTS veiculo_tipo VARCHAR(50)",
        "ADD COLUMN IF NOT EXISTS veiculo_placa VARCHAR(20)",
        "ADD COLUMN IF NOT EXISTS horario_funcionamento VARCHAR(255)",
        "ADD COLUMN IF NOT EXISTS endereco_loja TEXT"
    ];

    foreach ($columns as $col) {
        try {
            $pdo->exec("ALTER TABLE usuarios $col");
            echo "Coluna adicionada/verificada: $col<br>";
        } catch (PDOException $e) {
            // Ignora erro se coluna já existir (em alguns bancos IF NOT EXISTS não funciona no ADD COLUMN)
            // Mas no MySQL 8.0+ funciona. Para versões antigas, o catch captura.
            echo "Info: " . $e->getMessage() . "<br>";
        }
    }

    echo "Schema do banco de dados atualizado com sucesso!";

} catch (PDOException $e) {
    die("Erro ao atualizar schema: " . $e->getMessage());
}
?>
