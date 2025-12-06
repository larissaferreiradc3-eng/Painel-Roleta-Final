// --- VARIÁVEIS GLOBAIS E CONSTANTES ---
let sessaoAtual = null;
let historicoCompleto = [];

const MIN_RODADAS = 100;

// Ordem Sequencial da Roleta Europeia (RACE TRACK)
const RACE_SEQUENCE = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 
    16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Mapeamento de Cores e Propriedades da Roleta (MANTIDO)
const CORES_ROLETA = {
    0: 'zero', 32: 'vermelho', 15: 'preto', 19: 'vermelho', 4: 'preto', 21: 'vermelho',
    2: 'preto', 25: 'vermelho', 17: 'preto', 34: 'vermelho', 6: 'preto', 27: 'vermelho',
    13: 'preto', 36: 'vermelho', 11: 'preto', 30: 'vermelho', 8: 'preto', 23: 'vermelho',
    10: 'preto', 5: 'vermelho', 24: 'preto', 16: 'vermelho', 33: 'preto', 1: 'vermelho',
    20: 'preto', 14: 'vermelho', 31: 'preto', 9: 'vermelho', 22: 'preto', 18: 'vermelho',
    29: 'preto', 7: 'vermelho', 28: 'preto', 12: 'vermelho', 35: 'preto', 3: 'vermelho',
    26: 'preto'
};

// Mapeamento de Vizinhos de Race (MANTIDO - DEVE SER COMPLETO POR VOCÊ)
const VIZINHOS_RACE = {
    0: [3, 26, 32, 15], 1: [20, 33, 16], 2: [25, 21, 4], 3: [26, 35, 23], 4: [2, 21, 19],
    12: [35, 28], 13: [27, 36], 15: [0, 32, 19], 17: [34, 6], 21: [2, 4, 19, 25], 24: [16, 33, 1],
    27: [13, 36], 28: [12, 35], 32: [0, 15, 19], 35: [12, 28], 36: [13, 27]
};

// --- FUNÇÕES AUXILIARES DE PROPRIEDADE (MANTIDAS) ---

function getDuzia(numero) {
    if (numero >= 1 && numero <= 12) return 1;
    if (numero >= 13 && numero <= 24) return 2;
    if (numero >= 25 && numero <= 36) return 3;
    return 0;
}

function getColuna(numero) {
    if (numero === 0) return 0;
    if (numero % 3 === 1) return 1;
    if (numero % 3 === 2) return 2;
    return 3;
}

function getCor(numero) {
    return CORES_ROLETA[numero] || 'indefinida';
}

function getVizinhosRace(numero) {
    return VIZINHOS_RACE[numero] || [];
}

// --- FUNÇÕES DE UTILIDADE E ARMAZENAMENTO (MANTIDAS) ---

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

function salvarHistorico(sessao, historico) {
    try {
        sessionStorage.setItem(`historico_${sessao}`, JSON.stringify(historico));
    } catch (e) {
        exibirErro("Erro ao salvar no sessionStorage.");
    }
}

function carregarHistorico(sessao) {
    try {
        const stored = sessionStorage.getItem(`historico_${sessao}`);
        return JSON.parse(stored || '[]');
    } catch (e) {
        exibirErro("Erro ao carregar o histórico.");
        return [];
    }
}

// --- FUNÇÕES DE ANÁLISE ESPECÍFICAS (GATILHOS - MANTIDAS) ---
// ... (analiseSoma, analiseDCC, analiseGE) ...

function analiseSoma(historico) {
    if (historico.length < 3) return { alvo: null, razao: 'Aguardando sequência 3 números.' };
    const [n1, n2, n3] = historico.slice(-3);
    const n1_vermelho_3d = getCor(n1) === 'vermelho' && getDuzia(n1) === 3;
    const n2_preto_2d = getCor(n2) === 'preto' && getDuzia(n2) === 2;
    const n3_preto_2d = getCor(n3) === 'preto' && getDuzia(n3) === 2;
    if (n1_vermelho_3d && n2_preto_2d && n3_preto_2d) {
        const soma = n1 + n2 + n3;
        let alvo = soma;
        if (soma > 36) {
            alvo = String(soma).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
            if (alvo > 36) { alvo = String(alvo).split('').reduce((acc, digit) => acc + parseInt(digit), 0); }
        }
        const vizinhos = getVizinhosRace(alvo);
        return {
            alvo: alvo, vizinhos: vizinhos, protecoes: [21, 0],
            razao: `Gatilho 1 (Soma ${n1}+${n2}+${n3}=${soma}) -> Alvo ${alvo} + Vizinhos de Race`
        };
    }
    return { alvo: null };
}

