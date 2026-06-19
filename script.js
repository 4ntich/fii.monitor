const API_TOKEN = '2v6TVtVXCe8Fhoeaj76uBM';
const listaFIIs = ['MXRF11', 'HGLG11', 'KNRI11', 'XPLG11', 'ALZR11', 'VISC11', 'BTLG11'];

// Banco de dados qualitativo complementar 
const fiiQualitativeData = {
    'MXRF11': { setor: 'Papel (Recebíveis)', motivosQueda: 'Oscilações marginais ligadas a índices (IPCA/IGPM).', perspectiva: 'Altamente estável.', analise: 'O Maxi Renda foca em CRIs de boa qualidade e permutas. Excelente liquidez de tela.' },
    'HGLG11': { setor: 'Logística', motivosQueda: 'Ajustes no mercado após transações complexas de ativos.', perspectiva: 'Excelente.', analise: 'Referência em galpões industriais (Triple-A) próximos a São Paulo.' },
    'KNRI11': { setor: 'Híbrido (Lajes/Logística)', motivosQueda: 'Vacância física pontual em escritórios RJ/SP.', perspectiva: 'Positiva.', analise: 'Fundo conservador com inquilinos de grande porte e previsibilidade forte.' },
    'XPLG11': { setor: 'Logística', motivosQueda: 'Devoluções programadas em módulos pontuais.', perspectiva: 'Positiva.', analise: 'Consolida forte presença geográfica focada em e-commerce e varejo moderno.' },
    'ALZR11': { setor: 'Híbrido (Contratos Atípicos)', motivosQueda: 'Mínimas flutuações, historicamente baixa volatilidade.', perspectiva: 'Altamente Previsível.', analise: 'Imune parcialmente a macroeconomia devido aos contratos atípicos Built-to-Suit.' },
    'VISC11': { setor: 'Shopping Centers', motivosQueda: 'Ajustes sazonais naturais de consumo varejista.', perspectiva: 'Otimista.', analise: 'Portfólio pulverizado, minimizando riscos operacionais por diversificação de bandeiras.' },
    'BTLG11': { setor: 'Logística', motivosQueda: 'Flutuações por alocação de caixa após aquisições.', perspectiva: 'Promissora.', analise: 'Tese de crescimento forte e cap rates atrativos próximos aos centros de consumo.' }
};

let globalFiiData = [];

document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR');

// Função robusta com tratamentos para Web
async function buscarApiComFallback(tickersQuery) {
    let url = `https://brapi.dev/api/quote/${tickersQuery}?token=${API_TOKEN}&modules=dividend`;
    
    // Alerta lógico para o desenvolvedor
    if (window.location.protocol === 'file:') {
        console.warn("⚠️ ALERTA: Você está abrindo via arquivo local (file:///). O navegador provavelmente vai bloquear a requisição (CORS).");
    }

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        throw new Error('Bloqueio de Rede/CORS. O navegador impediu a conexão (Você abriu direto do computador usando file:///? Use um servidor web ou Live Server).');
    }

    // Se a API barrar o módulo de dividendos (Erro 401 ou 403), tentamos o "Plano B" só com cotações
    if (response.status === 403 || response.status === 401) {
        console.warn(`Erro HTTP ${response.status} detectado. Possível restrição do token. Acionando Fallback (cotações simples)...`);
        url = `https://brapi.dev/api/quote/${tickersQuery}?token=${API_TOKEN}`;
        response = await fetch(url);
    }
    
    return response;
}

