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

// Mapeamento de Vizinhos de Race (PRECISA SER COMPLETO POR VOCÊ)
// Números cruciais para o Gatilho Soma estão inclusos para teste.
const VIZINHOS_RACE = {
    0: [3, 26, 32, 15], 1: [20, 33, 16], 2: [25, 21, 4], 3: [26, 35, 23], 4: [2, 21, 19],
    12: [35, 28], 13: [27, 36], 15: [0, 32, 19], 17: [34, 6], 21: [2, 4, 19, 25], 24: [16, 33, 1],
    27: [13, 36], 28: [12, 35], 32: [0, 15, 19], 35: [12, 28], 36: [13, 27]
    // OBS: Complete o restante dos 37 números aqui para análise 100% precisa.
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
    return VIZINHOS_RACE[numero] || [];
}

// --- FUNÇÕES DE UTILIDADE E ARMAZENAMENTO ---

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
// --- FUNÇÕES DE ANÁLISE ESPECÍFICAS (GATILHOS) ---
// --------------------------------------------------------------------------

/**
 * [span_3](start_span)Gatilho 1 - A Soma dos 3 Números (Larissa)[span_3](end_span)
 * Sequência exata: Vermelho 3D -> Preto 2D -> Preto 2D
 */
function analiseSoma(historico) {
    if (historico.length < 3) return { alvo: null, razao: 'Aguardando sequência 3 números.' };
    
    // N1 é o antepenúltimo, N2 é o penúltimo, N3 é o último
    const [n1, n2, n3] = historico.slice(-3);
    
    [span_4](start_span)// Condições Gatilho 1[span_4](end_span)
    const n1_vermelho_3d = getCor(n1) === 'vermelho' && getDuzia(n1) === 3;
    const n2_preto_2d = getCor(n2) === 'preto' && getDuzia(n2) === 2;
    const n3_preto_2d = getCor(n3) === 'preto' && getDuzia(n3) === 2;

    if (n1_vermelho_3d && n2_preto_2d && n3_preto_2d) {
        const soma = n1 + n2 + n3;
        let alvo = soma;
        
        [span_5](start_span)// Redução da soma para um número entre 1 e 36[span_5](end_span)
        if (soma > 36) {
            alvo = String(soma).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
            // Verifica se a soma dos dígitos ainda é > 36 (o que é improvável com 3 números)
            if (alvo > 36) {
                 alvo = String(alvo).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
            }
        }
        
        // Se o alvo for 0 após a redução, ele é tratado como proteção, mas a jogada deve ser mantida.
        if (alvo === 0) alvo = 12; // Regra de segurança/substituição para 0, se aplicável. Manteremos o 0 na proteção.

        const vizinhos = getVizinhosRace(alvo);
        
        return {
            alvo: alvo,
            vizinhos: vizinhos,
            protecoes: [21, 0], // Proteções adicionais conforme regra original
            razao: `Gatilho 1 (Soma ${n1}+${n2}+${n3}=${soma}) -> Alvo ${alvo} + Vizinhos de Race`
        };
    }
    
    return { alvo: null };
}

/**
 * [span_6](start_span)Gatilho 2 - Padrão de Dúzia + Coluna (Gabriel) [cite: 12-14]
 * Busca: Sequência de transição (ex: 1D3C > 3D2C -> 2D1C)
 */
function analiseDCC(historico) {
    if (historico.length < 2) return { alvos: null, razao: 'Aguardando 2 números para padrão DCC.' };
    
    // Mapeamento de padrões (PRECISA SER COMPLETO POR VOCÊ)
    // Insira aqui as sequências que você catalogou.
    const mapaPadroes = {
        '1D3C > 3D2C': '2D1C', 
        '2D1C > 3D2C': '1D3C',
        // Exemplo da regra: 1Dúzia+ 3 Coluna > 2 Dúzia + 1 Coluna
        // Na sequência paga 3 Dúzia + 2 Coluna
        // Se a sequência for 1D3C > 2D1C, a previsão é 3D2C
        '1D3C > 2D1C': '3D2C', 
        // Adicione seus padrões aqui...
    };
    
    // Pega os 2 últimos números
    const ultimos2 = historico.slice(-2);
    // Forma a chave de busca (ex: '1D3C > 3D2C')
    const padraoBusca = ultimos2.map(n => `${getDuzia(n)}D${getColuna(n)}C`).join(' > ');
    
    if (mapaPadroes[padraoBusca]) {
        const proximo = mapaPadroes[padraoBusca]; // Ex: "2D1C"
        // Extrai a Dúzia (d) e a Coluna (c)
        const [d, c] = proximo.match(/\d/g).map(Number); 
        
        // Encontra todos os números que pertencem à Dúzia E Coluna previstas
        let alvos = [];
        for (let n = 1; n <= 36; n++) {
            if (getDuzia(n) === d && getColuna(n) === c) {
                alvos.push(n);
            }
        }
        
        return {
            alvos: alvos, 
            protecoes: [0], // Proteção 0 conforme regra original (4 fichas + 0)
            razao: `Gatilho 2 (Sequência DCC ${padraoBusca}) -> Alvo ${proximo}`
        };
    }

    return { alvos: null };
}

