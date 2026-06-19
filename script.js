// Removemos a necessidade de API_TOKEN. A API do Yahoo Finance é pública.
// Adicionamos o sufixo .SA que o Yahoo exige para ativos da bolsa brasileira (B3)
const listaFIIs = ['MXRF11.SA', 'HGLG11.SA', 'KNRI11.SA', 'XPLG11.SA', 'ALZR11.SA', 'VISC11.SA', 'BTLG11.SA'];

// Base de dados qualitativa (Análises redigidas por si para o SaaS)
const fiiQualitativeData = {
    'MXRF11': { setor: 'Papel (Recebíveis)', motivosQueda: 'Oscilações ligadas a índices (IPCA/IGPM).', perspectiva: 'Altamente estável.', analise: 'O Maxi Renda foca-se em CRIs de boa qualidade e possui excelente liquidez.' },
    'HGLG11': { setor: 'Logística', motivosQueda: 'Ajustes no mercado após transações de ativos.', perspectiva: 'Excelente.', analise: 'Referência em pavilhões industriais (Triple-A) próximos a São Paulo.' },
    'KNRI11': { setor: 'Híbrido (Lajes/Logística)', motivosQueda: 'Vacância física pontual em escritórios RJ/SP.', perspectiva: 'Positiva.', analise: 'Fundo conservador com inquilinos de grande porte e resiliência.' },
    'XPLG11': { setor: 'Logística', motivosQueda: 'Devoluções programadas em módulos pontuais.', perspectiva: 'Positiva.', analise: 'Consolida forte presença geográfica focada em e-commerce moderno.' },
    'ALZR11': { setor: 'Híbrido', motivosQueda: 'Mínimas flutuações de cota.', perspectiva: 'Altamente Previsível.', analise: 'Imune parcialmente à macroeconomia devido a contratos atípicos.' },
    'VISC11': { setor: 'Shopping Centers', motivosQueda: 'Ajustes sazonais naturais do consumo varejista.', perspectiva: 'Otimista.', analise: 'Portfólio altamente pulverizado, minimizando riscos operacionais.' },
    'BTLG11': { setor: 'Logística', motivosQueda: 'Alocação de capital após aquisições.', perspectiva: 'Promissora.', analise: 'Tese de crescimento estrutural forte e cap rates atrativos.' }
};

document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-PT');

