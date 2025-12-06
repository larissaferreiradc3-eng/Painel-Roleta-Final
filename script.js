// --- VARIÁVEIS GLOBAIS E CONSTANTES ---
let sessaoAtual = null;
let historicoCompleto = [];

const CORES_ROLETA = {
    0: 'zero', 32: 'vermelho', 15: 'preto', 19: 'vermelho', 4: 'preto', 21: 'vermelho',
    2: 'preto', 25: 'vermelho', 17: 'preto', 34: 'vermelho', 6: 'preto', 27: 'vermelho',
    13: 'preto', 36: 'vermelho', 11: 'preto', 30: 'vermelho', 8: 'preto', 23: 'vermelho',
    10: 'preto', 5: 'vermelho', 24: 'preto', 16: 'vermelho', 33: 'preto', 1: 'vermelho',
    20: 'preto', 14: 'vermelho', 31: 'preto', 9: 'vermelho', 22: 'preto', 18: 'vermelho',
    29: 'preto', 7: 'vermelho', 28: 'preto', 12: 'vermelho', 35: 'preto', 3: 'vermelho',
    26: 'preto'
};

const MIN_RODADAS = 100;

// --- FUNÇÕES DE UTILIDADE E ARMAZENAMENTO (SESSIONSTORAGE) ---

function exibirDisplayStatus(mensagem, sucesso = false) {
    const statusSpan = document.getElementById('statusDisplay');
    if (statusSpan) {
        statusSpan.textContent = `Status: ${mensagem}`;
        statusSpan.style.color = sucesso ? 'lightgreen' : '#ffc107';
        statusSpan.style.display = 'block';
    }
}

function exibirErro(mensagem) {
    const erroDiv = document.getElementById('exibirErro');
    if (erroDiv) {
        erroDiv.textContent = mensagem;
        erroDiv.style.display = 'block';
        console.error(`ERRO: ${mensagem}`);
    }
}

function limparErros() {
    const erroDiv = document.getElementById('exibirErro');
    const statusSpan = document.getElementById('statusDisplay');
    if (erroDiv) erroDiv.style.display = 'none';
    if (statusSpan) statusSpan.style.display = 'none';
}

/** Salva o histórico usando SESSIONSTORAGE para isolar as abas/usuários. */
function salvarHistorico(sessao, historico) {
    try {
        sessionStorage.setItem(`historico_${sessao}`, JSON.stringify(historico));
    } catch (e) {
        exibirErro("Erro ao salvar no sessionStorage. O histórico pode estar muito grande ou o navegador está restrito.");
    }
}

/** Carrega o histórico da sessão atual. */
function carregarHistorico(sessao) {
    try {
        const stored = sessionStorage.getItem(`historico_${sessao}`);
        return JSON.parse(stored || '[]');
    } catch (e) {
        exibirErro("Erro ao carregar o histórico.");
        return [];
    }
}

// --- LÓGICA DE PROCESSAMENTO DE DADOS E ANÁLISE ---

function atualizarLinhaDoTempo() {
    const timelineDiv = document.getElementById('historicoTimeline');
    const statusP = document.getElementById('historicoRecenteStatus');
    const totalRodadasSpan = document.getElementById('totalRodadas');

    if (!timelineDiv || !statusP || !totalRodadasSpan) return;

    totalRodadasSpan.textContent = historicoCompleto.length;

    if (historicoCompleto.length === 0) {
        statusP.textContent = "Nenhum número no histórico.";
        timelineDiv.querySelector('h3').textContent = "Linha do Tempo Recente";
        return;
    }
    
    // Pega os últimos 30 números (o que o usuário pediu)
    const ultimos30 = historicoCompleto.slice(-30);
    
    // Cria o HTML para os botões da linha do tempo
    let html = ultimos30.map(numero => {
        const cor = CORES_ROLETA[numero] || 'preto';
        // Usa a classe CSS correta para o 0
        const classeCor = numero === 0 ? 'zero' : cor; 
        return `<span class="botao-numero ${classeCor}" data-numero="${numero}">${numero}</span>`;
    }).join(' ');

    statusP.innerHTML = html;
    timelineDiv.querySelector('h3').textContent = `Linha do Tempo Recente (${ultimos30.length} Últimos Números)`;
}

function gerarAnalise() {
    // Apenas gera a análise se a sessão estiver iniciada e tiver dados suficientes
    if (!sessaoAtual) {
        document.getElementById('detalhesSinal').textContent = "Inicie a sessão no Passo 0.";
        return;
    }

    if (historicoCompleto.length < MIN_RODADAS) {
        document.getElementById('detalhesSinal').textContent = "Histórico insuficiente (mínimo 100).";
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Aguardando mais dados.";
        return;
    }

    // LÓGICA DE EXEMPLO SIMPLES (A ser substituída pela sua lógica NERA/SGR):
    document.getElementById('detalhesSinal').textContent = "Análise Pronta para: " + sessaoAtual;
    document.getElementById('alvosSugeridos').textContent = "1, 19, 32";
    document.getElementById('rodadasEspera').textContent = "Apostar até 3 Rodadas";
    
    exibirDisplayStatus("Análise Gerada com sucesso!", true);
}