/**
 * [cite_start]Gatilho 3 - Padrão Gêmeo + Espelho (Ryan)[span_6](end_span)
 * Busca: Número analisado aparece 3x mostrando pontos em comum (região/vizinhos).
 */
function analiseGE(historico) {
    if (historico.length < MIN_RODADAS) return { alvos: null, razao: 'Aguardando histórico completo para análise Estelar.' };
    
    // Lógica Ryan: Busca por um número (alvoX) que apareceu 3 ou mais vezes
    [span_7](start_span)// no histórico completo e que possui vizinhos/regiões comuns[span_7](end_span).
    
    const contagem = historico.reduce((acc, num) => {
        acc[num] = (acc[num] || 0) + 1;
        return acc;
    }, {});
    
    // Simula a busca de números que apareceram 3x (o gatilho Estelar/Gêmeo)
    const alvosPotenciais = Object.keys(contagem).filter(n => contagem[n] >= 3).map(Number);

    if (alvosPotenciais.length > 0) {
        // Se um alvo potencial for encontrado, assume-se que a catalogação manual
        // já determinou o alvo real (que é a parte mais complexa da sua estratégia)
        
        // Exemplo: Se o 19 e o 13 são alvos de 3x e possuem regiões em comum
        if (alvosPotenciais.includes(19) && alvosPotenciais.includes(13)) {
             return {
                alvos: [13, 27], // Alvos finais (13 OU 27) conforme seu exemplo
                protecoes: [36, 0], 
                razao: `Gatilho 3 (Trinca do 19 e 13 Ativa) -> Alvos 13/27`
            };
        }

        return {
             alvos: alvosPotenciais.slice(0, 3), // Se a lógica de vizinhos não se aplicar, sugere os que saíram 3x
             protecoes: [0],
             razao: `Gatilho 3 (Número(s) ${alvosPotenciais.slice(0, 3).join(', ')} apareceram 3x. Cataloque a região).`
        };
    }
    
    return { alvos: null };
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
        document.getElementById('detalhesSinal').textContent = "Histórico insuficiente (mínimo 100).";
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Aguardando mais dados.";
        return;
    }

    // 1. RODAR AS 3 ANÁLISES
    const rSoma = analiseSoma(historicoCompleto);
    const rDCC = analiseDCC(historicoCompleto);
    const rGE = analiseGE(historicoCompleto);

    let alvosFinais = new Set();
    let razoes = [];
    let rodadasEspera = 0;

    // 2. INTEGRAÇÃO E PRIORIZAÇÃO
    
    // A. Prioridade 1: Gatilho 1 - Soma (Mais específico)
    if (rSoma.alvo) {
        alvosFinais.add(rSoma.alvo);
        rSoma.vizinhos.forEach(n => alvosFinais.add(n));
        rSoma.protecoes.forEach(n => alvosFinais.add(n));
        razoes.push(rSoma.razao);
        rodadasEspera = 4; // 1 entrada + 3 gales
    }

    // B. Prioridade 2: Gatilho 2 - Dúzia + Coluna
    if (rDCC.alvos) {
        rDCC.alvos.forEach(n => alvosFinais.add(n));
        rDCC.protecoes.forEach(n => alvosFinais.add(n));
        razoes.push(rDCC.razao);
        if (rodadasEspera === 0) rodadasEspera = 4;
    }

    // C. Prioridade 3: Gatilho 3 - Gêmeo + Espelho
    if (rGE.alvos) {
        rGE.alvos.forEach(n => alvosFinais.add(n));
        rGE.protecoes.forEach(n => alvosFinais.add(n));
        razoes.push(rGE.razao);
        if (rodadasEspera === 0) rodadasEspera = 4;
    }

    // 3. CONSOLIDAÇÃO FINAL
    
    if (alvosFinais.size === 0) {
        document.getElementById('detalhesSinal').textContent = "Nenhum gatilho detectado. Aguardando a sequência exata.";
        document.getElementById('alvosSugeridos').textContent = "0";
        document.getElementById('rodadasEspera').textContent = "Apostar até 0 Rodadas";
        document.getElementById('neraDetalhes').textContent = `NERA/SGR/Trincas Ativas: 0`;
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

// --------------------------------------------------------------------------
// --- FUNÇÕES DE INTERATIVIDADE E INICIALIZAÇÃO (MANTIDAS) ---
// --------------------------------------------------------------------------

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
