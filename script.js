// --- VARIÁVEIS GLOBAIS E CONSTANTES ---
let sessaoAtual = null;
let historicoCompleto = [];

const MIN_RODADAS = 100;

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

// Mapeamento de Vizinhos de Race (Exemplo simplificado, o real é um array de 37)
// Exemplo: 12 tem 35 e 28 como vizinhos de race.
const VIZINHOS_RACE = {
    0: [26, 32, 15], 1: [20, 33, 16], 2: [25, 21, 4], 3: [26, 35, 23], 4: [2, 21, 19],
    // ... é necessário mapear todos os 37 números para ser 100% preciso
    12: [35, 28], 13: [27, 36], 19: [15, 4, 21, 2, 25] // Exemplo
    // ...
};

// --- FUNÇÕES AUXILIARES DE PROPRIEDADE ---

function getDuzia(numero) {
    if (numero >= 1 && numero <= 12) return 1;
    if (numero >= 13 && numero <= 24) return 2;
    if (numero >= 25 && numero <= 36) return 3;
    return 0; // Zero
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
    // Retorna a lista de vizinhos (28 e 35 para 12 no exemplo do texto)
    return VIZINHOS_RACE[numero] || [];
}

// --- FUNÇÕES DE UTILIDADE E ARMAZENAMENTO ---

// (Mantidas as funções de exibirStatus, exibirErro, salvarHistorico, carregarHistorico)
// ... (código das funções de utilidade) ...

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

// --- FUNÇÕES DE ANÁLISE ESPECÍFICAS ---

/**
 * 1. Lógica Larissa: Gatilho Soma por Dúzia/Cor
 * - Busca: 1 Vermelho da 3ª Dúzia (25/27/30/32/34/36) seguido de 2 Pretos da 2ª Dúzia (13/15/17/20/22/24)
 * - Ex: 27-13-17 (V3D - P2D - P2D)
 */
function analiseLarissa(historico) {
    if (historico.length < 3) return { alvo: null, razao: 'Aguardando sequência 3 números.' };
    
    const [n1, n2, n3] = historico.slice(-3);
    
    // Condições Larissa
    const c1_vermelho_3d = getCor(n1) === 'vermelho' && getDuzia(n1) === 3;
    const c2_preto_2d = getCor(n2) === 'preto' && getDuzia(n2) === 2;
    const c3_preto_2d = getCor(n3) === 'preto' && getDuzia(n3) === 2;

    if (c1_vermelho_3d && c2_preto_2d && c3_preto_2d) {
        const soma = n1 + n2 + n3;
        let alvo = soma;
        
        // Redução da soma para um número entre 1 e 36
        if (soma > 36) {
            alvo = String(soma).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
            if (alvo > 36) alvo = alvo % 37; // Caso extremo, garante o range.
        }

        const vizinhos = getVizinhosRace(alvo);
        
        return {
            alvo: alvo,
            vizinhos: vizinhos,
            protecoes: [...vizinhos, 21, 0], // Alvo + Vizinhos + 21 + 0
            razao: `Gatilho Larissa (Soma ${n1}+${n2}+${n3}=${soma}) -> Alvo ${alvo}`
        };
    }
    
    return { alvo: null };
}

/**
 * 2. Lógica Gabriel: Padrão Dúzia + Coluna (Sequência)
 * - Busca: Sequência de transição (ex: 1D+3C -> 3D+2C -> Próxima)
 */
function analiseGabriel(historico) {
    if (historico.length < 3) return { alvos: null, razao: 'Aguardando histórico para padrão.' };
    
    const padrao = historico.slice(-3).map(n => `${getDuzia(n)}D${getColuna(n)}C`).join(' > ');
    
    // Mapeamento de padrões (Baseado nos exemplos que você forneceu)
    // A lógica real deve ser alimentada por um histórico maior de padrões mapeados.
    const mapaPadroes = {
        '1D3C > 3D2C': '2D1C', // Exemplo: 1D+3C na sequência paga 3D+2C, então 3D+2C deve puxar o 2D+1C (sequência lógica).
        // Adicione mais padrões aqui, ex:
        // '1D2C > 2D3C': '3D1C',
    };
    
    const padraoBusca = historico.slice(-2).map(n => `${getDuzia(n)}D${getColuna(n)}C`).join(' > ');
    
    if (mapaPadroes[padraoBusca]) {
        const proximo = mapaPadroes[padraoBusca]; // Ex: "2D1C"
        const [d, c] = proximo.match(/\d/g).map(Number); // [2, 1]
        
        // Encontra todos os números que pertencem à 2ª Dúzia E 1ª Coluna
        let alvos = [];
        for (let n = 1; n <= 36; n++) {
            if (getDuzia(n) === d && getColuna(n) === c) {
                alvos.push(n);
            }
        }
        
        return {
            alvos: alvos, // [2, 5, 8, 11] se fosse 1D2C
            protecoes: [...alvos, 0],
            razao: `Padrão Gabriel (Sequência ${padraoBusca}) -> Alvo ${proximo}`
        };
    }

    return { alvos: null };
}

/**
 * 3. Lógica Ryan: Análise Estelar/Gêmeos/Vizinhos (Trincas)
 * - Busca: Trinca A > X > B e relações de vizinhança.
 * - Simulação complexa: Apenas focaremos na catalogação simples de vizinhos dos 3 antes e 3 depois de um alvo.
 */
