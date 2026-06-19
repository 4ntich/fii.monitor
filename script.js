const API_TOKEN = '2v6TVtVXCe8Fhoeaj76uBM';
const listaFIIs = ['MXRF11', 'HGLG11', 'KNRI11', 'XPLG11', 'ALZR11', 'VISC11', 'BTLG11'];

// Banco de dados qualitativo complementar para enriquecer o SaaS conforme as exigências de negócio
const fiiQualitativeData = {
    'MXRF11': {
        setor: 'Papel (Recebíveis)',
        motivosQueda: 'Oscilações marginais ligadas à deflação pontual de índices de preços (IPCA/IGPM) que corrigem parte de seus CRIs de carteira secundária.',
        perspectiva: 'Altamente estável. A manutenção da taxa de juros básica em patamares elevados sustenta o carrego robusto dos ativos indexados ao CDI.',
        analise: 'O Maxi Renda é o maior FII da B3 em número de cotistas. Sua estratégia foca em CRIs de boa qualidade e permutas financeiras estruturadas. Possui excelente liquidez de tela e histórico de distribuição regular, configurando uma âncora clássica de rendimentos para perfis focados em fluxo de caixa linear.'
    },
    'HGLG11': {
        setor: 'Logística / Tijolo',
        motivosQueda: 'Leves correções técnicas no mercado secundário decorrentes de ajustes após períodos de grandes emissões de cotas (follow-ons) ou transações complexas de ativos.',
        perspectiva: 'Excelente. Ativos premium posicionados nos principais eixos logísticos nacionais (raio 30km de São Paulo) garantem poder de barganha em renovações contratuais.',
        analise: 'Gerido pela Credit Suisse Hedging-Griffo, o HGLG11 é a principal referência em galpões industriais e logísticos. Seus imóveis de altíssimo padrão (Triple-A) atraem e retêm inquilinos corporativos robustos, blindando o portfólio contra oscilações de vacância estrutural.'
    },
    'KNRI11': {
        setor: 'Híbrido (Lajes/Logística)',
        motivosQueda: 'Impactos marginais provocados por vacância física pontual e de curto prazo em algumas lajes corporativas específicas localizadas nas praças do Rio de Janeiro e São Paulo.',
        perspectiva: 'Moderada a Positiva. O fundo beneficia-se da constante reciclagem de seu portfólio maduro e da tendência de reprecificação real de aluguéis em regiões centrais corporativas.',
        analise: 'Fundo tradicional gerido pela Kinea, reconhecido pelo mercado por sua postura altamente conservadora. Composto por um mix de propriedades de escritórios e galpões comerciais estáveis, destaca-se pela previsibilidade, baixa volatilidade na distribuição e inquilinos de grande porte.'
    },
    'XPLG11': {
        setor: 'Logística / Tijolo',
        motivosQueda: 'Devoluções programadas e rescisões contratuais antecipadas de inquilinos em módulos pontuais, induzindo leves variações temporárias na distribuição mensal.',
        perspectiva: 'Positiva. A equipe de gestão demonstra agilidade comercial recorrente na reocupação dos módulos vagos e renegociação de prazos.',
        analise: 'O XP Log consolida uma presença geográfica relevante distribuída por múltiplos estados. Apresenta galpões modernos perfeitamente integrados com as exigências tecnológicas das principais operações de e-commerce e varejo moderno do Brasil.'
    },
    'ALZR11': {
        setor: 'Híbrido (Contratos Atípicos)',
        motivosQueda: 'Mínimas flutuações. Por focar em contratos atípicos de longo prazo, o fundo possui volatilidade de cota historicamente baixa, frequentemente negociando com prêmio.',
        perspectiva: 'Altamente Previsível. Modelo focado exclusivamente em contratos Built-to-Suit e Sale-and-Leaseback oferece imunidade parcial a flutuações macroeconômicas de curto prazo.',
        analise: 'O Alianza Trust Renda Imobiliária diferencia-se pela originação de contratos imobiliários atípicos atrelados a grandes corporações. A estrutura jurídica desses contratos blinda as receitas do fundo contra rescisões ordinárias, garantindo estabilidade e reajustes IPCA previsíveis.'
    },
    'VISC11': {
        setor: 'Shopping Centers',
        motivosQueda: 'Ajustes sazonais naturais após períodos de pico de vendas (ex: festas de fim de ano) e variações no desempenho de vendas reportado pelas redes varejistas do portfólio.',
        perspectiva: 'Otimista. O segmento de shopping centers exibe forte recuperação em vendas por metro quadrado e capacidade consolidada de reprecificar contratos de locação acima dos índices de inflação.',
        analise: 'O Vinci Shopping Centers detém um portfólio altamente pulverizado e diversificado, com participação direta em dezenas de shoppings sob diferentes bandeiras e administradoras. Essa pulverização minimiza o risco operacional e transforma o ativo em um gerador resiliente de fluxo de caixa.'
    },
    'BTLG11': {
        setor: 'Logística / Tijolo',
        motivosQueda: 'Flutuações de custos de transação e alocação de caixa gerados por aquisições robustas de grandes portfólios imobiliários recentes.',
        perspectiva: 'Altamente Promissora. Os novos ativos imobiliários adquiridos carregam cap rates atrativos e estão localizados em regiões estratégicas de extrema proximidade aos centros de consumo final.',
        analise: 'O BTG Pactual Logística executa uma tese de crescimento eficiente, posicionando-se como um dos maiores players imobiliários do país. A sinergia e governança do grupo proporcionam vantagens competitivas na captação e desenvolvimento de ativos logísticos críticos de alto valor.'
    }
};