async function carregarDashboard() {
    const tbody = document.getElementById('fii-body');
    
    try {
        const tickersQuery = listaFIIs.join('%2C');
        const response = await buscarApiComFallback(tickersQuery);
        
        if (!response.ok) {
            let msgErro = `Erro HTTP: ${response.status}`;
            if (response.status === 401) msgErro = 'Token Inválido ou Inativo.';
            if (response.status === 429) msgErro = 'Limite de Requisições Excedido (Free Tier).';
            throw new Error(`O Servidor da Bolsa recusou a conexão: ${msgErro}`);
        }
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('A API respondeu com sucesso, mas o pacote de dados dos ativos veio vazio.');
        }

        globalFiiData = data.results.map(fii => {
            const ticker = fii.symbol;
            const dadosLocais = fiiQualitativeData[ticker] || { setor: 'Fundo', motivosQueda: 'Ajuste de mercado.', perspectiva: 'Estável.', analise: 'Em breve.' };

            // Trata o cenário onde os dividendos não vêm na resposta
            const listaProventos = fii.dividendsData?.cashDividends || [];
            const ultimoProvento = listaProventos.length > 0 ? listaProventos[0].rate : 0;
            const precoAtual = fii.regularMarketPrice || 0;
            
            const dyEstimado = precoAtual > 0 ? ((ultimoProvento * 12) / precoAtual) * 100 : 0;

            let tendencia = 'neutro';
            if (fii.regularMarketChangePercent > 0.1) tendencia = 'alta';
            if (fii.regularMarketChangePercent < -0.1) tendencia = 'baixa';

            return {
                ticker: ticker,
                setor: dadosLocais.setor,
                preco: precoAtual,
                dividendo: ultimoProvento,
                dy: dyEstimado,
                tendencia: tendencia,
                motivosQueda: dadosLocais.motivosQueda,
                perspectiva: dadosLocais.perspectiva,
                analise: dadosLocais.analise
            };
        });

        // Ordena
        globalFiiData.sort((a, b) => b.dy - a.dy);
        renderizarTabela();

    } catch (error) {
        console.error('Falha técnica capturada:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 40px;">
            <strong style="font-size: 1.2rem;">Ops! A integração falhou.</strong><br>
            <span style="font-size: 0.95rem; color: #334155;">Motivo exato: <b>${error.message}</b></span><br><br>
            <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; display: inline-block; text-align: left; max-width: 650px;">
                <strong>Debug para Desenvolvedor:</strong><br>
                1. Aperte <b>F12</b> no seu teclado e abra a aba <b>Console</b>.<br>
                2. Se houver um erro vermelho de "CORS" ou "Network", seu sistema não tem permissão de abrir o arquivo localmente. Suba o projeto numa URL na nuvem ou use um host local via VS Code.<br>
                3. Se o erro for na chave API, verifique a ativação do seu painel Brapi.
            </div>
        </td></tr>`;
    }
}

function renderizarTabela() {
    const tbody = document.getElementById('fii-body');
    tbody.innerHTML = '';

    globalFiiData.forEach((fii, index) => {
        const tr = document.createElement('tr');
        
        let badgeClass = fii.tendencia;
        let badgeText = fii.tendencia === 'alta' ? 'Em Alta ▲' : fii.tendencia === 'baixa' ? 'Em Queda ▼' : 'Estável ▬';

        // Feedback caso os dados não carreguem devido a limitações de conta
        let textoDY = fii.dy > 0 ? `${fii.dy.toFixed(2).replace('.', ',')}%` : '--';
        let textoDiv = fii.dividendo > 0 ? `R$ ${fii.dividendo.toFixed(4).replace('.', ',')}` : '--';

        tr.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td><span style="font-weight: 700; color: var(--secondary-color);">${fii.ticker}</span></td>
            <td>${fii.setor}</td>
            <td>R$ ${fii.preco.toFixed(2).replace('.', ',')}</td>
            <td>${textoDiv}</td>
            <td style="font-weight: 700; color: #1e40af; font-size: 1.05rem;">${textoDY}</td>
            <td><span class="trend-badge ${badgeClass}">${badgeText}</span></td>
            <td><button class="btn-action" onclick="abrirModal('${fii.ticker}')">Ver Detalhes</button></td>
        `;
        tbody.appendChild(tr);
    });
}

const modal = document.getElementById('fii-modal');
const closeBtn = document.querySelector('.close-btn');

window.abrirModal = function(ticker) {
    const fii = globalFiiData.find(f => f.ticker === ticker);
    if (!fii) return;

    document.getElementById('modal-ticker').textContent = fii.ticker;
    document.getElementById('modal-sector').textContent = fii.setor;
    document.getElementById('modal-price').textContent = `R$ ${fii.preco.toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-dividend').textContent = fii.dividendo > 0 ? `R$ ${fii.dividendo.toFixed(4).replace('.', ',')}` : 'Requer API Premium';
    document.getElementById('modal-dy').textContent = fii.dy > 0 ? `${fii.dy.toFixed(2).replace('.', ',')}%` : 'Requer API Premium';
    document.getElementById('modal-risks').textContent = fii.motivosQueda;
    document.getElementById('modal-future').textContent = fii.perspectiva;
    document.getElementById('modal-analysis').textContent = fii.analise;

    modal.style.display = 'block';
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; }

carregarDashboard();
