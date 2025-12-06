// --- VARIÁVEIS GLOBAIS E CONSTANTES ---
let sessaoAtual = null;
let historicoCompleto = [];

const MIN_RODADAS = 100;

// Ordem Sequencial da Roleta Europeia (RACE TRACK)
const RACE_SEQUENCE = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 
    16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Mapeamento de Cores e Propriedades da Roleta
const CORES_ROLETA = {
    0: 'zero', 32: 'vermelho', 15: 'preto', 19: 'vermelho', 4: 'preto', 21: 'vermelho',
    2: 'preto', 25: 'vermelho', 17: 'preto', 34: 'vermelho', 6: 'preto', 27: 'vermelho',
    13: 'preto', 36: 'vermelho', 11: 'preto', 30: 'vermelho', 8: 'preto', 23: 'vermelho',
    10: 'preto', 5: 'vermelho', 24: 'preto', 16: 'vermelho', 33: 'preto', 1: 'vermelho',
    20: 'preto', 14: 'vermelho', 31: 'preto', 9: 'vermelho', 22: 'preto', 18: 'vermelho',
    29: 'preto', 7: 'vermelho', 28: 'preto', 12: 'vermelho', 35: 'preto', 3: 'vermelho',
    26: 'preto'
};

// Mapeamento de Vizinhos de Race (DEVE SER COMPLETO POR VOCÊ)
const VIZINHOS_RACE = {
    0: [3, 26, 32, 15], 1: [20, 33, 16], 2: [25, 21, 4], 3: [26, 35, 23], 4: [2, 21, 19],
    12: [35, 28], 13: [27, 36], 15: [0, 32, 19], 17: [34, 6], 21: [2, 4, 19, 25], 24: [16, 33, 1],
    27: [13, 36], 28: [12, 35], 32: [0, 15, 19], 35: [12, 28], 36: [13, 27]
};

// --- FUNÇÕES AUXILIARES DE PROPRIEDADE ---

function getDuzia(numero) {
    if (numero >= 1 && numero <= 12) return 1;
    if (numero >= 13 && numero <= 24) return 2;
    if (numero >= 25 && numero <= 36) return 3;
    return 0; 
}

function getCor(numero) {
    return CORES_ROLETA[numero] || 'indefinida';
}

function getVizinhosRace(numero) {
    return VIZINHOS_RACE[numero] || [];
}

// Função Auxiliar para o Cálculo da Soma (Mantida)
function calcularAlvoSoma(n1, n2, n3) {
    const soma = n1 + n2 + n3;
    let alvo = soma;
    if (soma > 36) {
        alvo = String(soma).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
        if (alvo > 36) {
             alvo = String(alvo).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
        }
    }
    return alvo === 0 ? 12 : alvo; 
}

// --- FUNÇÕES DE UTILIDADE E ARMAZENAMENTO (Mantidas) ---
// ... (exibirDisplayStatus, exibirErro, limparErros, salvarHistorico, carregarHistorico) ...

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


// --------------------------------------------------------------------------
// --- FUNÇÕES DE ANÁLISE ESPECÍFICAS (COM LÓGICA DE PROXIMIDADE) ---
// --------------------------------------------------------------------------

/**
 * Gatilho 1 - A Soma dos 3 Números (Larissa)
 * Sequência exata: Vermelho 3D -> Preto 2D -> Preto 2D (ALTA)
 * Sequências proximais: (BAIXA)
 */