async function carregarDashboard() {
    const tbody = document.getElementById('fii-body');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; font-weight: bold; color: #2563eb;">A ligar aos servidores do Yahoo Finance... ⏳</td></tr>';

    try {
        // Mapeamos cada FII para uma promessa de busca na API do Yahoo
        const promessasDeBusca = listaFIIs.map(async (ticker) => {
            // Endpoint do Yahoo que traz resumo detalhado e preço
            const urlYahoo = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,price`;
            
            // Usamos o proxy público AllOrigins para evitar o bloqueio de CORS do navegador
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlYahoo)}`;

            const resposta = await fetch(proxyUrl);
            if (!resposta.ok) throw new Error(`Falha de rede ao aceder a ${ticker}`);

            const proxyData = await resposta.json();
            const yahooData = JSON.parse(proxyData.contents); // O proxy devolve os dados reais dentro de "contents"

            if (!yahooData.quoteSummary || !yahooData.quoteSummary.result) {
                return null; // Ignora se o fundo não for encontrado
            }

            const resultado = yahooData.quoteSummary.result[0];
            const priceData = resultado.price;
            const summaryData = resultado.summaryDetail;

            // Limpa o .SA para mostrar de forma elegante no ecrã (ex: MXRF11)
            const tickerLimpo = ticker.replace('.SA', '');
            const dadosQualitativos = fiiQualitativeData[tickerLimpo] || { setor: 'FII', motivosQueda: '-', perspectiva: '-', analise: '-' };

            const precoAtual = priceData.regularMarketPrice?.raw || 0;
            const variacaoDiaria = priceData.regularMarketChangePercent?.raw || 0;
            
            // O Yahoo devolve o DY em decimal (ex: 0.12 para 12%). Multiplicamos por 100.
            const dyAnual = (summaryData.dividendYield?.raw || summaryData.trailingAnnualDividendYield?.raw || 0) * 100;
            
            // O Yahoo fornece a taxa anual de dividendos. Dividimos por 12 para ter uma estimativa mensal.
            const dividendoMensal = (summaryData.dividendRate?.raw || 0) / 12;

            let tendencia = 'neutro';
            if (variacaoDiaria > 0.001) tendencia = 'alta';
            if (variacaoDiaria < -0.001) tendencia = 'baixa';

            return {
                ticker: tickerLimpo,
                setor: dadosQualitativos.setor,
                preco: precoAtual,
                dividendo: dividendoMensal,
                dy: dyAnual,
                tendencia: tendencia,
                motivosQueda: dadosQualitativos.motivosQueda,
                perspectiva: dadosQualitativos.perspectiva,
                analise: dadosQualitativos.analise
            };
        });

        // Aguarda que todas as buscas em simultâneo terminem
        let globalFiiData = await Promise.all(promessasDeBusca);
        
        // Remove valores nulos (caso a API não encontre algum fundo específico)
        globalFiiData = globalFiiData.filter(fii => fii !== null);

        if (globalFiiData.length === 0) {
            throw new Error("Não foi possível extrair os dados financeiros.");
        }

        // Ordenar rigorosamente do melhor para o pior Dividend Yield
        globalFiiData.sort((a, b) => b.dy - a.dy);

        // Renderizar a Tabela no Ecrã
        tbody.innerHTML = '';
        globalFiiData.forEach((fii, index) => {
            const tr = document.createElement('tr');
            let badgeClass = fii.tendencia;
            let badgeText = fii.tendencia === 'alta' ? 'Em Alta ▲' : fii.tendencia === 'baixa' ? 'Em Queda ▼' : 'Estável ▬';

            tr.innerHTML = `
                <td><strong>#${index + 1}</strong></td>
                <td><span style="font-weight: 700; color: var(--secondary-color);">${fii.ticker}</span></td>
                <td>${fii.setor}</td>
                <td>R$ ${fii.preco.toFixed(2).replace('.', ',')}</td>
                <td>R$ ${fii.dividendo.toFixed(4).replace('.', ',')}</td>
                <td style="font-weight: 700; color: #1e40af; font-size: 1.05rem;">${fii.dy.toFixed(2).replace('.', ',')}%</td>
                <td><span class="trend-badge ${badgeClass}">${badgeText}</span></td>
                <td><button class="btn-action" onclick="abrirModal('${fii.ticker}')">Ver Detalhes</button></td>
            `;
            tbody.appendChild(tr);
        });

        // Configuração da Janela Modal (Análise Separada)
        window.abrirModal = function(ticker) {
            const fii = globalFiiData.find(f => f.ticker === ticker);
            if (!fii) return;
            document.getElementById('modal-ticker').textContent = fii.ticker;
            document.getElementById('modal-sector').textContent = fii.setor;
            document.getElementById('modal-price').textContent = `R$ ${fii.preco.toFixed(2).replace('.', ',')}`;
            document.getElementById('modal-dividend').textContent = `R$ ${fii.dividendo.toFixed(4).replace('.', ',')} (Est. Mensal)`;
            document.getElementById('modal-dy').textContent = `${fii.dy.toFixed(2).replace('.', ',')}% (Anual)`;
            document.getElementById('modal-risks').textContent = fii.motivosQueda;
            document.getElementById('modal-future').textContent = fii.perspectiva;
            document.getElementById('modal-analysis').textContent = fii.analise;
            document.getElementById('fii-modal').style.display = 'block';
        }

        document.querySelector('.close-btn').onclick = () => document.getElementById('fii-modal').style.display = 'none';
        window.onclick = (e) => { if (e.target === document.getElementById('fii-modal')) document.getElementById('fii-modal').style.display = 'none'; }

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 40px; border: 2px solid red;">
            <h3 style="margin-bottom: 10px;">Erro de Ligação</h3>
            <p style="font-size: 1.1rem;"><strong>Detalhe técnico:</strong><br> 
            <span style="background: #fee2e2; padding: 5px 10px; border-radius: 4px;">${error.message}</span></p>
        </td></tr>`;
    }
}

carregarDashboard();