function analiseRyan(historico) {
    if (historico.length < 7) return { alvos: null, razao: 'Aguardando histórico para trinca completa.' };
    
    const alvo = historico[historico.length - 4]; // O número no centro da trinca 3 antes/3 depois

    // Exemplo: Simular a busca do alvo 13 na região 36, 27 (como no seu exemplo)
    if (historico.includes(36) && historico.includes(27) && getVizinhosRace(alvo).includes(36)) {
        return {
            alvos: [13, 27], // Alvos sugeridos 13 OU 27
            protecoes: [36, 0], // Proteção nos vizinhos em comum
            razao: `Gatilho Ryan (Alvo ${alvo} puxa 13/27 por vizinhança)`
        };
    }
    
    // Como esta lógica depende de um mapeamento visual/histórico de Gêmeos,
    // usamos um retorno padrão caso a condição complexa não seja mapeada.
    return { alvos: null };
}

// --- FUNÇÃO CENTRAL DE ANÁLISE ---

function gerarAnalise() {
    limparErros();
    
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

    // 1. RODAR AS 3 ANÁLISES (Sempre rodamos nas 3 últimas rodadas ou mais)
    const resultadoLarissa = analiseLarissa(historicoCompleto);
    const resultadoGabriel = analiseGabriel(historicoCompleto);
    const resultadoRyan = analiseRyan(historicoCompleto);

    let alvosFinais = new Set();
    let razoes = [];

    // 2. INTEGRAÇÃO E PRIORIZAÇÃO
    
    // A. Prioridade 1: Lógica Larissa (É o gatilho mais específico)
    if (resultadoLarissa.alvo) {
        // Alvos: Número alvo + vizinhos de race
        alvosFinais.add(resultadoLarissa.alvo);
        resultadoLarissa.vizinhos.forEach(n => alvosFinais.add(n));
        razoes.push(`Larissa: ${resultadoLarissa.razao}`);
        
        // Se este gatilho dispara, usamos ele como principal e adicionamos proteções.
        const protecoes = [21, 0]; // Proteções fixas conforme regra
        protecoes.forEach(n => alvosFinais.add(n));
    }

    // B. Prioridade 2: Lógica Gabriel (Dúzia + Coluna)
    if (resultadoGabriel.alvos) {
        // Alvos: 4 números da combinação Dúzia/Coluna
        resultadoGabriel.alvos.forEach(n => alvosFinais.add(n));
        razoes.push(`Gabriel: ${resultadoGabriel.razao}`);
    }

    // C. Prioridade 3: Lógica Ryan (Estelar/Gêmeos)
    if (resultadoRyan.alvos) {
        // Alvos: Números sugeridos por Ryan (13, 27, etc.)
        resultadoRyan.alvos.forEach(n => alvosFinais.add(n));
        razoes.push(`Ryan: ${resultadoRyan.razao}`);
    }

    // 3. CONSOLIDAÇÃO FINAL
    
    if (alvosFinais.size === 0) {
        document.getElementById('detalhesSinal').textContent = "Nenhum gatilho detectado. Aguardando entrada.";
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Apostar até 0 Rodadas";
        return;
    }

    const alvosLista = Array.from(alvosFinais).sort((a, b) => a - b).filter(n => n !== 0); // Exclui o 0 da lista principal, pois é proteção
    
    // Gestão da sequência (Gestao de sequência: 1 entrada e 3 gales)
    const rodadasEspera = 4; // 1 entrada + 3 gales
    
    document.getElementById('detalhesSinal').textContent = razoes.join(' | ');
    document.getElementById('alvosSugeridos').textContent = alvosLista.join(', ') + (alvosFinais.has(0) ? ' (Proteção 0)' : '');
    document.getElementById('rodadasEspera').textContent = `Apostar até ${rodadasEspera} Rodadas (1 Entrada + 3 Gales)`;
    document.getElementById('neraDetalhes').textContent = `NERA/SGR/Trincas ativas: ${razoes.length}`;

    exibirDisplayStatus("Alerta de gatilho confirmado para entrada.", true);
}

// --- FUNÇÕES DE INTERATIVIDADE E EVENTOS ---

// (Mantidas as funções de carregarBase, processarNovoNumero, renderizarGradeRoleta, initSimulador)
// ... (código das funções de interatividade) ...

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
    
    const ultimos30 = historicoCompleto.slice(-30);
    
    let html = ultimos30.map(numero => {
        const cor = CORES_ROLETA[numero] || 'preto';
        const classeCor = numero === 0 ? 'zero' : cor; 
        return `<span class="botao-numero ${classeCor}" data-numero="${numero}">${numero}</span>`;
    }).join(' ');

    statusP.innerHTML = html;
    timelineDiv.querySelector('h3').textContent = `Linha do Tempo Recente (${ultimos30.length} Últimos Números)`;
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
    if (historicoCompleto.length < MIN_RODADAS) {
        exibirErro(`Carregue o Histórico Base (mínimo ${MIN_RODADAS}) no Passo 1.`);
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
    
    for (let i = 0; i <= 36; i++) {
        const cor = CORES_ROLETA[i];
        html += `<button class="botao-numero ${cor}" data-numero="${i}">${i}</button>`;
    }

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
