const axios = require('axios');
const db = require('../database');

const getSettings = async () => {
    const [rows] = await db.query("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'asaas_%'");
    const config = {};
    rows.forEach(r => config[r.chave] = r.valor);
    return config;
};

const getBaseUrl = (sandbox) => {
    // Handle various truthy values from DB (string '1', 'true', boolean true, number 1)
    const isSandbox = sandbox === 'true' || sandbox === true || sandbox === '1' || sandbox === 1;
    return isSandbox 
        ? 'https://sandbox.asaas.com/api/v3' 
        : 'https://api.asaas.com/api/v3';
};

module.exports = {
    async createPayment({ customer, billingType, value, dueDate, description, externalReference, creditCard, creditCardHolderInfo }) {
        const config = await getSettings();
        const apiKey = config.asaas_api_key;
        const baseUrl = getBaseUrl(config.asaas_sandbox);
        
        console.log(`[Asaas] Init: URL=${baseUrl}, SandboxConfig=${config.asaas_sandbox}, KeyPresent=${!!apiKey}`);

        if (!apiKey) {
            throw new Error('Asaas API Key not configured');
        }

        const api = axios.create({
            baseURL: baseUrl,
            headers: {
                'access_token': apiKey
            }
        });

        // 1. Check or Create Customer in Asaas
        // Simplified: We will just create a new payment without checking customer for now, 
        // or we can search by CPF/Email. Let's try to create a customer first if needed.
        // For simplicity, we'll assume we can pass customer info directly or create it.
        
        let customerId;
        try {
            const { data: customers } = await api.get(`/customers?email=${customer.email}`);
            if (customers.data && customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                const { data: newCustomer } = await api.post('/customers', {
                    name: customer.name,
                    email: customer.email,
                    cpfCnpj: customer.cpf || customer.cpfCnpj,
                    phone: customer.phone,
                    mobilePhone: customer.mobilePhone || customer.phone
                });
                customerId = newCustomer.id;
            }
        } catch (error) {
            console.error('Error handling customer in Asaas:', error.response?.data || error.message);
            const apiError = error.response?.data?.errors?.[0]?.description;
            const msg = apiError ? `Asaas Error: ${apiError}` : `Falha ao registrar cliente no Asaas: ${error.message}`;
            throw new Error(msg);
        }

        // 2. Create Payment
        try {
            const payload = {
                customer: customerId,
                billingType: billingType || 'PIX', // PIX, BOLETO, CREDIT_CARD
                value,
                dueDate: dueDate || new Date().toISOString().split('T')[0],
                description,
                externalReference,
                creditCard,
                creditCardHolderInfo
            };

            const { data: payment } = await api.post('/payments', payload);
            return payment;
        } catch (error) {
            console.error('Error creating payment in Asaas:', error.response?.data || error.message);
            const apiError = error.response?.data?.errors?.[0]?.description;
            const msg = apiError ? `Asaas Payment Error: ${apiError}` : `Falha ao criar cobrança no Asaas: ${error.message}`;
            throw new Error(msg);
        }
    },

    async getPixQrCode(paymentId) {
        const config = await getSettings();
        const apiKey = config.asaas_api_key;
        
        const api = axios.create({
            baseURL: getBaseUrl(config.asaas_sandbox),
            headers: {
                'access_token': apiKey
            }
        });

        try {
            const { data } = await api.get(`/payments/${paymentId}/pixQrCode`);
            return data;
        } catch (error) {
            console.error('Error getting Pix QrCode:', error.response?.data || error.message);
            throw error;
        }
    }
};