function analiseDCC(historico) {
    if (historico.length < 2) return { alvos: null, razao: 'Aguardando 2 números para padrão DCC.' };
    const mapaPadroes = { '1D3C > 3D2C': '2D1C', '2D1C > 3D2C': '1D3C', '1D3C > 2D1C': '3D2C' };
    const ultimos2 = historico.slice(-2);
    const padraoBusca = ultimos2.map(n => `${getDuzia(n)}D${getColuna(n)}C`).join(' > ');
    if (mapaPadroes[padraoBusca]) {
        const proximo = mapaPadroes[padraoBusca];
        const [d, c] = proximo.match(/\d/g).map(Number);
        let alvos = [];
        for (let n = 1; n <= 36; n++) {
            if (getDuzia(n) === d && getColuna(n) === c) { alvos.push(n); }
        }
        return {
            alvos: alvos, protecoes: [0],
            razao: `Gatilho 2 (Sequência DCC ${padraoBusca}) -> Alvo ${proximo}`
        };
    }
    return { alvos: null };
}

function analiseGE(historico) {
    if (historico.length < MIN_RODADAS) return { alvos: null, razao: 'Aguardando histórico completo para análise Estelar.' };
    const contagem = historico.reduce((acc, num) => { acc[num] = (acc[num] || 0) + 1; return acc; }, {});
    const alvosPotenciais = Object.keys(contagem).filter(n => contagem[n] >= 3).map(Number);

    if (alvosPotenciais.length > 0) {
        if (alvosPotenciais.includes(19) && alvosPotenciais.includes(13)) {
             return { alvos: [13, 27], protecoes: [36, 0], razao: `Gatilho 3 (Trinca do 19 e 13 Ativa) -> Alvos 13/27` };
        }
        return {
             alvos: alvosPotenciais.slice(0, 3), protecoes: [0],
             razao: `Gatilho 3 (Número(s) ${alvosPotenciais.slice(0, 3).join(', ')} apareceram 3x. Cataloque a região).`
        };
    }
    return { alvos: null };
}

function gerarAnalise() {
    limparErros();
    
    if (!sessaoAtual) {
        document.getElementById('detalhesSinal').textContent = "Inicie a sessão no Passo 0.";
        return;
    }

    // A análise só é gerada se tivermos a base mínima.
    if (historicoCompleto.length < MIN_RODADAS) {
        document.getElementById('detalhesSinal').textContent = `Carregue o histórico base (mínimo ${MIN_RODADAS}) para iniciar a análise.`;
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Aguardando dados.";
        return;
    }

    const rSoma = analiseSoma(historicoCompleto);
    const rDCC = analiseDCC(historicoCompleto);
    const rGE = analiseGE(historicoCompleto);

    let alvosFinais = new Set();
    let razoes = [];
    let rodadasEspera = 0;

    // INTEGRAÇÃO E PRIORIZAÇÃO (MANTIDA)
    if (rSoma.alvo) {
        alvosFinais.add(rSoma.alvo); rSoma.vizinhos.forEach(n => alvosFinais.add(n));
        rSoma.protecoes.forEach(n => alvosFinais.add(n)); razoes.push(rSoma.razao); rodadasEspera = 4;
    }

    if (rDCC.alvos) {
        rDCC.alvos.forEach(n => alvosFinais.add(n)); rDCC.protecoes.forEach(n => alvosFinais.add(n));
        razoes.push(rDCC.razao); if (rodadasEspera === 0) rodadasEspera = 4;
    }

    if (rGE.alvos) {
        rGE.alvos.forEach(n => alvosFinais.add(n)); rGE.protecoes.forEach(n => alvosFinais.add(n));
        razoes.push(rGE.razao); if (rodadasEspera === 0) rodadasEspera = 4;
    }

    if (alvosFinais.size === 0) {
        document.getElementById('detalhesSinal').textContent = "Nenhum gatilho detectado. Aguardando a sequência exata.";
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Apostar até 0 Rodadas";
        document.getElementById('neraDetalhes').textContent = `3 Sistemas Rodando. Gatilhos Ativos: 0`;
        return;
    }

    const alvosLista = Array.from(alvosFinais).sort((a, b) => a - b).filter(n => n !== 0); 
    const isZeroProtected = alvosFinais.has(0);
    
    document.getElementById('detalhesSinal').textContent = razoes.join(' | ');
    document.getElementById('alvosSugeridos').textContent = alvosLista.join(', ') + (isZeroProtected ? ' (PROTEÇÃO 0)' : '');
    document.getElementById('rodadasEspera').textContent = `Apostar até ${rodadasEspera} Rodadas (1 Entrada + 3 Gales)`;
    document.getElementById('neraDetalhes').textContent = `3 Sistemas Rodando. Gatilhos Ativos: ${razoes.length}`;

    exibirDisplayStatus("Alerta de gatilho confirmado para entrada.", true);
}