function analiseSoma(historico) {
    if (historico.length < 3) return { alvo: null, confianca: 'NENHUM' };
    
    const [n1, n2, n3] = historico.slice(-3);
    
    // --- Definições de Propriedades ---
    // Gatilho ALTA
    const n1_vermelho_3d = getCor(n1) === 'vermelho' && getDuzia(n1) === 3;
    const n2_preto_2d = getCor(n2) === 'preto' && getDuzia(n2) === 2;
    const n3_preto_2d = getCor(n3) === 'preto' && getDuzia(n3) === 2;
    
    // Near Miss (Para Confiança BAIXA)
    const n1_vermelho_near = getCor(n1) === 'vermelho' && (getDuzia(n1) === 1 || getDuzia(n1) === 2); // Vermelho, mas D1 ou D2
    const n3_preto_near = getCor(n3) === 'preto' && (getDuzia(n3) === 1 || getDuzia(n3) === 3); // Preto, mas D1 ou D3

    let alvo = null;
    let vizinhos = [];

    // --- 1. ALTA CONFIANÇA (Gatilho Exato) ---
    if (n1_vermelho_3d && n2_preto_2d && n3_preto_2d) {
        alvo = calcularAlvoSoma(n1, n2, n3);
        vizinhos = getVizinhosRace(alvo);
        return {
            alvo: [alvo, ...vizinhos],
            protecoes: [21, 0],
            confianca: 'ALTA',
            razao: `Gatilho 1 EXATO (R3D>P2D>P2D) -> Alvo ${alvo}`
        };
    }
    
    // --- 2. BAIXA CONFIANÇA (Cenário B: N3 Miss - P2D erra para D1 ou D3) ---
    if (n1_vermelho_3d && n2_preto_2d && n3_preto_near) {
        alvo = calcularAlvoSoma(n1, n2, n3);
        vizinhos = getVizinhosRace(alvo);
        return {
            alvo: [alvo, ...vizinhos],
            protecoes: [0],
            confianca: 'BAIXA',
            razao: `Gatilho 1 Atenção (N3 Miss: R3D>P2D>P_Near)`
        };
    }
    
    // --- 3. BAIXA CONFIANÇA (Cenário C: N1 Miss - R3D erra para D1 ou D2) ---
    if (n1_vermelho_near && n2_preto_2d && n3_preto_2d) {
        alvo = calcularAlvoSoma(n1, n2, n3);
        vizinhos = getVizinhosRace(alvo);
        return {
            alvo: [alvo, ...vizinhos],
            protecoes: [0],
            confianca: 'BAIXA',
            razao: `Gatilho 1 Atenção (N1 Miss: R_Near>P2D>P2D)`
        };
    }

    return { alvo: null, confianca: 'NENHUM' };
}

/**
 * Gatilho 2 - Padrão de Dúzia + Coluna (Gabriel)
 * Retorna MÉDIA em caso de acerto exato (já que é um padrão catalogado).
 */
function analiseDCC(historico) {
    if (historico.length < 2) return { alvos: null, confianca: 'NENHUM' };
    
    const getColuna = (n) => { if (n === 0) return 0; if (n % 3 === 1) return 1; if (n % 3 === 2) return 2; return 3; };

    const mapaPadroes = { 
        '1D3C > 3D2C': '2D1C', '2D1C > 3D2C': '1D3C', '1D3C > 2D1C': '3D2C' 
    };
    
    const ultimos2 = historico.slice(-2);
    const padraoBusca = ultimos2.map(n => `${getDuzia(n)}D${getColuna(n)}C`).join(' > ');
    
    if (mapaPadroes[padraoBusca]) {
        const proximo = mapaPadroes[padraoBusca];
        const [d, c] = proximo.match(/\d/g).map(Number); 
        
        let alvos = [];
        for (let n = 1; n <= 36; n++) {
            if (getDuzia(n) === d && getColuna(n) === c) {
                alvos.push(n);
            }
        }
        
        return {
            alvos: alvos, 
            protecoes: [0], 
            confianca: 'MÉDIA',
            razao: `Gatilho 2 (Sequência DCC ${padraoBusca})`
        };
    }

    return { alvos: null, confianca: 'NENHUM' };
}

/**
 * Gatilho 3 - Padrão Gêmeo + Espelho (Ryan)
 * Retorna MÉDIA em caso de acerto exato (catalogação manual).
 */
