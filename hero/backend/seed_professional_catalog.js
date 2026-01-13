require('dotenv').config();
const db = require('./src/database');
const bcrypt = require('bcryptjs');

// Helper para gerar descrições HTML
const createDescription = (desc, specs, benefits, usage, state, warranty) => {
  return `
    <div class="product-details">
      <p class="intro"><strong>${desc}</strong></p>
      
      <h3>📋 Especificações Técnicas</h3>
      <ul>
        ${specs.map(s => `<li>${s}</li>`).join('')}
      </ul>

      <h3>✅ Principais Benefícios</h3>
      <ul>
        ${benefits.map(b => `<li>${b}</li>`).join('')}
      </ul>

      <h3>🎯 Indicação de Uso</h3>
      <p>${usage}</p>

      <div class="meta-info" style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 8px;">
        <p><strong>Estado:</strong> ${state}</p>
        <p><strong>Garantia:</strong> ${warranty}</p>
      </div>
    </div>
  `.trim();
};

const shops = [
  {
    name: 'TechZone Informática',
    email: 'techzone@teste.com',
    category: 'Informática',
    lat: -22.905560,
    lon: -47.060830,
    products: [
      {
        nome: 'Notebook Dell Latitude 3420',
        preco: 3899.90,
        cat: 'Notebooks',
        img: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
        desc: 'Notebook corporativo de alta performance, ideal para multitarefas e produtividade.',
        specs: ['Processador Intel Core i5 11ª Geração', '8GB RAM DDR4', 'SSD 256GB NVMe', 'Tela 14" HD Antirreflexo', 'Windows 11 Pro'],
        benefits: ['Inicialização em segundos', 'Bateria de longa duração', 'Teclado resistente a derramamento de líquidos', 'Leve e portátil'],
        usage: 'Ideal para escritórios, home office, estudantes e profissionais que precisam de mobilidade.',
        state: 'Novo (Lacrado)',
        warranty: '12 Meses Dell On-Site'
      },
      {
        nome: 'Notebook Gamer Alienware m15 R7',
        preco: 12499.00,
        cat: 'Notebooks',
        img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
        desc: 'A besta dos games. Desempenho extremo para os jogos mais pesados da atualidade.',
        specs: ['Intel Core i7 12700H', '16GB RAM DDR5', 'SSD 1TB NVMe', 'RTX 3070 Ti 8GB', 'Tela 240Hz QHD'],
        benefits: ['Roda tudo no Ultra', 'Refrigeração Cryo-Tech avançada', 'Design futurista com RGB', 'Taxa de atualização competitiva'],
        usage: 'Gamers hardcore, streamers e profissionais de renderização 3D.',
        state: 'Novo',
        warranty: '12 Meses Premium Support'
      },
      {
        nome: 'Projetor Epson PowerLite E20',
        preco: 3200.00,
        cat: 'Projetor multimídia',
        img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        desc: 'Projeção brilhante e nítida para apresentações impactantes.',
        specs: ['3400 Lumens', 'Tecnologia 3LCD', 'Conexão HDMI', 'Alto-falante integrado 5W', 'Durabilidade da lâmpada até 12.000h'],
        benefits: ['Cores 3x mais brilhantes', 'Fácil instalação', 'Ótimo custo-benefício para escolas e empresas'],
        usage: 'Salas de aula, reuniões corporativas e home cinema básico.',
        state: 'Novo',
        warranty: '3 Anos Epson'
      },
      {
        nome: 'Webcam Logitech C920s Pro',
        preco: 450.00,
        cat: 'Acessórios de vídeo',
        img: 'https://images.unsplash.com/photo-1599580235378-5a41505c2e35?auto=format&fit=crop&w=800&q=80',
        desc: 'A webcam favorita dos streamers e profissionais para videoconferências.',
        specs: ['Resolução Full HD 1080p', 'Microfone estéreo duplo', 'Foco automático HD', 'Correção de luz automática', 'Proteção de privacidade'],
        benefits: ['Imagem cristalina', 'Áudio claro e natural', 'Privacidade garantida com a tampa', 'Plug and Play'],
        usage: 'Lives, reuniões no Zoom/Teams, criação de conteúdo.',
        state: 'Novo',
        warranty: '2 Anos Logitech'
      },
      {
        nome: 'Teclado Mecânico Redragon Kumara',
        preco: 229.90,
        cat: 'Acessórios gamer',
        img: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
        desc: 'Teclado mecânico TKL robusto com iluminação RGB e switches táteis.',
        specs: ['Switch Outemu Blue (Clicky)', 'Formato TKL (Sem numérico)', 'Iluminação RGB controlável', 'Anti-Ghosting 100%', 'Cabo removível'],
        benefits: ['Alta durabilidade', 'Resposta tátil precisa', 'Economia de espaço na mesa', 'Personalização de cores'],
        usage: 'Gamers de FPS/MOBA e digitadores que gostam de feedback tátil.',
        state: 'Novo',
        warranty: '12 Meses'
      },
      {
        nome: 'Mouse Logitech G502 HERO',
        preco: 299.00,
        cat: 'Acessórios gamer',
        img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
        desc: 'O mouse gamer mais vendido do mundo, agora com sensor HERO 25K.',
        specs: ['Sensor HERO 25.600 DPI', '11 Botões programáveis', 'Peso ajustável', 'RGB LIGHTSYNC', 'Memória integrada'],
        benefits: ['Precisão cirúrgica', 'Totalmente personalizável', 'Ergonomia confortável para destros', 'Pesos inclusos para ajuste'],
        usage: 'Jogos competitivos, FPS, MOBA e produtividade avançada.',
        state: 'Novo',
        warranty: '2 Anos Logitech'
      },
      {
        nome: 'Headset Gamer HyperX Cloud II',
        preco: 599.00,
        cat: 'Acessórios gamer',
        img: 'https://images.unsplash.com/photo-1610046678227-37467657158f?auto=format&fit=crop&w=800&q=80',
        desc: 'Conforto lendário e som Surround 7.1 virtual para imersão total.',
        specs: ['Som Surround 7.1', 'Drivers de 53mm', 'Espuma Memory Foam', 'Microfone removível com cancelamento de ruído', 'Estrutura em alumínio'],
        benefits: ['Extremamente confortável', 'Som posicional preciso', 'Durável e resistente', 'Compatível com PC, PS5, Xbox'],
        usage: 'Sessões longas de jogos, campeonatos e comunicação clara.',
        state: 'Novo',
        warranty: '2 Anos HyperX'
      },
      {
        nome: 'Suporte Notebook Alumínio Ajustável',
        preco: 89.90,
        cat: 'Acessórios de informática',
        img: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800&q=80',
        desc: 'Melhore sua postura e a refrigeração do seu notebook com estilo.',
        specs: ['Material: Alumínio Anodizado', '6 Níveis de altura', 'Dobrável e portátil', 'Borrachas antiderrapantes', 'Suporta até 17 polegadas'],
        benefits: ['Ergonomia correta', 'Evita superaquecimento', 'Leve para transportar', 'Design premium'],
        usage: 'Qualquer usuário de notebook que deseje conforto ergonômico.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Hub USB-C Baseus 7-em-1',
        preco: 249.00,
        cat: 'Acessórios de informática',
        img: 'https://images.unsplash.com/photo-1622359508511-d078749c9535?auto=format&fit=crop&w=800&q=80',
        desc: 'Expanda as conexões do seu Macbook ou Ultrabook com um único adaptador.',
        specs: ['1x HDMI 4K', '3x USB 3.0', '1x USB-C PD 100W', 'Leitor SD/MicroSD', 'Corpo em alumínio'],
        benefits: ['Conecte tudo de uma vez', 'Carregamento rápido pass-through', 'Transferência de dados veloz', 'Compacto'],
        usage: 'Usuários de laptops modernos com poucas portas USB.',
        state: 'Novo',
        warranty: '6 Meses'
      },
      {
        nome: 'Monitor LG Ultrawide 29" Full HD',
        preco: 1399.00,
        cat: 'Acessórios de vídeo',
        img: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&w=800&q=80',
        desc: 'Mais espaço de tela para multitarefas e imersão em jogos.',
        specs: ['Painel IPS 29"', 'Resolução 2560x1080 (21:9)', 'HDR10', 'AMD FreeSync', '99% sRGB'],
        benefits: ['33% mais espaço de tela', 'Cores fiéis e ângulo de visão amplo', 'Ótimo para edição de vídeo e planilhas', 'Jogabilidade fluida'],
        usage: 'Designers, editores, programadores e gamers.',
        state: 'Novo',
        warranty: '1 Ano LG'
      }
    ]
  },
  {
    name: 'HardMaster Peças',
    email: 'hardmaster@teste.com',
    category: 'Informática',
    lat: -22.915560,
    lon: -47.070830,
    products: [
      {
        nome: 'Memória RAM Corsair Vengeance 16GB',
        preco: 289.00,
        cat: 'Memória RAM',
        img: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80',
        desc: 'Módulo de memória de alto desempenho para overclocking.',
        specs: ['16GB (1x16GB)', 'DDR4 3200MHz', 'Dissipador de calor em alumínio', 'Latência CL16', 'XMP 2.0'],
        benefits: ['Estabilidade superior', 'Dissipação eficiente', 'Compatibilidade ampla', 'Garantia vitalícia limitada'],
        usage: 'Upgrades de PC Gamer e Workstations.',
        state: 'Novo',
        warranty: 'Vitalícia Corsair'
      },
      {
        nome: 'SSD Kingston A400 480GB',
        preco: 210.00,
        cat: 'SSD SATA',
        img: 'https://images.unsplash.com/photo-1597872250977-01053881c55b?auto=format&fit=crop&w=800&q=80',
        desc: 'Reviva seu computador antigo com velocidades incríveis.',
        specs: ['Capacidade 480GB', 'Interface SATA III', 'Leitura: 500MB/s', 'Gravação: 450MB/s', 'Formato 2.5"'],
        benefits: ['10x mais rápido que HD', 'Mais resistente a choques', 'Silencioso', 'Melhora o boot do sistema'],
        usage: 'Notebooks e Desktops que precisam de velocidade.',
        state: 'Novo',
        warranty: '3 Anos'
      },
      {
        nome: 'SSD NVMe Samsung 970 EVO Plus 1TB',
        preco: 650.00,
        cat: 'SSD NVMe',
        img: 'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?auto=format&fit=crop&w=800&q=80',
        desc: 'Velocidade extrema para tarefas intensivas e jogos.',
        specs: ['Capacidade 1TB', 'Interface M.2 NVMe PCIe 3.0', 'Leitura: 3500MB/s', 'Gravação: 3300MB/s', 'V-NAND'],
        benefits: ['Desempenho de ponta', 'Confiabilidade Samsung', 'Ideal para edição 4K', 'Carregamento instantâneo de jogos'],
        usage: 'PCs High-End, Workstations e PS5 (com dissipador extra).',
        state: 'Novo',
        warranty: '5 Anos'
      },
      {
        nome: 'Processador Intel Core i7-12700K',
        preco: 2100.00,
        cat: 'Processadores',
        img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
        desc: 'Arquitetura híbrida para desempenho sem compromissos.',
        specs: ['12 Núcleos (8P + 4E)', '20 Threads', 'Clock Max 5.0GHz', 'Socket LGA 1700', 'Desbloqueado para Overclock'],
        benefits: ['Multitarefa superior', 'Excelente para jogos e streaming', 'Suporte a PCIe 5.0 e DDR5', 'Vídeo integrado UHD 770'],
        usage: 'PC Gamer topo de linha e criadores de conteúdo.',
        state: 'Novo',
        warranty: '3 Anos Intel'
      },
      {
        nome: 'Processador AMD Ryzen 7 5800X',
        preco: 1800.00,
        cat: 'Processadores',
        img: 'https://images.unsplash.com/photo-1555618568-9e6b4d34c063?auto=format&fit=crop&w=800&q=80',
        desc: 'A elite dos processadores para jogos.',
        specs: ['8 Núcleos', '16 Threads', 'Clock Max 4.7GHz', 'Socket AM4', 'Cache 32MB L3'],
        benefits: ['Alto IPC para jogos', 'Eficiência energética', 'Desbloqueado', 'Suporte PCIe 4.0'],
        usage: 'Gamers e entusiastas.',
        state: 'Novo',
        warranty: '3 Anos AMD'
      },
      {
        nome: 'Fonte Corsair CV650 650W',
        preco: 450.00,
        cat: 'Fonte de alimentação',
        img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
        desc: 'Energia confiável e eficiente para seu setup.',
        specs: ['Potência 650W', 'Certificação 80 Plus Bronze', 'Ventoinha silenciosa 120mm', 'Cabos pretos (Sleeved)', 'PFC Ativo'],
        benefits: ['Eficiência energética', 'Baixo ruído', 'Design discreto', 'Proteções elétricas completas'],
        usage: 'PCs Gamer de entrada a intermediário.',
        state: 'Novo',
        warranty: '3 Anos'
      },
      {
        nome: 'Gabinete Gamer NZXT H510 Flow',
        preco: 699.00,
        cat: 'Gabinetes',
        img: 'https://images.unsplash.com/photo-1587202372616-b4345a27138b?auto=format&fit=crop&w=800&q=80',
        desc: 'Design icônico com foco em fluxo de ar.',
        specs: ['Painel frontal perfurado', 'Vidro temperado lateral', 'Gerenciamento de cabos premium', 'Suporta radiadores de 280mm', 'USB-C frontal'],
        benefits: ['Refrigeração otimizada', 'Montagem limpa e fácil', 'Estética minimalista', 'Construção robusta'],
        usage: 'Montagem de PCs modernos e elegantes.',
        state: 'Novo',
        warranty: '2 Anos'
      },
      {
        nome: 'Placa Mãe Asus TUF Gaming B550M-Plus',
        preco: 950.00,
        cat: 'Processadores', // Categoria ajustada para agrupar em peças
        img: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
        desc: 'Durabilidade militar e recursos avançados para Ryzen.',
        specs: ['Socket AM4', 'Chipset B550', '2x M.2', 'PCIe 4.0', 'Wi-Fi 6 (Opcional, checar versão)'],
        benefits: ['Componentes TUF duráveis', 'Áudio de alta qualidade', 'Resfriamento VRM robusto', 'Aura Sync RGB'],
        usage: 'Base sólida para qualquer PC Gamer Ryzen.',
        state: 'Novo',
        warranty: '1 Ano Asus'
      },
      {
        nome: 'Cooler Master Hyper 212 RGB',
        preco: 250.00,
        cat: 'Processadores',
        img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=800&q=80',
        desc: 'O lendário air cooler, agora com RGB.',
        specs: ['4 Heatpipes de contato direto', 'Ventoinha 120mm RGB', 'Compatibilidade universal', 'Fluxo de ar 57 CFM', 'Ruído baixo (26 dBA)'],
        benefits: ['Excelente performance térmica', 'Visual personalizável', 'Fácil instalação', 'Custo-benefício'],
        usage: 'Substituição do cooler box para menores temperaturas.',
        state: 'Novo',
        warranty: '1 Ano'
      },
      {
        nome: 'Pasta Térmica Arctic Silver 5 3.5g',
        preco: 60.00,
        cat: 'Processadores',
        img: 'https://images.unsplash.com/photo-1624705024346-3460eb007559?auto=format&fit=crop&w=800&q=80',
        desc: 'A pasta térmica de prata de alta densidade.',
        specs: ['99.9% Prata micronizada', 'Condutividade térmica alta', 'Não condutiva eletricamente', 'Seringa 3.5g', 'Viscosidade ideal'],
        benefits: ['Reduz temperaturas da CPU/GPU', 'Longa duração', 'Fácil aplicação', 'Rende várias aplicações'],
        usage: 'Manutenção preventiva e montagem de PCs.',
        state: 'Novo',
        warranty: 'N/A'
      }
    ]
  },
  {
    name: 'Mundo Mágico Brinquedos',
    email: 'brinquedos@teste.com',
    category: 'Brinquedos',
    lat: -22.925560,
    lon: -47.050830,
    products: [
      {
        nome: 'Pack Hot Wheels 5 Carros',
        preco: 59.90,
        cat: 'Carrinhos',
        img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
        desc: 'Acelere a diversão com este pacote de 5 veículos radicais.',
        specs: ['5 Veículos sortidos', 'Escala 1:64', 'Material: Metal Die-Cast', 'Pintura detalhada', 'Modelos originais Mattel'],
        benefits: ['Ótimo para colecionar', 'Resistente a quedas', 'Compatível com pistas Hot Wheels', 'Diversão garantida'],
        usage: 'Crianças a partir de 3 anos e colecionadores.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Boneca Baby Alive Hora do Xixi',
        preco: 129.90,
        cat: 'Bonecas',
        img: 'https://images.unsplash.com/photo-1560859251-d563a3955e53?auto=format&fit=crop&w=800&q=80',
        desc: 'Cuide da sua bebê como se fosse de verdade!',
        specs: ['Inclui mamadeira e fralda', 'Faz xixi de verdade', 'Roupinha removível', 'Altura: 30cm', 'Material: Vinil atóxico'],
        benefits: ['Estimula o cuidado e responsabilidade', 'Interativa', 'Fácil de limpar', 'Marca confiável Hasbro'],
        usage: 'Crianças a partir de 3 anos.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Bola de Futebol Penalty Campo',
        preco: 89.90,
        cat: 'Bola',
        img: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=800&q=80',
        desc: 'Bola oficial para as melhores partidas no gramado.',
        specs: ['Tecnologia Termotec (Sem costura)', '0% Absorção de água', 'PU Laminado', 'Miolo Slip System removível', 'Tamanho oficial 5'],
        benefits: ['Durabilidade extrema', 'Maciez no chute', 'Não encharca na chuva', 'Precisão na trajetória'],
        usage: 'Jogos de campo, treinos e lazer.',
        state: 'Novo',
        warranty: '3 Meses contra defeito'
      },
      {
        nome: 'Urso de Pelúcia Gigante 1 Metro',
        preco: 199.90,
        cat: 'Ursinho de pelúcia',
        img: 'https://images.unsplash.com/photo-1559454403-b8fb87521bc7?auto=format&fit=crop&w=800&q=80',
        desc: 'Um abraço gigante e macio para quem você ama.',
        specs: ['Altura: 100cm', 'Enchimento: Fibra siliconada', 'Tecido: Pelúcia antialérgica', 'Olhos com trava de segurança', 'Laço decorativo'],
        benefits: ['Toque super macio', 'Não deforma', 'Hipoalergênico', 'Presente inesquecível'],
        usage: 'Decoração de quarto, presente para namorada(o) ou crianças.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'LEGO Classic Caixa de Peças Criativas',
        preco: 249.00,
        cat: 'Brinquedos educativos',
        img: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80',
        desc: 'Solte a imaginação e construa o que quiser!',
        specs: ['484 Peças', '35 Cores diferentes', 'Inclui janelas, olhos, pneus', 'Placa de base verde', 'Manual de ideias'],
        benefits: ['Desenvolve a criatividade', 'Coordenação motora fina', 'Diversão para toda a família', 'Peças compatíveis com outros LEGOs'],
        usage: 'Crianças a partir de 4 anos e adultos.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Quebra-Cabeça 1000 Peças Paisagens',
        preco: 69.90,
        cat: 'Brinquedos educativos',
        img: 'https://images.unsplash.com/photo-1598556885310-acfa64c8dd95?auto=format&fit=crop&w=800&q=80',
        desc: 'Desafio relaxante com uma vista deslumbrante.',
        specs: ['1000 Peças', 'Imagem em alta definição', 'Papelão rígido de qualidade', 'Tamanho montado: 70x50cm', 'Encaixe preciso'],
        benefits: ['Exercita a mente e concentração', 'Atividade relaxante', 'Pode ser emoldurado', 'Ótimo passatempo em grupo'],
        usage: 'Adolescentes e adultos.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Jogo Banco Imobiliário Estrela',
        preco: 149.90,
        cat: 'Brinquedos educativos',
        img: 'https://images.unsplash.com/photo-1611371805429-899c086b3258?auto=format&fit=crop&w=800&q=80',
        desc: 'O clássico jogo de negociação de propriedades.',
        specs: ['Tabuleiro rígido', 'Notas de dinheiro fictício', 'Peões coloridos', 'Casas e hotéis plásticos', 'Cartas de sorte/revés'],
        benefits: ['Ensina educação financeira básica', 'Estratégia e negociação', 'Diversão clássica', 'Interação social'],
        usage: 'Crianças a partir de 8 anos e família.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Boneco Homem-Aranha Titan Hero',
        preco: 89.90,
        cat: 'Bonecas', // Categoria genérica para bonecos
        img: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80',
        desc: 'O herói da vizinhança pronto para a ação.',
        specs: ['Altura: 30cm', '5 Pontos de articulação', 'Material plástico resistente', 'Detalhes fiéis ao filme', 'Série Titan Hero'],
        benefits: ['Estimula a imaginação', 'Resistente para brincar', 'Compatível com acessórios Blast Gear', 'Favorito dos meninos'],
        usage: 'Crianças a partir de 4 anos.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Pista de Corrida Elétrica Autorama',
        preco: 299.00,
        cat: 'Carrinhos',
        img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
        desc: 'Emoção em alta velocidade com dois carros inclusos.',
        specs: ['2.5 Metros de pista', '2 Controles aceleradores', '2 Carros F1', 'Fonte bivolt', 'Contador de voltas manual'],
        benefits: ['Competição saudável', 'Reflexos rápidos', 'Fácil de montar', 'Diversão nostálgica'],
        usage: 'Crianças a partir de 6 anos.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Brinquedo Educativo Alfabeto Madeira',
        preco: 49.90,
        cat: 'Brinquedos educativos',
        img: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=800&q=80',
        desc: 'Aprender o ABC nunca foi tão divertido.',
        specs: ['26 Peças em madeira MDF', 'Letras coloridas', 'Tinta atóxica', 'Base de encaixe', 'Bordas arredondadas'],
        benefits: ['Auxilia na alfabetização', 'Reconhecimento de cores e formas', 'Material durável e seguro', 'Eco-friendly'],
        usage: 'Crianças em fase pré-escolar (3+ anos).',
        state: 'Novo',
        warranty: '3 Meses'
      }
    ]
  },
  {
    name: 'Press Start Games',
    email: 'games@teste.com',
    category: 'Games',
    lat: -22.900000,
    lon: -47.060000,
    products: [
      {
        nome: 'Console PlayStation 5 Edição Digital',
        preco: 3999.00,
        cat: 'PlayStation 5',
        img: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80',
        desc: 'Jogar Não Tem Limites. Carregamento ultrarrápido e imersão total.',
        specs: ['SSD Ultra-High Speed 825GB', 'Ray Tracing', 'Até 120fps em 4K', 'Áudio 3D Tempest', 'Sem leitor de disco'],
        benefits: ['Gráficos de nova geração', 'Sem telas de carregamento', 'Feedback tátil no controle', 'Design futurista'],
        usage: 'Gamers que preferem mídia digital.',
        state: 'Novo',
        warranty: '1 Ano Sony'
      },
      {
        nome: 'Console Xbox Series S',
        preco: 2199.00,
        cat: 'Xbox',
        img: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=800&q=80',
        desc: 'Desempenho de nova geração no menor Xbox de todos os tempos.',
        specs: ['SSD 512GB NVMe', 'Resolução 1440p até 120fps', 'Ray Tracing', 'Retrocompatibilidade total', 'Digital Only'],
        benefits: ['Melhor custo-benefício', 'Game Pass Ultimate pronto', 'Compacto e silencioso', 'Quick Resume'],
        usage: 'Gamers casuais e competitivos que buscam valor.',
        state: 'Novo',
        warranty: '1 Ano Microsoft'
      },
      {
        nome: 'Nintendo Switch OLED',
        preco: 2399.00,
        cat: 'Nintendo',
        img: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=800&q=80',
        desc: 'Jogue em qualquer lugar com cores vibrantes na tela OLED de 7 polegadas.',
        specs: ['Tela OLED 7"', '64GB Armazenamento', 'Dock com porta LAN', 'Suporte ajustável amplo', 'Áudio aprimorado'],
        benefits: ['Cores intensas e preto puro', 'Modo portátil superior', 'Jogos exclusivos Nintendo', 'Versatilidade (TV/Tabletop/Handheld)'],
        usage: 'Família, crianças e fãs da Nintendo.',
        state: 'Novo',
        warranty: '1 Ano Nintendo'
      },
      {
        nome: 'Controle DualSense PS5 Branco',
        preco: 449.00,
        cat: 'Controles',
        img: 'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?auto=format&fit=crop&w=800&q=80',
        desc: 'Sinta o jogo com feedback tátil e gatilhos adaptáveis.',
        specs: ['Feedback Hápitco', 'Gatilhos Adaptáveis', 'Microfone integrado', 'Bateria recarregável', 'Conexão USB-C'],
        benefits: ['Imersão sem igual', 'Conforto ergonômico', 'Chat sem headset', 'Sensor de movimento'],
        usage: 'Donos de PS5 e jogadores de PC.',
        state: 'Novo',
        warranty: '1 Ano Sony'
      },
      {
        nome: 'Controle Xbox Series Carbon Black',
        preco: 399.00,
        cat: 'Controles',
        img: 'https://images.unsplash.com/photo-1605635734319-383742464736?auto=format&fit=crop&w=800&q=80',
        desc: 'Design modernizado e aderência texturizada.',
        specs: ['Botão Compartilhar', 'D-Pad Híbrido', 'Gatilhos texturizados', 'Bluetooth e Xbox Wireless', 'Compatível com PC/Mobile'],
        benefits: ['Pega firme e confortável', 'Compatibilidade universal', 'Fácil captura de tela', 'Baixa latência'],
        usage: 'Xbox Series, One, PC e Mobile.',
        state: 'Novo',
        warranty: '3 Meses'
      },
      {
        nome: 'Jogo God of War Ragnarok (PS5)',
        preco: 299.90,
        cat: 'Jogos',
        img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80',
        desc: 'Embarque em uma jornada épica e emocionante com Kratos e Atreus.',
        specs: ['Plataforma: PS5', 'Gênero: Ação/Aventura', 'Áudio: PT-BR', 'Legendas: PT-BR', '1 Jogador'],
        benefits: ['História premiada', 'Gráficos deslumbrantes', 'Combate visceral', 'Dublagem excelente'],
        usage: 'Fãs de ação e narrativa.',
        state: 'Novo (Lacrado)',
        warranty: 'N/A'
      },
      {
        nome: 'Mario Kart 8 Deluxe (Switch)',
        preco: 299.00,
        cat: 'Jogos',
        img: 'https://images.unsplash.com/photo-1629237684073-d5f9922262d5?auto=format&fit=crop&w=800&q=80',
        desc: 'A corrida mais divertida e caótica dos games.',
        specs: ['Plataforma: Switch', 'Até 4 jogadores local', 'Até 12 online', '48 Pistas', 'Personagens Nintendo'],
        benefits: ['Diversão infinita', 'Melhor jogo multiplayer local', 'Fácil de aprender', 'Muitos modos de jogo'],
        usage: 'Festas e jogatina em família.',
        state: 'Novo (Lacrado)',
        warranty: 'N/A'
      },
      {
        nome: 'Headset Pulse 3D PS5',
        preco: 549.00,
        cat: 'Acessórios para videogames',
        img: 'https://images.unsplash.com/photo-1610046678227-37467657158f?auto=format&fit=crop&w=800&q=80',
        desc: 'Afinado para o áudio 3D dos consoles PS5.',
        specs: ['Áudio 3D', 'Dois microfones ocultos', 'Bateria 12h', 'Sem fio (Adaptador USB)', 'Entrada 3.5mm'],
        benefits: ['Som espacial preciso', 'Design combina com o console', 'Chat claro', 'Confortável para óculos'],
        usage: 'Jogadores de PS5 que buscam imersão.',
        state: 'Novo',
        warranty: '1 Ano Sony'
      },
      {
        nome: 'Base Carregamento DualSense',
        preco: 199.00,
        cat: 'Acessórios para videogames',
        img: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80',
        desc: 'Carregue dois controles simultaneamente com estilo.',
        specs: ['Carrega 2 controles', 'Design "Click-in"', 'Alimentação própria (AC)', 'Carga rápida', 'Estilo PS5'],
        benefits: ['Sempre pronto para jogar', 'Libera portas USB do console', 'Organiza o setup', 'Seguro e oficial'],
        usage: 'Donos de PS5 com 2 controles.',
        state: 'Novo',
        warranty: '1 Ano Sony'
      },
      {
        nome: 'Cartão Presente PlayStation Store R$100',
        preco: 100.00,
        cat: 'Jogos',
        img: 'https://images.unsplash.com/photo-1555617985-063a5049b809?auto=format&fit=crop&w=800&q=80',
        desc: 'Crédito para comprar jogos, DLCs e filmes na PS Store.',
        specs: ['Valor: R$ 100,00', 'Código Digital (Envio Imediato)', 'Região: Brasil', 'Sem validade', 'Funciona em PS4/PS5'],
        benefits: ['Liberdade de escolha', 'Sem cartão de crédito', 'Ótimo presente', 'Seguro'],
        usage: 'Qualquer usuário PlayStation.',
        state: 'Digital',
        warranty: 'N/A'
      }
    ]
  },
  {
    name: 'JBL Official Store',
    email: 'jbl@teste.com',
    category: 'Eletrônicos',
    lat: -22.909000,
    lon: -47.065000,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/JBL_logo.svg/2560px-JBL_logo.svg.png',
    banner: 'https://images.unsplash.com/photo-1545454675-3527b9b92881?auto=format&fit=crop&w=1200&q=80',
    products: [
      {
        nome: 'Caixa de Som JBL Flip 6',
        preco: 699.00,
        cat: 'Caixa de som Bluetooth',
        img: 'https://images.unsplash.com/photo-1608229986292-0b29c991c66c?auto=format&fit=crop&w=800&q=80',
        desc: 'Som ousado para qualquer aventura.',
        specs: ['Potência 30W RMS', "IP67 À prova d'água e poeira", 'Bateria 12 horas', 'Bluetooth 5.1', 'JBL PartyBoost'],
        benefits: ['Graves profundos', 'Resistente a tudo', 'Portabilidade', 'Conecta com outras JBL'],
        usage: 'Praia, piscina, trilhas e casa.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'Caixa de Som JBL Charge 5',
        preco: 999.00,
        cat: 'Caixa de som Bluetooth',
        img: 'https://images.unsplash.com/photo-1627448834015-467406932467?auto=format&fit=crop&w=800&q=80',
        desc: 'Potência e Powerbank integrados.',
        specs: ['Potência 40W RMS', 'Bateria 20 horas', 'Powerbank (Carrega celular)', 'IP67', 'Bluetooth 5.1'],
        benefits: ['Bateria para o dia todo', 'Carrega seu smartphone', 'Som potente JBL Pro', 'Durabilidade'],
        usage: 'Festas longas e ambientes externos.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'Caixa de Som JBL Boombox 3',
        preco: 2699.00,
        cat: 'Caixa de som Bluetooth',
        img: 'https://images.unsplash.com/photo-1608229986292-0b29c991c66c?auto=format&fit=crop&w=800&q=80',
        desc: 'Som monstruoso com graves mais profundos.',
        specs: ['Potência 180W (AC) / 136W (Bateria)', '3 Vias de alto-falantes', 'Bateria 24 horas', 'IP67', 'Alça de metal'],
        benefits: ['O som mais potente da categoria', 'Bateria monstruosa', 'Graves que tremem o chão', 'Design icônico'],
        usage: 'Churrascos, festas grandes e eventos outdoor.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'Fone JBL Tune 510BT',
        preco: 249.00,
        cat: 'Fone over-ear',
        img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        desc: 'Graves puros, sem fios.',
        specs: ['JBL Pure Bass Sound', 'Bluetooth 5.0', 'Bateria 40 horas', 'Carregamento rápido (5min = 2h)', 'Multiponto'],
        benefits: ['Custo-benefício incrível', 'Bateria interminável', 'Leve e dobrável', 'Conexão estável'],
        usage: 'Dia a dia, transporte público e trabalho.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'Fone JBL Live Pro 2 TWS',
        preco: 799.00,
        cat: 'Fone intra-auricular',
        img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        desc: 'Silêncio ou som, você escolhe.',
        specs: ['Cancelamento de Ruído Adaptativo', '6 Microfones', 'Até 40 horas de bateria (10+30)', 'Carregamento sem fio', 'JBL Signature Sound'],
        benefits: ['Foco total com ANC', 'Chamadas cristalinas', 'Bateria para dias', 'Conforto oval tubes'],
        usage: 'Escritório, viagens e academia.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'Fone Gamer JBL Quantum 400',
        preco: 499.00,
        cat: 'Fone over-ear',
        img: 'https://images.unsplash.com/photo-1610046678227-37467657158f?auto=format&fit=crop&w=800&q=80',
        desc: 'Vantagem sonora imersiva.',
        specs: ['JBL QuantumSURROUND', 'Drivers 50mm', 'Microfone flip-up', 'Dial de balanço chat/jogo', 'RGB'],
        benefits: ['Localização precisa de inimigos', 'Comunicação clara', 'Conforto para maratonas', 'Compatível com tudo'],
        usage: 'Gamers competitivos de PC e Consoles.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'JBL PartyBox 110',
        preco: 2199.00,
        cat: 'Produtos portáteis',
        img: 'https://images.unsplash.com/photo-1545454675-3527b9b92881?auto=format&fit=crop&w=800&q=80',
        desc: 'Comece a festa com som potente e luzes dinâmicas.',
        specs: ['Potência 160W RMS', 'Show de luzes LED', 'Entrada para mic e guitarra', 'Bateria 12 horas', 'App PartyBox'],
        benefits: ['Transforma qualquer lugar em balada', 'Som alto e claro', 'Visual incrível', 'Karaokê pronto'],
        usage: 'Festas em casa, karaokê e músicos.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'JBL Go 3',
        preco: 229.00,
        cat: 'Produtos portáteis',
        img: 'https://images.unsplash.com/photo-1608229986292-0b29c991c66c?auto=format&fit=crop&w=800&q=80',
        desc: 'Estilo ousado e ultra portátil.',
        specs: ['Potência 4.2W RMS', 'IP67', 'Bateria 5 horas', 'Bluetooth 5.1', 'Alça integrada'],
        benefits: ['Cabe no bolso', 'Design moderno e tecido', 'Som surpreendente pro tamanho', "Totalmente à prova d'água"],
        usage: 'Passeios rápidos, pendurar na mochila.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'JBL Wave Buds',
        preco: 299.00,
        cat: 'Fone intra-auricular',
        img: 'https://images.unsplash.com/photo-1572569028738-411a39a7aa8d?auto=format&fit=crop&w=800&q=80',
        desc: 'Graves profundos, muita diversão.',
        specs: ['JBL Deep Bass Sound', 'Bateria 32 horas (8+24)', 'Design resistente a poeira/água (IP54)', 'Smart Ambient', 'App compatível'],
        benefits: ['Ótimo som de entrada', 'Fique atento ao redor', 'Encaixe seguro', 'Custo-benefício'],
        usage: 'Dia a dia e exercícios leves.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      },
      {
        nome: 'Soundbar JBL Cinema SB190',
        preco: 1899.00,
        cat: 'Caixa de som Bluetooth',
        img: 'https://images.unsplash.com/photo-1574375154388-c7885b57d622?auto=format&fit=crop&w=800&q=80',
        desc: 'Cinema em casa com Dolby Atmos Virtual.',
        specs: ['Potência 380W', 'Subwoofer sem fio 6.5"', 'Dolby Atmos Virtual', 'HDMI eARC', 'Bluetooth'],
        benefits: ['Graves de tremer o sofá', 'Experiência imersiva de cinema', 'Instalação simples', 'Upgrade total na TV'],
        usage: 'Sala de estar e Home Cinema.',
        state: 'Novo',
        warranty: '1 Ano JBL'
      }
    ]
  },
  {
    name: 'SmartCell Campinas',
    email: 'smartcell@teste.com',
    category: 'Celulares',
    lat: -22.902000,
    lon: -47.055000,
    products: [
      {
        nome: 'iPhone 14 Pro Max 256GB Dourado',
        preco: 8299.00,
        cat: 'Smartphones novos',
        img: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcd9?auto=format&fit=crop&w=800&q=80',
        desc: 'A experiência definitiva do iPhone.',
        specs: ['Tela Super Retina XDR 6.7"', 'Chip A16 Bionic', 'Câmera Principal 48MP', 'Dynamic Island', 'Bateria para o dia todo'],
        benefits: ['Melhor desempenho do mercado', 'Fotos profissionais', 'Tela sempre ativa', 'Acabamento premium'],
        usage: 'Usuários exigentes e criadores de conteúdo.',
        state: 'Novo (Lacrado)',
        warranty: '1 Ano Apple'
      },
      {
        nome: 'iPhone 11 128GB Preto (Seminovo)',
        preco: 2199.00,
        cat: 'Smartphones usados',
        img: 'https://images.unsplash.com/photo-1573148191353-d147822941b1?auto=format&fit=crop&w=800&q=80',
        desc: 'O clássico moderno da Apple, revisado e garantido.',
        specs: ['Chip A13 Bionic', 'Câmera Dupla 12MP', 'Tela LCD Liquid Retina 6.1"', 'Face ID', 'Saúde Bateria > 85%'],
        benefits: ['Excelente custo-benefício iOS', 'Roda tudo liso', 'Câmeras ainda ótimas', 'Preço acessível'],
        usage: 'Quem quer entrar no ecossistema Apple.',
        state: 'Seminovo - Grade A (Impecável)',
        warranty: '3 Meses Loja'
      },
      {
        nome: 'Samsung Galaxy S23 Ultra 512GB',
        preco: 6999.00,
        cat: 'Smartphones novos',
        img: 'https://images.unsplash.com/photo-1610945699354-d860c8f4f5b9?auto=format&fit=crop&w=800&q=80',
        desc: 'O rei do Android com câmera de 200MP.',
        specs: ['Câmera 200MP + Zoom 100x', 'Snapdragon 8 Gen 2 for Galaxy', 'S Pen Integrada', 'Tela 6.8" 120Hz', 'Bateria 5000mAh'],
        benefits: ['Melhor zoom do mundo', 'Caneta para produtividade', 'Desempenho máximo', 'Fotos noturnas incríveis'],
        usage: 'Fotografia, produtividade e jogos.',
        state: 'Novo',
        warranty: '1 Ano Samsung'
      },
      {
        nome: 'Samsung Galaxy S20 FE 5G (Seminovo)',
        preco: 1299.00,
        cat: 'Smartphones usados',
        img: 'https://images.unsplash.com/photo-1610945865010-4f8f6388432b?auto=format&fit=crop&w=800&q=80',
        desc: 'O queridinho da galera, com 5G e Snapdragon.',
        specs: ['Snapdragon 865', 'Tela 120Hz Super AMOLED', 'Câmera Tripla', 'IP68', '128GB/6GB'],
        benefits: ['Melhor custo-benefício Android', 'Tela linda', 'Desempenho de topo de linha antigo', 'Câmeras versáteis'],
        usage: 'Usuário médio avançado.',
        state: 'Seminovo - Grade A',
        warranty: '3 Meses Loja'
      },
      {
        nome: 'Xiaomi Redmi Note 12 128GB',
        preco: 1099.00,
        cat: 'Smartphones novos',
        img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=800&q=80',
        desc: 'Campeão de vendas com tela AMOLED.',
        specs: ['Tela AMOLED 120Hz', 'Processador Snapdragon 685', 'Câmera 50MP', 'Bateria 5000mAh', 'Carregamento 33W'],
        benefits: ['Tela de flagship em celular básico', 'Bateria dura muito', 'Design fino', 'Preço baixo'],
        usage: 'Uso diário, redes sociais e vídeos.',
        state: 'Novo',
        warranty: '3 Meses Loja'
      },
      {
        nome: 'Motorola Edge 40 256GB',
        preco: 2399.00,
        cat: 'Smartphones novos',
        img: 'https://images.unsplash.com/photo-1598327105704-58580f557375?auto=format&fit=crop&w=800&q=80',
        desc: 'Elegância, perfume e proteção IP68.',
        specs: ['Tela Curva pOLED 144Hz', "IP68 À prova d'água", 'Carregamento 68W', 'Acabamento em Couro Vegan', 'Dimensity 8020'],
        benefits: ['Design premium ultra fino', 'Carrega em minutos', 'Resistente à água', 'Tela fluida'],
        usage: 'Quem valoriza design e leveza.',
        state: 'Novo',
        warranty: '1 Ano Motorola'
      },
      {
        nome: 'iPhone XR 64GB Branco (Usado)',
        preco: 1499.00,
        cat: 'Smartphones usados',
        img: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=800&q=80',
        desc: 'iPhone acessível com Face ID.',
        specs: ['Tela 6.1" Liquid Retina', 'Chip A12 Bionic', 'Câmera 12MP', 'Face ID', 'Bateria 82%'],
        benefits: ['Preço baixo', 'Ainda atualiza iOS', 'Face ID seguro', 'Construção sólida'],
        usage: 'Primeiro iPhone ou celular secundário.',
        state: 'Usado - Grade B (Marcas de uso leves)',
        warranty: '3 Meses Loja'
      },
      {
        nome: 'Carregador Apple 20W USB-C',
        preco: 149.00,
        cat: 'Outras',
        img: 'https://images.unsplash.com/photo-1625293630635-420958742879?auto=format&fit=crop&w=800&q=80',
        desc: 'Carregamento rápido original para seu iPhone.',
        specs: ['Potência 20W', 'Porta USB-C', 'Bivolt', 'Compacto', 'Original Apple'],
        benefits: ['Carrega 50% em 30min', 'Seguro para a bateria', 'Durável', 'Garantia oficial'],
        usage: 'Donos de iPhone 8 em diante.',
        state: 'Novo (OEM)',
        warranty: '3 Meses'
      },
      {
        nome: 'Cabo Lightning USB-C Reforçado',
        preco: 59.90,
        cat: 'Outras',
        img: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
        desc: 'Cabo trançado de alta durabilidade.',
        specs: ['1 Metro', 'Revestimento em Nylon', 'Certificado MFi', 'Pontas reforçadas', 'Suporta PD'],
        benefits: ['Não quebra fácil', 'Carregamento rápido', 'Compatibilidade garantida', 'Custo-benefício'],
        usage: 'Carregar iPhone e iPad.',
        state: 'Novo',
        warranty: '1 Ano'
      },
      {
        nome: 'Película de Vidro 3D Premium',
        preco: 29.90,
        cat: 'Outras',
        img: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=800&q=80',
        desc: 'Proteção total borda a borda.',
        specs: ['Vidro Temperado 9H', 'Bordas curvas 3D', 'Alta transparência', 'Toque sensível', 'Fácil aplicação'],
        benefits: ['Protege contra quedas', 'Não risca', 'Mantém a estética do aparelho', 'Barato seguro de tela'],
        usage: 'Todos os modelos (Selecionar na compra).',
        state: 'Novo',
        warranty: 'N/A'
      }
    ]
  }
];

async function seedCatalog() {
  console.log('🚀 INICIANDO SEED DO CATÁLOGO PROFISSIONAL...');

  try {
    // 1. Limpar tabelas
    console.log('🧹 Limpando banco de dados...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE itens_pedido');
    await db.query('TRUNCATE TABLE pedidos');
    await db.query('TRUNCATE TABLE produtos');
    await db.query('TRUNCATE TABLE lojas');
    await db.query('TRUNCATE TABLE usuarios');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Criar Usuário Admin e Courier
    const hash = await bcrypt.hash('010203', 8);
    const hashAdmin = await bcrypt.hash('admin', 8);

    await db.query(`INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, 
      ['Admin Master', 'admin', hashAdmin, 'admin']);
    
    await db.query(`INSERT INTO usuarios (nome, email, senha, tipo, telefone, veiculo_tipo, veiculo_placa) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      ['Entregador Flash', 'entregador1@teste.com', hash, 'courier', '19999993333', 'Moto', 'ABC-1234']);

    console.log('✅ Usuários base criados.');

    // 3. Loop lojas e produtos
    for (const shop of shops) {
      console.log(`🏪 Criando loja: ${shop.name}...`);

      // Criar Dono da Loja
      const [userResult] = await db.query(`
        INSERT INTO usuarios (nome, email, senha, tipo, telefone) 
        VALUES (?, ?, ?, ?, ?)
      `, [`Dono ${shop.name}`, shop.email, hash, 'shop_owner', '19988887777']);
      
      const userId = userResult.insertId;

      // Criar Loja
      const hours = JSON.stringify({ 
        mon: { open: true, from: '08:00', to: '22:00' }, 
        tue: { open: true, from: '08:00', to: '22:00' },
        wed: { open: true, from: '08:00', to: '22:00' },
        thu: { open: true, from: '08:00', to: '22:00' },
        fri: { open: true, from: '08:00', to: '22:00' },
        sat: { open: true, from: '08:00', to: '22:00' },
        sun: { open: true, from: '08:00', to: '22:00' }
      });

      const [storeResult] = await db.query(`
        INSERT INTO lojas (
          usuario_id, nome, categoria, endereco, telefone, 
          latitude, longitude, imagem_url, banner_url, 
          status_loja, horarios_funcionamento, tempo_preparo_medio, pedido_minimo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, 
        shop.name, 
        shop.category, 
        'Endereço Comercial, Campinas - SP', 
        '1930000000', 
        shop.lat, shop.lon, 
        shop.logo || shop.products[0].img, // Usa logo específico ou a imagem do primeiro produto
        shop.banner || 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=1200&q=80', // Banner específico ou genérico
        'aberta',
        hours,
        20,
        10.00
      ]);

      const storeId = storeResult.insertId;

      // Inserir Produtos
      console.log(`   📦 Inserindo ${shop.products.length} produtos...`);
      for (const p of shop.products) {
        const fullDesc = createDescription(p.desc, p.specs, p.benefits, p.usage, p.state, p.warranty);
        
        await db.query(`
          INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, estoque, imagem_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          storeId, 
          p.nome, 
          fullDesc, 
          p.preco, 
          p.cat, 
          50,
          p.img
        ]);
      }
    }

    console.log('🎉 CATÁLOGO COMPLETO CRIADO COM SUCESSO!');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERRO:', error);
    process.exit(1);
  }
}

seedCatalog();