let globalFiiData = [];

document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR');

async function carregarDashboard() {
    const tbody = document.getElementById('fii-body');
    
    try {
        const tickersQuery = listaFIIs.join('%2C');
        const response = await fetch(`https://brapi.dev/api/quote/${tickersQuery}?token=${API_TOKEN}&modules=dividend`);
        
        if (!response.ok) throw new Error('Falha de comunicação com a API de cotações');
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('Nenhum dado válido retornado da B3');
        }

        // Unificar métricas de mercado ao vivo com nossa inteligência qualitativa
        globalFiiData = data.results.map(fii => {
            const ticker = fii.symbol;
            const dadosLocais = fiiQualitativeData[ticker] || {
                setor: 'Fundo Imobiliário',
                motivosQueda: 'Ajustes normais do mercado financeiro secundário.',
                perspectiva: 'Perspectiva estável com base na variação diária de cotações.',
                analise: 'Análise fundamentalista em fase de atualização técnica.'
            };

            const listaProventos = fii.dividendsData?.cashDividends || [];
            const ultimoProvento = listaProventos.length > 0 ? listaProventos[0].rate : 0;
            const precoAtual = fii.regularMarketPrice || 0;
            
            // Cálculo do Dividend Yield Anualizado Estimado (Último provento distribuído * 12 meses / Preço Atual)
            const dyEstimado = precoAtual > 0 ? ((ultimoProvento * 12) / precoAtual) * 100 : 0;

            // Determinar o status visual da tendência do ativo
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

        // REQUISITO CHAVE: Ordenação dinâmica (Ranking do maior Dividend Yield para o menor)
        globalFiiData.sort((a, b) => b.dy - a.dy);

        renderizarTabela();

    } catch (error) {
        console.error('Erro de Processamento:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); font-weight: 600; padding: 40px;">
            Erro crítico ao carregar dados do ecossistema B3.<br>
            <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-muted);">Causa provável: Chave de API inválida, limite atingido ou indisponibilidade da rede.</span>
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

        tr.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td><span style="font-weight: 700; color: var(--secondary-color);">${fii.ticker}</span></td>
            <td>${fii.setor}</td>
            <td>R$ ${fii.preco.toFixed(2).replace('.', ',')}</td>
            <td>R$ ${fii.dividendo.toFixed(4).replace('.', ',')}</td>
            <td style="font-weight: 700; color: #1e40af; font-size: 1.05rem;">${fii.dy.toFixed(2).replace('.', ',')}%</td>
            <td><span class="trend-badge ${badgeClass}">${badgeText}</span></td>
            <td><button class="btn-action" onclick="abrirModal('${fii.ticker}')">Ver Análise</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Mecanismo de controle do Modal de detalhamento fundamentalista
const modal = document.getElementById('fii-modal');
const closeBtn = document.querySelector('.close-btn');

window.abrirModal = function(ticker) {
    const fii = globalFiiData.find(f => f.ticker === ticker);
    if (!fii) return;

    document.getElementById('modal-ticker').textContent = fii.ticker;
    document.getElementById('modal-sector').textContent = fii.setor;
    document.getElementById('modal-price').textContent = `R$ ${fii.preco.toFixed(2).replace('.', ',')}`;
    document.getElementById('modal-dividend').textContent = `R$ ${fii.dividendo.toFixed(4).replace('.', ',')}`;
    document.getElementById('modal-dy').textContent = `${fii.dy.toFixed(2).replace('.', ',')}%`;
    document.getElementById('modal-risks').textContent = fii.motivosQueda;
    document.getElementById('modal-future').textContent = fii.perspectiva;
    document.getElementById('modal-analysis').textContent = fii.analise;

    modal.style.display = 'block';
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; }

carregarDashboard();