function analiseGE(historico) {
    if (historico.length < MIN_RODADAS) return { alvos: null, confianca: 'NENHUM' };
    
    const contagem = historico.reduce((acc, num) => {
        acc[num] = (acc[num] || 0) + 1;
        return acc;
    }, {});
    
    const alvosPotenciais = Object.keys(contagem).filter(n => contagem[n] >= 3).map(Number);

    if (alvosPotenciais.length > 0) {
        // Exemplo da regra: Se 19 e 13 saíram 3x (trinca) e são vizinhos no prato, ativam 13/27
        if (alvosPotenciais.includes(19) && alvosPotenciais.includes(13)) {
             return {
                alvos: [13, 27], 
                protecoes: [36, 0], 
                confianca: 'MÉDIA',
                razao: `Gatilho 3 (Trinca do 19 e 13 Ativa)`
            };
        }
        
        // Se a trinca existe mas não a confluência de vizinhos catalogada.
        if (alvosPotenciais.length >= 1) {
            return {
                alvos: alvosPotenciais.slice(0, 3), 
                protecoes: [0],
                confianca: 'BAIXA', // Nível BAIXO se só tiver a trinca, mas não a região catalogada
                razao: `Gatilho 3 Atenção (Trinca(s) ${alvosPotenciais.slice(0, 3).join(', ')} Ativas)`
            };
        }
    }
    
    return { alvos: null, confianca: 'NENHUM' };
}


// --------------------------------------------------------------------------
// --- FUNÇÃO CENTRAL DE ANÁLISE ---
// --------------------------------------------------------------------------

function gerarAnalise() {
    limparErros();
    
    if (!sessaoAtual) {
        document.getElementById('detalhesSinal').textContent = "Inicie a sessão no Passo 0.";
        return;
    }

    if (historicoCompleto.length < MIN_RODADAS) {
        document.getElementById('detalhesSinal').textContent = `Carregue o histórico base (mínimo ${MIN_RODADAS}) para iniciar a análise.`;
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Aguardando dados.";
        document.getElementById('neraDetalhes').textContent = `Nível de Confiança: N/A | Sistemas Ativos: 0`;
        return;
    }

    // 1. RODAR AS 3 ANÁLISES
    const rSoma = analiseSoma(historicoCompleto);
    const rDCC = analiseDCC(historicoCompleto);
    const rGE = analiseGE(historicoCompleto);

    // Estruturas de consolidação
    let alvosExibidos = new Set();
    let razoesExibidas = [];
    let rodadasEspera = 0;
    let activeSystems = 0;
    let nivelConfianca = 'NENHUM';

    // 2. CONSOLIDAÇÃO COM PRIORIDADE (ALTA > MÉDIA > BAIXA)

    // A. Acumular Alvos ALTA/MÉDIA/BAIXA
    const resultados = [rSoma, rDCC, rGE].filter(r => r.alvo !== null);
    activeSystems = resultados.length;

    // Prioridade ALTA
    const resultadosAlta = resultados.filter(r => r.confianca === 'ALTA');
    if (resultadosAlta.length > 0) {
        nivelConfianca = 'ALTA';
        resultadosAlta.forEach(r => {
            r.alvo.forEach(n => alvosExibidos.add(n));
            r.protecoes.forEach(n => alvosExibidos.add(n));
            razoesExibidas.push(r.razao);
        });
        rodadasEspera = 4;
    }

    // Prioridade MÉDIA (Só considera se não houver ALTA)
    if (nivelConfianca !== 'ALTA') {
        const resultadosMedia = resultados.filter(r => r.confianca === 'MÉDIA');
        if (resultadosMedia.length > 0) {
            nivelConfianca = 'MÉDIA';
            resultadosMedia.forEach(r => {
                r.alvo.forEach(n => alvosExibidos.add(n));
                r.protecoes.forEach(n => alvosExibidos.add(n));
                razoesExibidas.push(r.razao);
            });
            rodadasEspera = 4;
        }
    }
    
    // Prioridade BAIXA (Só considera se não houver ALTA ou MÉDIA)
    if (nivelConfianca !== 'ALTA' && nivelConfianca !== 'MÉDIA') {
        const resultadosBaixa = resultados.filter(r => r.confianca === 'BAIXA');
        if (resultadosBaixa.length > 0) {
            nivelConfianca = 'BAIXA';
            resultadosBaixa.forEach(r => {
                r.alvo.forEach(n => alvosExibidos.add(n));
                r.protecoes.forEach(n => alvosExibidos.add(n));
                razoesExibidas.push(r.razao);
            });
            // Mantemos rodadasEspera = 4, mas o risco é maior
            rodadasEspera = 4;
        }
    }

    // Se houver confluência entre níveis (ex: Alta + Média), ajusta a razão
    if (nivelConfianca === 'ALTA' || nivelConfianca === 'MÉDIA') {
        const razoesAdicionais = resultados.filter(r => r.confianca !== nivelConfianca).map(r => r.razao);
        razoesExibidas = razoesExibidas.concat(razoesAdicionais);
    }

    // 3. CONSOLIDAÇÃO FINAL E EXIBIÇÃO
    
    if (alvosExibidos.size === 0) {
        document.getElementById('detalhesSinal').textContent = "Nenhum gatilho detectado. Aguardando a sequência exata.";
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Apostar até 0 Rodadas";
        document.getElementById('neraDetalhes').textContent = `Nível de Confiança: ${nivelConfianca} | Sistemas Ativos: ${activeSystems}`;
        return;
    }

    const alvosLista = Array.from(alvosExibidos).sort((a, b) => a - b).filter(n => n !== 0); 
    const isZeroProtected = alvosExibidos.has(0);
    
    document.getElementById('detalhesSinal').textContent = razoesExibidas.join(' | ');
    document.getElementById('alvosSugeridos').textContent = alvosLista.join(', ') + (isZeroProtected ? ' (PROTEÇÃO 0)' : '');
    document.getElementById('rodadasEspera').textContent = `Apostar até ${rodadasEspera} Rodadas (1 Entrada + 3 Gales)`;
    document.getElementById('neraDetalhes').textContent = `Nível de Confiança: ${nivelConfianca} | Sistemas Ativos: ${activeSystems}`;

    exibirDisplayStatus(`Alerta de gatilho ${nivelConfianca} confirmado para entrada.`, true);
}