// --- FUNÇÕES DE INTERATIVIDADE E INICIALIZAÇÃO ---

/**
 * Função processarNovoNumero corrigida:
 * Permite a adição de números da grade mesmo sem a base de 100 rodadas.
 * A análise só será disparada, mas com erro, se não houver a base.
 */
function processarNovoNumero(numero) {
    limparErros();
    
    if (!sessaoAtual) {
        exibirErro("Inicie a sessão no Passo 0.");
        return;
    }
    
    // Adiciona o número SEM BLOQUEIO, mesmo que o histórico não tenha 100.
    historicoCompleto.push(parseInt(numero, 10));
    salvarHistorico(sessaoAtual, historicoCompleto);
    
    atualizarLinhaDoTempo();
    // A função gerarAnalise() irá verificar se o MIN_RODADAS foi atingido.
    gerarAnalise(); 
}


/**
 * Função renderizarGradeRoleta corrigida:
 * Usa a sequência da Race Track da roleta Europeia.
 */
function renderizarGradeRoleta(gradeRoleta) {
    if (!gradeRoleta) return; 

    let html = '';
    
    // Agora renderiza na ordem da RACE_SEQUENCE
    RACE_SEQUENCE.forEach(i => {
        const cor = CORES_ROLETA[i];
        html += `<button class="botao-numero ${cor}" data-numero="${i}">${i}</button>`;
    });

    gradeRoleta.innerHTML = html;

    gradeRoleta.querySelectorAll('.botao-numero').forEach(button => {
        button.addEventListener('click', () => {
            const numero = button.dataset.numero;
            
            gradeRoleta.querySelectorAll('.botao-numero').forEach(btn => btn.classList.remove('selecionado'));
            button.classList.add('selecionado');
            
            processarNovoNumero(numero);
        });
    });
}


function initSimulador() {
    const gradeRoleta = document.getElementById('gradeRoleta');
    renderizarGradeRoleta(gradeRoleta);

    sessaoAtual = sessionStorage.getItem('sessaoAtualID');
    
    if (sessaoAtual) {
        historicoCompleto = carregarHistorico(sessaoAtual);
        document.getElementById('currentSessionName').textContent = sessaoAtual;
        atualizarLinhaDoTempo();
        gerarAnalise(); 
    } else {
        exibirDisplayStatus('Inicie uma sessão no Passo 0 para começar a analisar.');
    }

    document.getElementById('btnCarregarBase').addEventListener('click', carregarBase);

    document.getElementById('btnIniciarSessao').addEventListener('click', () => {
        const sessionID = document.getElementById('sessionIDInput').value.trim();
        if (sessionID) {
            sessaoAtual = sessionID;
            sessionStorage.setItem('sessaoAtualID', sessaoAtual);
            document.getElementById('currentSessionName').textContent = sessaoAtual;
            
            historicoCompleto = carregarHistorico(sessaoAtual);
            
            atualizarLinhaDoTempo();
            gerarAnalise();
            exibirDisplayStatus(`Sessão '${sessaoAtual}' iniciada/carregada!`, true);
        } else {
            exibirErro("Digite um nome ou ID para iniciar a sessão.");
        }
    });
}

document.addEventListener('DOMContentLoaded', initSimulador);
