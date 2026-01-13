const db = require('../database');
const jwt = require('jsonwebtoken');
const sse = require('../utils/sseHub');
const notify = require('../utils/notifyHub');
const whatsapp = require('../services/whatsapp');
const asaas = require('../services/asaas');
const { randomUUID } = require('crypto');

// Logger simples se não tiver arquivo dedicado
const logger = { info: console.log, error: console.error }; 
const SIMULATE = process.env.SIMULATE_COURIER === '1';

// --- HELPER DE DISTÂNCIA ---
const toRad = (value) => (value * Math.PI) / 180;
const R = 6371;
const calcDist = (lat1, lon1, lat2, lon2) => {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const l1 = toRad(lat1);
    const l2 = toRad(lat2);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(l1) * Math.cos(l2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// --- HELPER: CRIAR PEDIDO INDIVIDUAL (COM SUPORTE A BATCH) ---
async function createSingleOrder(connection, { client_id, store_id, items, delivery_address, delivery_observation, delivery_latitude, delivery_longitude, payment_method, batch_id, overrideFee, delivery_code, pixDiscount }) {
    // 1. Buscar Loja
    const [stores] = await connection.query('SELECT * FROM lojas WHERE id = ?', [store_id]);
    if (stores.length === 0) {
        throw new Error(`Loja ${store_id} não encontrada`);
    }
    const store = stores[0];

    // 2. Calcular Totais e Validar Produtos
    let total_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
        const [products] = await connection.query('SELECT * FROM produtos WHERE id = ? AND loja_id = ?', [item.product_id, store_id]);
        if (products.length === 0) {
            throw new Error(`Produto ${item.product_id} não encontrado na loja ${store_id}`);
        }
        const product = products[0];
        const subtotal = Number(product.preco) * item.quantity;
        total_amount += subtotal;
        
        orderItemsData.push({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: product.preco,
            subtotal
        });
    }

    // APLICAR DESCONTO PIX NO SUBTOTAL (PRODUTOS)
    if (pixDiscount > 0) {
        const discountValue = total_amount * (pixDiscount / 100);
        total_amount -= discountValue;
    }

    // 3. Calcular Frete (Haversine) ou Usar Override
    let delivery_fee = 20.00;
    
    if (overrideFee !== undefined) {
        delivery_fee = overrideFee;
    } else if (store.latitude && store.longitude && delivery_latitude && delivery_longitude) {
        // Distância 1: Loja -> Cliente
        let distance = calcDist(store.latitude, store.longitude, delivery_latitude, delivery_longitude);

        // Lógica da Central de Distribuição removida: Motoboy usa app próprio
        // const needsMachine = ['credit_card', 'debit_card'].includes(payment_method);
        // if (needsMachine) { ... }
        
        // Taxa base R$20 + R$2 por km
        delivery_fee = 20.00 + (distance * 2.00);
        delivery_fee = parseFloat(delivery_fee.toFixed(2));
    }
    
    total_amount += delivery_fee;
    
    // Gerar códigos únicos para este pedido (ou usar compartilhado)
    const final_delivery_code = delivery_code || Math.floor(1000 + Math.random() * 9000).toString();
    const store_pickup_code = Math.floor(1000 + Math.random() * 9000).toString();
    const admin_pickup_code = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Inserir Pedido
    // Nota: batch_id pode ser null se for pedido único legado
    // Lógica de Status Inicial: Asaas (Pix/Boleto/CC) nasce 'pending', Outros (Entrega na porta) nascem 'accepted'
    const initialStatus = payment_method.startsWith('asaas') ? 'pending' : 'accepted';
    
    const [orderResult] = await connection.query(`
        INSERT INTO pedidos 
        (cliente_id, loja_id, valor_total, status, endereco_entrega, observacoes, metodo_pagamento, taxa_entrega, codigo_entrega, codigo_coleta_loja, codigo_coleta_admin, etapa_status, lote_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [client_id, store_id, total_amount, initialStatus, delivery_address, delivery_observation || '', payment_method, delivery_fee, final_delivery_code, store_pickup_code, admin_pickup_code, batch_id || null]);
    
    const orderId = orderResult.insertId;

    // 5. Inserir Itens do Pedido
    for (const item of orderItemsData) {
        await connection.query(`
            INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_momento)
            VALUES (?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.unit_price]);
    }

    return { orderId, total_amount, delivery_fee, store, delivery_code: final_delivery_code };
}