// --- FUNÇÕES DE INTERATIVIDADE E INICIALIZAÇÃO (Mantidas) ---

function atualizarLinhaDoTempo() {
    const statusP = document.getElementById('historicoRecenteStatus');
    const totalRodadasSpan = document.getElementById('totalRodadas');

    if (!statusP || !totalRodadasSpan) return;

    totalRodadasSpan.textContent = historicoCompleto.length;

    if (historicoCompleto.length === 0) {
        statusP.innerHTML = `<p style="color:#f39c12; margin:0;">Nenhum número no histórico.</p>`;
        return;
    }
    
    const ultimos30 = historicoCompleto.slice(-30);
    
    let html = ultimos30.map(numero => {
        const num = parseInt(numero, 10); 
        const cor = CORES_ROLETA[num] || 'preto';
        const classeCor = num === 0 ? 'zero' : cor; 
        
        return `<span class="botao-numero ${classeCor}" data-numero="${num}">${num}</span>`;
    }).join(' ');

    statusP.innerHTML = html;
}

function carregarBase() {
    limparErros();
    const input = document.getElementById('historicoBaseInput').value;
    
    if (!sessaoAtual) {
        exibirErro("Inicie a sessão no Passo 0 antes de carregar o histórico.");
        return;
    }

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
    
    historicoCompleto.push(parseInt(numero, 10));
    salvarHistorico(sessaoAtual, historicoCompleto);
    
    atualizarLinhaDoTempo();
    gerarAnalise(); 
}


function renderizarGradeRoleta(gradeRoleta) {
    if (!gradeRoleta) return; 

    let html = '';
    
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
