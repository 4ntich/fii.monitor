// Configurações e Chave de API
const API_KEY = 'x2mtCMeDdVjmmb3qHvBLSf';

// Lista dos FIIs mais negociados para montar o Ranking
const FII_LIST = 'MXRF11,HGLG11,KNIP11,BTLG11,HCTR11,VISC11,XPLG11,IRDM11';

// URL da API financeira (exemplo usando estrutura Brapi)
const API_URL = `https://brapi.dev/api/quote/${FII_LIST}?token=${API_KEY}`;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchFiiData();
    fetchWebNews();
    setupModalClose();
});

// 1. Busca os dados reais dos FIIs usando sua Chave de API
async function fetchFiiData() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        renderRanking(data.results);

    } catch (error) {
        console.error("Erro ao buscar FIIs:", error);
        document.getElementById('rankingBody').innerHTML = `
            <tr><td colspan="5" class="negativo">Erro ao carregar dados. Verifique a API Key ou o limite de requisições.</td></tr>
        `;
    }
}

// 2. Faz a "Consulta na Web" buscando notícias recentes sobre FIIs
// Como o JS puro não faz web scraping por causa do CORS, usamos uma API pública de RSS para JSON
async function fetchWebNews() {
    // RSS do InfoMoney focado em Fundos Imobiliários
    const rssUrl = 'https://www.infomoney.com.br/onde-investir/fundos-imobiliarios/feed/';
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if(data.status === 'ok') {
            renderDropsFeed(data.items.slice(0, 5)); // Pega as 5 notícias mais recentes
        }
    } catch (error) {
        console.error("Erro ao buscar notícias da web:", error);
        document.getElementById('analysisFeed').innerHTML = '<p>Erro ao carregar o radar do mercado.</p>';
    }
}

// Renderiza a Tabela de FIIs
function renderRanking(fiis) {
    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    // Ordena do melhor para o pior rendimento diário (Ranking)
    fiis.sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);

    fiis.forEach(fii => {
        const row = document.createElement('tr');
        
        // Formata a variação
        const variacao = fii.regularMarketChangePercent || 0;
        const variacaoClass = variacao >= 0 ? 'positivo' : 'negativo';
        const variacaoFormatada = variacao > 0 ? `+${variacao.toFixed(2)}%` : `${variacao.toFixed(2)}%`;

        row.innerHTML = `
            <td><strong>${fii.symbol}</strong></td>
            <td>${fii.shortName || 'Fundo Imobiliário'}</td>
            <td>R$ ${fii.regularMarketPrice.toFixed(2).replace('.', ',')}</td>
            <td class="${variacaoClass}">${variacaoFormatada}</td>
            <td>
                <button class="btn-details" 
                    onclick="openDetails('${fii.symbol}', '${fii.longName}', ${fii.regularMarketPrice})">
                    Detalhes
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Renderiza o feed de Notícias/Quedas
function renderDropsFeed(newsItems) {
    const feedContainer = document.getElementById('analysisFeed');
    feedContainer.innerHTML = '';

    newsItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'feed-card';
        // Remove tags HTML indesejadas do resumo
        let resumo = item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
        
        card.innerHTML = `
            <h3>${item.title}</h3>
            <p style="margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">${resumo}</p>
            <a href="${item.link}" target="_blank">Ler análise completa na web &rarr;</a>
        `;
        feedContainer.appendChild(card);
    });
}

// Lógica do Modal
function openDetails(ticker, nome, preco) {
    document.getElementById('modalTicker').innerText = `Análise do Fundo: ${ticker}`;
    document.getElementById('modalContent').innerHTML = `
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Cotação Atual:</strong> R$ ${preco.toFixed(2).replace('.', ',')}</p>
        <br>
        <p><em>Para calcular o Dividend Yield atualizado, P/VP e perspectivas futuras detalhadas, o sistema requer a versão Premium da API.</em></p>
    `;
    
    document.getElementById('fiiModal').style.display = 'block';
}

function setupModalClose() {
    const modal = document.getElementById('fiiModal');
    const closeBtn = document.querySelector('.close-btn');

    closeBtn.onclick = () => { modal.style.display = "none"; }
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