module.exports = {
  // --- WEBHOOK ASAAS ---
  async asaasWebhook(req, res) {
      try {
          const { event, payment } = req.body;
          // Log para debug
          console.log(`[Webhook Asaas] Evento: ${event}, Ref: ${payment?.externalReference}`);

          if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
              return res.json({ received: true });
          }

          const externalRef = payment.externalReference;
          if (!externalRef) return res.json({ received: true });

          // Busca pedidos pelo lote (batch_id) ou id individual
          // Nota: externalRef pode ser o ID do pedido (string) ou UUID do lote
          const [orders] = await db.query('SELECT id, loja_id, cliente_id, status FROM pedidos WHERE lote_id = ? OR id = ?', [externalRef, externalRef]);

          if (orders.length > 0) {
              const orderIds = orders.map(o => o.id);
              
              // Atualiza status para 'accepted' (Pago -> Em Preparação)
              // Apenas se ainda estiver pendente
              await db.query('UPDATE pedidos SET status = ?, etapa_status = ? WHERE id IN (?) AND status = ?', ['accepted', 'accepted', orderIds, 'pending']);
              
              // Notifica clientes e refresh geral
              orders.forEach(o => {
                  notify.send(o.cliente_id, {
                      type: 'status_updated',
                      order_id: o.id,
                      title: 'Pagamento Aprovado! ✅',
                      body: `Seu pedido #${o.id} foi confirmado e enviado para a loja.`
                  });
              });

              // Notificar Lojas (Opcional, mas bom)
              // ...

              sse.broadcast({ type: 'order_update' });
          }

          return res.json({ received: true });

      } catch (error) {
          console.error("Erro no Webhook Asaas:", error);
          return res.status(500).json({ error: 'Internal Error' });
      }
  },

  // --- CRIAR PEDIDO (CLIENTE) - SUPORTA MULTI-LOJA ---
  async store(req, res) {
    const connection = await db.getConnection(); 
    try {
      await connection.beginTransaction();

      const { store_id, items, delivery_address, delivery_observation, delivery_latitude, delivery_longitude, payment_method } = req.body;
      const client_id = req.userId;

      const createdOrders = [];
      
      // Se tiver store_id explícito, é comportamento antigo (uma loja)
      // Se não, agrupa items por store_id
      let ordersToCreate = [];

      if (store_id) {
          ordersToCreate.push({ store_id, items });
      } else {
          // Agrupar por store_id
          const groups = {};
          for (const item of items) {
             // item deve ter store_id (frontend deve mandar)
             // Se não tiver, falha ou pega do produto (mas aqui não temos acesso fácil ao produto sem query)
             // Vamos assumir que frontend manda storeId ou store_id no item
             const sId = item.store_id || item.storeId; 
             if (!sId) throw new Error("Item sem store_id no carrinho multi-loja");
             
             if (!groups[sId]) groups[sId] = [];
             groups[sId].push(item);
          }
          ordersToCreate = Object.keys(groups).map(sId => ({ store_id: sId, items: groups[sId] }));
      }

      // Se houver mais de um pedido, gera batch_id
      const batch_id = ordersToCreate.length > 1 ? randomUUID() : null;
      let overrideFee = undefined;
      // Código de entrega compartilhado para o batch (mesmo cliente)
      const shared_delivery_code = Math.floor(1000 + Math.random() * 9000).toString();

      // --- BUSCAR CONFIG DE DESCONTO PIX ---
      const [pixSettings] = await connection.query("SELECT valor FROM configuracoes WHERE chave = 'pix_discount'");
      const pixDiscount = (pixSettings.length > 0 && payment_method.startsWith('asaas_pix')) ? parseFloat(pixSettings[0].valor) : 0;

      // PRÉ-CÁLCULO DE FRETE UNIFICADO (MULTI-LOJA)
      if (batch_id && delivery_latitude && delivery_longitude) {
          try {
              // 1. Coletar IDs das lojas
              const storeIds = ordersToCreate.map(o => o.store_id);
              
              // 2. Buscar coordenadas das lojas
              const [stores] = await connection.query('SELECT id, latitude, longitude FROM lojas WHERE id IN (?)', [storeIds]);
              const storeMap = {};
              stores.forEach(s => storeMap[s.id] = s);

              // 3. Buscar coordenadas da Central
              const [settings] = await connection.query("SELECT chave, valor FROM configuracoes WHERE chave IN ('central_lat', 'central_lon')");
              const configMap = {};
              settings.forEach(r => configMap[r.chave] = r.valor);
              const cLat = parseFloat(configMap.central_lat || 0);
              const cLon = parseFloat(configMap.central_lon || 0);
              const hasCentral = cLat && cLon;

              // 4. Verificar necessidade de Maquininha (Global para o Batch)
              const needsMachine = ['credit_card', 'debit_card'].includes(payment_method);
              
              // 5. Calcular Rota Otimizada (Simplificada)
              // Rota: (Central ->) Loja 1 -> Loja 2 -> ... -> Cliente (-> Central)
              let totalDist = 0;
              let currentLat, currentLon;

              // Ponto de partida
              if (needsMachine && hasCentral) {
                  // Começa na central (pegar maquina)
                  // Distancia Central -> Primeira Loja
                  const firstStore = storeMap[storeIds[0]];
                  if (firstStore && firstStore.latitude) {
                      totalDist += calcDist(cLat, cLon, firstStore.latitude, firstStore.longitude);
                      currentLat = firstStore.latitude;
                      currentLon = firstStore.longitude;
                  }
              } else {
                  // Começa na primeira loja (assumindo que o motoboy vai até lá, coberto pela taxa base)
                  const firstStore = storeMap[storeIds[0]];
                  if (firstStore && firstStore.latitude) {
                    currentLat = firstStore.latitude;
                    currentLon = firstStore.longitude;
                  }
              }

              // Percurso entre lojas
              for (let i = 0; i < storeIds.length; i++) {
                  const sId = storeIds[i];
                  const store = storeMap[sId];
                  if (!store || !store.latitude) continue;

                  // Se não é a primeira loja (ou se já definiu currentLat), calcula distancia
                  // Se for a primeira e não veio da central, currentLat já é ela, dist é 0
                  if (currentLat && (Math.abs(currentLat - store.latitude) > 0.00001)) {
                      totalDist += calcDist(currentLat, currentLon, store.latitude, store.longitude);
                  }
                  currentLat = store.latitude;
                  currentLon = store.longitude;
              }

              // Percurso Última Loja -> Cliente
              if (currentLat) {
                  totalDist += calcDist(currentLat, currentLon, delivery_latitude, delivery_longitude);
              }

              // Retorno à Central (Devolver Maquininha)
              if (needsMachine && hasCentral) {
                  totalDist += calcDist(delivery_latitude, delivery_longitude, cLat, cLon);
              }

              // 6. Calcular Custo Total e Dividir
              const totalFee = 20.00 + (totalDist * 2.00);
              overrideFee = parseFloat((totalFee / ordersToCreate.length).toFixed(2));
              
          } catch (err) {
              console.error("Erro ao calcular frete unificado", err);
              // Fallback para cálculo individual
          }
      }

      for (const orderData of ordersToCreate) {
          const result = await createSingleOrder(connection, {
              client_id,
              store_id: orderData.store_id,
              items: orderData.items,
              delivery_address,
              delivery_observation,
              delivery_latitude,
              delivery_longitude,
              payment_method,
              batch_id,
              overrideFee,
              delivery_code: shared_delivery_code,
              pixDiscount
          });
          createdOrders.push(result);
      }

      await connection.commit();

      // --- ASAAS PAYMENT INTEGRATION ---
      let paymentInfo = null;
      if (payment_method.startsWith('asaas')) {
          try {
              const globalTotal = createdOrders.reduce((acc, o) => acc + o.total_amount, 0);
              
              // Determine Billing Type based on payment_method suffix
               // asaas_pix -> PIX, asaas_boleto -> BOLETO, asaas_link -> UNDEFINED, asaas -> PIX (default)
               let billingType = 'PIX';
               let creditCardData = {};

               if (payment_method === 'asaas_boleto') billingType = 'BOLETO';
               if (payment_method === 'asaas_link') billingType = 'UNDEFINED';
               if (payment_method === 'asaas_credit_card') {
                   billingType = 'CREDIT_CARD';
                   if (req.body.creditCard) {
                       creditCardData.creditCard = req.body.creditCard;
                   }
               }
              
              // Fetch user data
              const [users] = await db.query('SELECT nome, email, telefone, whatsapp, cpf FROM usuarios WHERE id = ?', [client_id]);
              const user = users[0];

              if (user) {
                   // Se veio CPF no corpo da requisição (atualizado no checkout), usa ele
                   const cpfToUse = req.body.cpf || user.cpf;

                   // Validação de CPF para Pix/Boleto
                   if (!cpfToUse) {
                       throw new Error('É necessário cadastrar o CPF no perfil para gerar o pagamento.');
                   }

                   // Se o CPF do DB for diferente do usado, atualiza
                   if (user.cpf !== cpfToUse) {
                       await db.query('UPDATE usuarios SET cpf = ? WHERE id = ?', [cpfToUse, client_id]);
                       user.cpf = cpfToUse;
                   }

                   // Populate Holder Info if Credit Card
                   if (billingType === 'CREDIT_CARD') {
                       creditCardData.creditCardHolderInfo = {
                           name: user.nome,
                           email: user.email,
                           cpfCnpj: cpfToUse,
                           postalCode: '13000-000',
                           addressNumber: req.body.addressNumber || 'SN',
                           phone: user.whatsapp || user.telefone
                       };
                   }

                   const payment = await asaas.createPayment({
                       customer: {
                           name: user.nome,
                           email: user.email,
                           phone: user.telefone,
                           mobilePhone: user.whatsapp || user.telefone,
                           cpf: cpfToUse
                       },
                       billingType: billingType,
                       value: globalTotal,
                       description: `Pedido(s) #${createdOrders.map(o => o.orderId).join(', ')} - Campinas Shopping`,
                       externalReference: batch_id || createdOrders[0].orderId.toString(),
                       ...creditCardData
                   });

                  // Get Pix QRCode immediately if available
                  let pixQrCode = null;
                  let boletoLine = null;
                  
                  if (payment.billingType === 'PIX') {
                      try {
                          pixQrCode = await asaas.getPixQrCode(payment.id);
                      } catch (e) { console.error('Error fetching Pix QRCode', e); }
                  } else if (payment.billingType === 'BOLETO') {
                      // Boleto info usually comes in payment object (bankSlipUrl) or we can get digitable line
                      // Asaas createPayment returns bankSlipUrl
                      boletoLine = payment.bankSlipUrl; // Simplification, frontend will use invoiceUrl or bankSlipUrl
                  }

                  paymentInfo = {
                      id: payment.id,
                      invoiceUrl: payment.invoiceUrl,
                      bankSlipUrl: payment.bankSlipUrl,
                      billingType: payment.billingType,
                      value: payment.value,
                      pixQrCode: pixQrCode ? pixQrCode.encodedImage : null,
                      pixCopyPaste: pixQrCode ? pixQrCode.payload : null
                  };
              }
          } catch (error) {
              console.error('Asaas Payment Creation Error:', error);
              throw error; // Propagar erro para rollback do pedido
          }
      }

      // 6. Notificações (Após commit)
      // Notifica lojista sempre, mas com mensagem diferente para Pix/Boleto Pendente
      for (const o of createdOrders) {
         try {
            // --- NOTIFICAÇÃO LOJISTA ---
            const [owners] = await db.query('SELECT telefone, whatsapp FROM usuarios WHERE id = ?', [o.store.usuario_id]);
            const ownerPhone = owners[0]?.whatsapp || owners[0]?.telefone;

            if (o.store.usuario_id) {
                const isAsaasPending = payment_method.startsWith('asaas');
                const notifTitle = isAsaasPending ? 'Novo pedido (Aguardando Pagamento)' : 'Novo pedido!';
                const notifBody = isAsaasPending 
                    ? `Pedido #${o.orderId} criado. Aguardando confirmação do Pagamento.` 
                    : `Pedido #${o.orderId} recebido em ${o.store.nome}`;

                notify.send(o.store.usuario_id, {
                    type: 'order_created',
                    order_id: o.orderId,
                    title: notifTitle,
                    body: notifBody,
                });
                
                if (ownerPhone) {
                    const waMsg = isAsaasPending
                        ? `🕒 Novo Pedido #${o.orderId} (Aguardando Pagamento). Acompanhe no painel.`
                        : `🔔 Novo Pedido #${o.orderId} recebido! Valor: R$ ${o.total_amount.toFixed(2)}. Acesse o painel para ver detalhes.`;
                    whatsapp.sendText(ownerPhone, waMsg);
                }
            }
         } catch (e) { console.error('Notify owner error', e); }
      }

      // --- NOTIFICAÇÃO MOTOBOYS (APENAS SE NÃO FOR ASAAS PENDENTE) ---
      // Motoboy só recebe quando confirmado
      if (!payment_method.startsWith('asaas')) {
        try {
          const [couriers] = await db.query("SELECT id, telefone, whatsapp FROM usuarios WHERE tipo = 'courier'"); 
          
          for (const o of createdOrders) {
            couriers.forEach(c => {
                notify.send(c.id, {
                    type: 'new_delivery_available',
                    order_id: o.orderId,
                    title: 'Nova entrega disponível',
                    body: `Pedido #${o.orderId} aguardando coleta na loja ${o.store.nome}`,
                });
            });
          }
        } catch (e) { console.error('Notify couriers error', e); }
      }

      return res.json({ 
          message: 'Pedidos criados com sucesso', 
          orders: createdOrders.map(o => ({ id: o.orderId, total: o.total_amount })),
          payment_info: paymentInfo
      });

    } catch (error) {
      try { await connection.rollback(); } catch(e) {} // Evita erro se rollback falhar após commit
      console.error(error);
      return res.status(500).json({ error: error.message || 'Falha ao criar pedido' });
    } finally {
      connection.release();
    }
  },

  // --- LISTAR PEDIDOS ---
  async index(req, res) {
    try {
      const role = req.userRole;
      const userId = req.userId;
      const mode = req.query.mode; // Permite forçar modo vendedor via query param
      
      let query = `
        SELECT 
          o.id, o.valor_total as total_amount, o.status, o.criado_em as created_at, o.codigo_entrega as delivery_code, o.taxa_entrega as delivery_fee, o.metodo_pagamento as payment_method, o.endereco_entrega as delivery_address, o.observacoes as delivery_observation, o.lote_id as batch_id,
          o.codigo_coleta_loja as store_pickup_code, o.codigo_coleta_admin as admin_pickup_code, o.etapa_status as step_status,
          o.motoboy_id as courier_id, o.loja_id as store_id, o.cliente_id as client_id,
          s.nome as store_name, s.endereco as store_address, s.latitude as store_latitude, s.longitude as store_longitude,
          c.nome as client_name, c.telefone as client_phone, c.whatsapp as client_whatsapp,
          courier.nome as courier_name, courier.telefone as courier_phone, courier.veiculo_tipo as vehicle_type, courier.veiculo_placa as vehicle_plate, courier.avatar_url as courier_avatar
        FROM pedidos o
        JOIN lojas s ON o.loja_id = s.id
        JOIN usuarios c ON o.cliente_id = c.id
        LEFT JOIN usuarios courier ON o.motoboy_id = courier.id
      `;
      
      const params = [];

      // Lógica ajustada: Se pedir mode=seller ou for shop_owner, busca pela loja do usuário
      if (mode === 'seller' || role === 'shop_owner') {
        const [stores] = await db.query('SELECT id FROM lojas WHERE usuario_id = ?', [userId]);
        if (stores.length === 0) return res.json([]);
        
        // Shop Owner vê apenas pedidos confirmados/pagos (ignora 'pending' do Asaas)
        query += ' WHERE o.loja_id = ? AND o.status != "pending"';
        params.push(stores[0].id);
      } else if (role === 'client') {
        query += ' WHERE o.cliente_id = ?';
        params.push(userId);
      } else if (role === 'courier') {
        query += ' WHERE (o.status IN ("pending", "accepted", "ready_for_pickup") AND o.motoboy_id IS NULL) OR o.motoboy_id = ?';
        params.push(userId);
      } else if (role === 'admin') {
         // Admin vê tudo
      } else {
         return res.status(403).json({ error: 'Função não autorizada' });
      }

      query += ' ORDER BY o.criado_em DESC';

      const [orders] = await db.query(query, params);

      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const [items] = await db.query(`
          SELECT oi.*, p.nome as product_name, p.imagem_url as imageUrl 
          FROM itens_pedido oi
          LEFT JOIN produtos p ON oi.produto_id = p.id
          WHERE oi.pedido_id IN (?)
        `, [orderIds]);

        // Agrupar itens por pedido
        const itemsMap = {};
        items.forEach(item => {
          if (!itemsMap[item.pedido_id]) itemsMap[item.pedido_id] = [];
          itemsMap[item.pedido_id].push({
            ...item,
            product: { nome: item.product_name, imagem_url: item.imageUrl }
          });
        });

        // Anexar itens aos pedidos
        orders.forEach(order => {
          order.items = itemsMap[order.id] || [];
        });
      }
      
      const sanitizedOrders = orders.map(o => {
          // Nest store info
          o.store = {
              id: o.store_id,
              nome: o.store_name,
              name: o.store_name,
              endereco: o.store_address,
              address: o.store_address,
              latitude: o.store_latitude,
              longitude: o.store_longitude
          };
          // Legacy support
          o.loja = o.store;

          // Nest courier info
          if (o.courier_name) {
            o.courier = {
              nome: o.courier_name,
              name: o.courier_name,
              telefone: o.courier_phone,
              phone: o.courier_phone,
              veiculo_tipo: o.vehicle_type,
              veiculo_placa: o.vehicle_plate,
              avatar_url: o.courier_avatar
            };
            o.motoboy = o.courier;
          }

          if (role === 'shop_owner') {
              const { codigo_entrega, ...rest } = o;
              return rest;
          }
          return o;
      });

      return res.json(sanitizedOrders);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Falha ao buscar pedidos' });
    }
  },

  // --- ATUALIZAR STATUS ---
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [orders] = await db.query('SELECT * FROM pedidos WHERE id = ?', [id]);
      if (orders.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
      const order = orders[0];

      let updateQuery = 'UPDATE pedidos SET status = ?';
      const params = [status];
      let targetIds = [id];

      // Se for courier aceitando o pedido, vincula a ele
      // E SE TIVER BATCH_ID, VINCULA TODOS DO BATCH
      if ((status === 'delivering' || status === 'accepted') && req.userRole === 'courier') {
        updateQuery += ', motoboy_id = ?';
        params.push(req.userId);

        if (order.lote_id) {
            // Encontrar outros pedidos do mesmo batch que ainda não têm courier
            const [batchOrders] = await db.query('SELECT id FROM pedidos WHERE lote_id = ? AND motoboy_id IS NULL', [order.lote_id]);
            const batchIds = batchOrders.map(o => o.id);
            // Mesclar IDs (garantindo unicidade)
            targetIds = [...new Set([...targetIds, ...batchIds])];
        }
      }
      
      // Construir query para múltiplos IDs
      updateQuery += ` WHERE id IN (?)`;
      params.push(targetIds);

      await db.query(updateQuery, params);

      // Notificações (Iterar sobre todos os pedidos afetados)
      // Recarregar pedidos para ter dados atualizados (loja_id, etc)
      const [affectedOrders] = await db.query('SELECT * FROM pedidos WHERE id IN (?)', [targetIds]);

      for (const affOrder of affectedOrders) {
          try {
            const [stores] = await db.query('SELECT usuario_id, nome FROM lojas WHERE id = ?', [affOrder.loja_id]);
            const ownerId = stores[0]?.usuario_id;
            const storeName = stores[0]?.nome;

            // IDs para notificar
            const targets = [affOrder.cliente_id, ownerId, affOrder.motoboy_id].filter(Boolean);
            
            if (targets.length > 0) {
                const [users] = await db.query('SELECT id, telefone, whatsapp, tipo FROM usuarios WHERE id IN (?)', [targets]);
                
                users.forEach(u => {
                    const statusMap = {
                    'pending': 'Pendente',
                    'accepted': 'Aceito / Em Preparação',
                    'ready_for_pickup': 'Pronto para Retirada',
                    'delivering': 'Saiu para Entrega',
                    'delivered': 'Entregue',
                    'canceled': 'Cancelado'
                    };

                    const statusPT = statusMap[status] || status;

                    notify.send(u.id, {
                        type: 'status_updated',
                        order_id: affOrder.id,
                        title: 'Status Atualizado',
                        body: `O pedido #${affOrder.id} mudou para: ${statusPT}`
                    });

                    // WhatsApp Message
                    const phone = u.whatsapp || u.telefone;
                    if (phone) {
                        let msg = '';
                        if (status === 'ready_for_pickup') msg = `📦 Pedido #${affOrder.id} pronto para retirada na loja ${storeName}.`;
                        else if (status === 'delivering') {
                            msg = `🚀 Pedido #${affOrder.id} saiu para entrega com ${req.userName || 'o entregador'}! Código: *${affOrder.codigo_entrega}*.`;
                        }
                        else if (status === 'delivered') msg = `✅ Pedido #${affOrder.id} entregue com sucesso.`;
                        else msg = `ℹ️ Pedido #${affOrder.id}: status alterado para ${statusPT}.`;
                        
                        whatsapp.sendText(phone, msg);
                    }
                });
            }
          } catch (e) { console.error('Erro notification status inner:', e); }
      }

      return res.json({ message: 'Status atualizado', affected_orders: targetIds });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Falha ao atualizar pedido' });
    }
  },

  // --- CONFIRMAR ENTREGA (MOTOBOY) ---
  // Agora suporta múltiplas etapas: Máquina -> Loja -> Cliente
  async confirmDelivery(req, res) {
    try {
      const { id } = req.params;
      const { code } = req.body;
      const courierId = req.userId;

      const [orders] = await db.query('SELECT * FROM pedidos WHERE id = ?', [id]);
      if (orders.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
      const order = orders[0];

      if (order.motoboy_id !== courierId && req.userRole !== 'admin') {
          return res.status(403).json({ error: 'Não autorizado para este pedido' });
      }

      // Determinar etapa atual
      const needsMachine = ['credit_card', 'debit_card'].includes(order.metodo_pagamento);
      let nextStep = '';
      let requiredCode = '';
      let nextStepStatus = '';
      let nextStatus = '';
      let message = '';

      // Lógica de Etapas
      if (order.etapa_status === 'pending') {
          if (needsMachine) {
              // Etapa 1: Pegar Maquininha
              // Verifica Senha Global (Diária) ou Específica
              const [settings] = await db.query("SELECT valor FROM configuracoes WHERE chave = 'daily_machine_password'");
              const globalPass = settings[0]?.valor;

              if (code !== globalPass && code !== order.codigo_coleta_admin) {
                  return res.status(400).json({ error: 'Senha da maquininha incorreta!' });
              }

              // Se validou, define updates
              nextStepStatus = 'machine_collected';
              nextStatus = 'accepted'; 
              message = 'Maquininha retirada com sucesso! Siga para a loja.';
              
              // SE FOR BATCH, ATUALIZA TODOS DO MESMO LOTE QUE ESTÃO NA ETAPA 'pending' E PRECISAM DE MAQUINA
              if (order.lote_id) {
                 const [batchOrders] = await db.query('SELECT id, metodo_pagamento FROM pedidos WHERE lote_id = ? AND etapa_status = "pending"', [order.lote_id]);
                 const idsToUpdate = batchOrders
                    .filter(o => ['credit_card', 'debit_card'].includes(o.metodo_pagamento))
                    .map(o => o.id);
                 
                 if (idsToUpdate.length > 0) {
                     await db.query(`UPDATE pedidos SET etapa_status = ?, status = ? WHERE id IN (?)`, [nextStepStatus, nextStatus, idsToUpdate]);
                     return res.json({ message: 'Maquininha confirmada para o pacote!', new_status: nextStatus, next_step: 'store' });
                 }
              }

              // Se não for batch ou só 1
              requiredCode = null; // Já validamos manualmente acima
          } else {
              // Etapa 1 (Sem maquina): Pegar Produto
              requiredCode = order.codigo_coleta_loja;
              nextStepStatus = 'product_collected';
              nextStatus = 'delivering';
              message = 'Produto coletado! Siga para o cliente.';
              nextStep = 'store';
          }
      } else if (order.etapa_status === 'machine_collected') {
          // Etapa 2: Pegar Produto (após maquina)
          requiredCode = order.codigo_coleta_loja;
          nextStepStatus = 'product_collected';
          nextStatus = 'delivering';
          message = 'Produto coletado! Siga para o cliente.';
          nextStep = 'store';
      } else if (order.etapa_status === 'product_collected') {
          // Etapa 3: Entregar ao Cliente
          requiredCode = order.codigo_entrega;
          nextStepStatus = 'delivered';
          nextStatus = 'delivered';
          message = 'Entrega finalizada com sucesso!';
          nextStep = 'client';
          
          // SE FOR BATCH, Verifica se outros pedidos do mesmo batch têm o mesmo código
          if (order.lote_id && code === order.codigo_entrega) {
              const [batchOrders] = await db.query('SELECT id, codigo_entrega FROM pedidos WHERE lote_id = ? AND etapa_status = "product_collected"', [order.lote_id]);
              const idsToUpdate = batchOrders
                 .filter(o => o.codigo_entrega === code)
                 .map(o => o.id);
              
              if (idsToUpdate.length > 0) {
                  await db.query(`UPDATE pedidos SET etapa_status = ?, status = ? WHERE id IN (?)`, [nextStepStatus, nextStatus, idsToUpdate]);
                  
                  // Notificar sobre todos
                  // ... (idealmente, mas o front já vai receber o update no polling)
                  
                  return res.json({ message: 'Entregas do pacote finalizadas com sucesso!', affected_orders: idsToUpdate });
              }
          }

      } else if (order.etapa_status === 'delivered' || order.status === 'delivered') {
          return res.status(400).json({ error: 'Pedido já entregue!' });
      } else {
          // Fallback para pedidos antigos ou erro de estado
           // Se status for delivered, ok. Se não, tenta delivery code
           requiredCode = order.codigo_entrega;
           nextStepStatus = 'delivered';
           nextStatus = 'delivered';
           message = 'Entrega confirmada!';
      }

      // Validação do Código
      if (requiredCode !== code) {
          return res.status(400).json({ error: 'Código inválido para esta etapa!' });
      }

      // Atualizar Banco
      let updateQuery = 'UPDATE pedidos SET etapa_status = ?';
      const params = [nextStepStatus];

      if (nextStatus) {
          updateQuery += ', status = ?';
          params.push(nextStatus);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      await db.query(updateQuery, params);

      // Notificações Específicas
      try {
        const [stores] = await db.query('SELECT usuario_id, nome FROM lojas WHERE id = ?', [order.loja_id]);
        const ownerId = stores[0]?.usuario_id;
        const storeName = stores[0]?.nome;
        
        // Notificar alvos relevantes
        const targets = [order.cliente_id, ownerId, courierId].filter(Boolean);
        if (targets.length > 0) {
             const [users] = await db.query('SELECT id, telefone, whatsapp, tipo FROM usuarios WHERE id IN (?)', [targets]);
             
             users.forEach(u => {
                 const phone = u.whatsapp || u.telefone;
                 
                 // Mensagens personalizadas por etapa
                 if (nextStep === 'machine') {
                     // Apenas entregador e admin (se admin monitorasse) precisam saber
                     if (u.tipo === 'courier') notify.send(u.id, { type: 'step_updated', title: 'Maquininha OK', body: message });
                 } else if (nextStep === 'store') {
                     // Produto coletado: Avisar cliente que saiu para entrega
                     if (u.tipo === 'client') {
                         notify.send(u.id, { type: 'order_delivering', title: 'Saiu para entrega!', body: `Seu pedido de ${storeName} está a caminho.` });
                         if (phone) whatsapp.sendText(phone, `🚀 Pedido #${id} saiu para entrega! Prepare-se para receber.`);
                     }
                 } else if (nextStatus === 'delivered') {
                     // Entrega finalizada
                     notify.send(u.id, { type: 'order_delivered', title: 'Pedido Entregue! 🎉', body: `O pedido #${id} foi entregue.` });
                     if (phone) {
                         let msg = `🎉 Pedido #${id} entregue com sucesso!`;
                         whatsapp.sendText(phone, msg);
                     }
                 }
             });
        }
      } catch (e) { console.error('Erro notify step:', e); }

      return res.json({ message, step_status: nextStepStatus, status: nextStatus });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Falha ao confirmar etapa' });
    }
  },

  // --- RASTREAMENTO (SSE) ---
  async track(req, res) {
    try {
      const { id } = req.params;
      let userId = req.userId;
      
      if (!userId) {
         const token = req.query.token;
         if (!token) return res.status(401).end();
         try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
         } catch { return res.status(401).end(); }
      }

      const [orders] = await db.query(`
        SELECT o.*, s.user_id as owner_id 
        FROM orders o 
        JOIN stores s ON o.store_id = s.id 
        WHERE o.id = ?
      `, [id]);
      
      if (orders.length === 0) return res.status(404).end();
      const order = orders[0];

      const isPermitted = (
         order.client_id === userId || 
         order.owner_id === userId || 
         order.courier_id === userId
      );

      if (!isPermitted) return res.status(403).end();

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('\n');

      if (order.courier_id) {
         // Simulação ou busca real de localização
         const [users] = await db.query('SELECT latitude, longitude FROM users WHERE id = ?', [order.courier_id]);
         if (users.length > 0 && users[0].latitude) {
            const data = JSON.stringify({ latitude: users[0].latitude, longitude: users[0].longitude });
            res.write(`data: ${data}\n\n`);
         }
      }

      const intervalId = setInterval(async () => {
         if (order.courier_id) {
             const [users] = await db.query('SELECT latitude, longitude FROM users WHERE id = ?', [order.courier_id]);
             if (users.length > 0 && users[0].latitude) {
                const data = JSON.stringify({ latitude: users[0].latitude, longitude: users[0].longitude });
                res.write(`data: ${data}\n\n`);
             }
         }
      }, 5000);

      req.on('close', () => {
        clearInterval(intervalId);
      });

    } catch (error) {
      console.error(error);
      res.end();
    }
  }
};