// --- FUNÇÕES DE INTERATIVIDADE E EVENTOS ---

function carregarBase() {
    limparErros();
    const input = document.getElementById('historicoBaseInput').value;
    
    if (!sessaoAtual) {
        exibirErro("Inicie a sessão no Passo 0 antes de carregar o histórico.");
        return;
    }

    // Processa a string: transforma em Array de números
    let novosNumeros = input
        .replace(/[^0-9, \n]/g, '')
        .split(/[\s,]+/)
        .filter(n => n !== '')
        .map(n => parseInt(n, 10))
        .filter(n => n >= 0 && n <= 36);

    if (novosNumeros.length < MIN_RODADAS) {
        exibirErro(`O histórico deve ter no mínimo ${MIN_RODADAS} números. Você tem ${novosNumeros.length}.`);
        return;
    }

    historicoCompleto = novosNumeros;
    salvarHistorico(sessaoAtual, historicoCompleto);
    
    atualizarLinhaDoTempo();
    gerarAnalise();
    exibirDisplayStatus("Base carregada e salva com sucesso!", true);
}

function processarNovoNumero(numero) {
    limparErros();
    
    if (!sessaoAtual) {
        exibirErro("Inicie a sessão no Passo 0.");
        return;
    }

    // 1. Adiciona o novo número ao histórico
    historicoCompleto.push(parseInt(numero, 10));

    // 2. Salva o histórico atualizado
    salvarHistorico(sessaoAtual, historicoCompleto);
    
    // 3. Atualiza a linha do tempo e o total de rodadas
    atualizarLinhaDoTempo();

    // 4. Gera a nova análise
    gerarAnalise();
}


// --- FUNÇÕES DE RENDERIZAÇÃO DE COMPONENTES ---

function renderizarGradeRoleta(gradeRoleta) {
    if (!gradeRoleta) return; 

    let html = '';
    
    // Botões 0 a 36 (Visíveis)
    for (let i = 0; i <= 36; i++) {
        const cor = CORES_ROLETA[i];
        html += `<button class="botao-numero ${cor}" data-numero="${i}">${i}</button>`;
    }

    gradeRoleta.innerHTML = html;

    // Adiciona listener para cliques na grade (CHAMA A FUNÇÃO DE PROCESSAMENTO)
    gradeRoleta.querySelectorAll('.botao-numero').forEach(button => {
        button.addEventListener('click', () => {
            const numero = button.dataset.numero;
            
            // 1. Destaca o botão clicado
            gradeRoleta.querySelectorAll('.botao-numero').forEach(btn => btn.classList.remove('selecionado'));
            button.classList.add('selecionado');
            
            // 2. PROCESSA O NOVO NÚMERO
            processarNovoNumero(numero);
        });
    });
}

// --- INICIALIZAÇÃO E CARREGAMENTO ---

function initSimulador() {
    // 1. Inicializa a Grade de Roleta
    const gradeRoleta = document.getElementById('gradeRoleta');
    renderizarGradeRoleta(gradeRoleta);

    // 2. Tenta carregar a última sessão (se a aba foi recarregada)
    sessaoAtual = sessionStorage.getItem('sessaoAtualID');
    
    if (sessaoAtual) {
        historicoCompleto = carregarHistorico(sessaoAtual);
        document.getElementById('currentSessionName').textContent = sessaoAtual;
        atualizarLinhaDoTempo();
        gerarAnalise(); 
        exibirDisplayStatus(`Sessão '${sessaoAtual}' carregada!`, true);
    } else {
        exibirDisplayStatus('Inicie uma sessão no Passo 0 para começar a analisar.');
    }

    // 3. Configura Eventos
    document.getElementById('btnCarregarBase').addEventListener('click', carregarBase);

    document.getElementById('btnIniciarSessao').addEventListener('click', () => {
        const sessionID = document.getElementById('sessionIDInput').value.trim();
        if (sessionID) {
            sessaoAtual = sessionID;
            sessionStorage.setItem('sessaoAtualID', sessaoAtual);
            document.getElementById('currentSessionName').textContent = sessaoAtual;
            
            // Carrega o histórico da nova sessão (se existir, ou inicia vazio)
            historicoCompleto = carregarHistorico(sessaoAtual);
            
            atualizarLinhaDoTempo();
            gerarAnalise();
            exibirDisplayStatus(`Sessão '${sessaoAtual}' iniciada/carregada!`, true);
        } else {
            exibirErro("Digite um nome ou ID para iniciar a sessão.");
        }
    });
}

// Garante que a inicialização só ocorre após o carregamento completo do HTML
document.addEventListener('DOMContentLoaded', initSimulador);
