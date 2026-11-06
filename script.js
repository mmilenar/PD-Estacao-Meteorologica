const ARQUIVO_CSV = "dados_estacao_meteorologica_set_out_2026.csv";
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Todas as medições do CSV
let medicoes = [];


// ÍCONES CARDS
const SVG_ABRE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">';
const ICONES = {
    // termômetro
    termometro: SVG_ABRE + '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
    // gota
    gota: SVG_ABRE + '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    // pressao
    pressao: SVG_ABRE + '<polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>',
    // sol
    sol: SVG_ABRE + '<circle cx="12" cy="12" r="5"/>' +
         '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
         '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
         '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
         '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    // nuvem com chuva
    nuvemChuva: SVG_ABRE + '<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/>' +
                '<line x1="12" y1="15" x2="12" y2="23"/>' +
                '<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
    // lua
    lua: SVG_ABRE + '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
};


//  FUNÇÕES AUXILIARES
// Formata a data para o padrão brasileiro
function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR");
}

// Número com vírgula
function numeroBR(n, casas = 1) {
    return isNaN(n) ? "--" : n.toFixed(casas).replace(".", ",");
}


// LEITURA DOS DADOS DA CSV
async function carregarCSV() {
    let texto;

    if (typeof CSV_TEXTO !== "undefined") {
        // TESTE CSV PRA JS. 
        texto = CSV_TEXTO;
    } else {
        const resposta = await fetch(ARQUIVO_CSV);
        if (!resposta.ok) {
            throw new Error("CSV não encontrado: " + ARQUIVO_CSV);
        }
        texto = await resposta.text();
    }
    const linhas = texto.replace(/^\uFEFF/, "").trim().split(/\r?\n/).slice(1);

    const lista = linhas.map(linha => {
        const [data, temp, umid, pressao, luz, chuva] = linha.split(";");

        const [dia, hora] = data.split(", ");
        const [dd, mm, aaaa] = dia.split("/");

        return {
            timestamp: `${aaaa}-${mm}-${dd}T${hora}`,
            temperature: parseFloat(temp),
            humidity: parseFloat(umid),
            pressure: parseFloat(pressao),
            luminosity: Number(luz),
            raindrop: Number(chuva)
        };
    });

    // ORDEM ANTIGO P NOVO
    return lista.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
}

 //ULTIMA MEDIÇÃO
function montarUltimaMedicao(m) {
    const dia = m.timestamp.slice(8, 10);                              // "31"
    const mes = MESES_ABREV[Number(m.timestamp.slice(5, 7)) - 1];      // "out"
    const ano = m.timestamp.slice(2, 4);                               // "26"
    const hora = m.timestamp.slice(11, 16);                            // "23:08"

    // CARDS
    const cartoes = [
        { tipo: "temperatura", icone: ICONES.termometro, rotulo: "Temperatura",
          valor: numeroBR(m.temperature), unidade: "°C" },
        { tipo: "umidade",     icone: ICONES.gota,       rotulo: "Umidade",
          valor: numeroBR(m.humidity),    unidade: "%" },
        { tipo: "pressao",     icone: ICONES.pressao,    rotulo: "Pressão",
          valor: numeroBR(m.pressure),    unidade: "hPa" },
        { tipo: "luz",         icone: ICONES.sol,        rotulo: "Luminosidade",
          valor: m.luminosity, unidade: "" },          // luz e chuva: aparece 0 ou 1
        { tipo: "chuva",       icone: ICONES.nuvemChuva, rotulo: "Chuva",
          valor: m.raindrop, unidade: "" }
    ];

    const htmlCartoes = cartoes.map(c => `
        <li class="cartao-medida cartao-${c.tipo}">
            <span class="cartao-icone">${c.icone}</span>
            <div>
                <span class="cartao-rotulo">${c.rotulo}</span>
                <strong class="cartao-valor">${c.valor}${c.unidade ? " <small>" + c.unidade + "</small>" : ""}</strong>
            </div>
        </li>`).join("");

    document.getElementById("ultimo").innerHTML = `
        <div class="ultima-topo">
            <div class="data-grande">
                <span class="data-dia">${dia}</span>
                <span class="data-mes">${mes}${ano}</span>
                <span class="data-hora">às ${hora}</span>
            </div>
        </div>
        <ul class="cartoes">${htmlCartoes}</ul>`;
}


//BANNER MENU

function iniciarMenu() {
    const botao = document.getElementById("botao-menu");
    const menu = document.getElementById("menu-topicos");

    function mostrarMenu(visivel) {
        menu.hidden = !visivel;                       
        botao.setAttribute("aria-expanded", visivel);     
        botao.setAttribute("aria-label", visivel ? "Fechar menu" : "Abrir menu de tópicos");
        botao.classList.toggle("aberto", visivel);     
    }

    botao.addEventListener("click", () => mostrarMenu(menu.hidden));
    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => mostrarMenu(false));
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") mostrarMenu(false);
    });

    document.addEventListener("click", evento => {
        if (!menu.hidden && !menu.contains(evento.target) && !botao.contains(evento.target)) {
            mostrarMenu(false);
        }
    });
}


//TABELA
let tabelaAtual = "dia";
let filtroAtivo = null;

const TITULOS_TABELA = {
    dia: "Medições do dia",
    semana: "Medições da semana",
    mes: "Medições do mês",
    total: "Todas as medições"
};

function medicoesDaTabela(tipo) {
    const ultima = medicoes[medicoes.length - 1].timestamp;

    if (tipo === "dia") {
        return medicoes.filter(m => m.timestamp.startsWith(ultima.slice(0, 10)));
    }
    if (tipo === "semana") {
        const inicio = new Date(new Date(ultima) - 7 * 24 * 60 * 60 * 1000);
        return medicoes.filter(m => new Date(m.timestamp) >= inicio);
    }
    if (tipo === "mes") {
        return medicoes.filter(m => m.timestamp.startsWith(ultima.slice(0, 7)));
    }
    return medicoes; // todas as medições (inclui setembro)
}

function criarTabela(lista) {
    if (lista.length === 0) {
        return '<p class="vazio">Nenhuma medição encontrada.</p>';
    }

    let linhas = "";
    lista.forEach(m => {
        linhas += `
            <tr>
                <td>${formatarData(m.timestamp)}</td>
                <td>${numeroBR(m.temperature, 2)} °C</td>
                <td>${numeroBR(m.humidity, 2)} %</td>
                <td>${numeroBR(m.pressure, 2)} hPa</td>
                <td>${m.luminosity}</td>
                <td>${m.raindrop}</td>
            </tr>`;
    });

    return `
        <table>
            <thead>
                <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Temperatura</th>
                    <th scope="col">Umidade</th>
                    <th scope="col">Pressão</th>
                    <th scope="col">Luminosidade</th>
                    <th scope="col">Chuva</th>
                </tr>
            </thead>
            <tbody>${linhas}</tbody>
        </table>`;
}

function aplicarFiltro(f) {
    return medicoes.filter(m => {
        const mesAno = m.timestamp.slice(0, 7); 
        const dia = m.timestamp.slice(8, 10);      
        const hora = m.timestamp.slice(11, 16);   

        if (f.mes && mesAno !== f.mes) return false;
        if (f.dia && dia !== f.dia) return false;
        return hora >= f.de && hora <= f.ate; 
    });
}
function atualizarTabela() {
    let lista, titulo;

    if (filtroAtivo) {
        lista = aplicarFiltro(filtroAtivo);
        titulo = "Resultado da busca";
    } else {
        lista = medicoesDaTabela(tabelaAtual);
        titulo = TITULOS_TABELA[tabelaAtual];
    }

    document.querySelectorAll("[data-tabela]").forEach(botao => {
        botao.setAttribute("aria-pressed", !filtroAtivo && botao.dataset.tabela === tabelaAtual);
    });

    document.getElementById("contagem-tabela").textContent =
        `${titulo}: ${lista.length} ${lista.length === 1 ? "medição" : "medições"}.`;
    document.getElementById("tabela-medicoes").innerHTML = criarTabela(lista);
}

function preencherOpcoesDia() {
    const selMes = document.getElementById("filtro-mes");
    const selDia = document.getElementById("filtro-dia");
    const diaEscolhido = selDia.value;

    let totalDias = 31;
    if (selMes.value) {
        const [ano, mes] = selMes.value.split("-").map(Number);
        totalDias = new Date(ano, mes, 0).getDate(); 
    }

    let opcoes = '<option value="">Todos</option>';
    for (let d = 1; d <= totalDias; d++) {
        const valor = String(d).padStart(2, "0"); 
        opcoes += `<option value="${valor}">${d}</option>`;
    }
    selDia.innerHTML = opcoes;
    if (diaEscolhido && Number(diaEscolhido) <= totalDias) selDia.value = diaEscolhido;
}

function preencherOpcoesMes() {
    const meses = [...new Set(medicoes.map(m => m.timestamp.slice(0, 7)))];

    let opcoes = '<option value="">Todos</option>';
    meses.forEach(chave => {
        const nome = MESES_NOME[Number(chave.slice(5, 7)) - 1];
        opcoes += `<option value="${chave}">${nome} de ${chave.slice(0, 4)}</option>`;
    });
    document.getElementById("filtro-mes").innerHTML = opcoes;
    preencherOpcoesDia();
}

// Volta os campos da busca ao começo
function limparCamposBusca() {
    document.getElementById("filtro-mes").value = "";
    preencherOpcoesDia();
    document.getElementById("filtro-dia").value = "";
    document.getElementById("filtro-hora-de").value = "00:00";
    document.getElementById("filtro-hora-ate").value = "23:59";
    document.getElementById("aviso-busca").textContent = "";
}

function iniciarTabelas() {
    preencherOpcoesMes();

    // Escolher outra tabela
    document.querySelectorAll("[data-tabela]").forEach(botao => {
        botao.addEventListener("click", () => {
            tabelaAtual = botao.dataset.tabela;
            filtroAtivo = null;
            limparCamposBusca();
            atualizarTabela();
        });
    });

    // Trocar o mês atualiza a lista de dias
    document.getElementById("filtro-mes").addEventListener("change", preencherOpcoesDia);

    // Enviar a busca
    document.getElementById("busca").addEventListener("submit", evento => {
        evento.preventDefault(); 

        const de = document.getElementById("filtro-hora-de").value || "00:00";
        const ate = document.getElementById("filtro-hora-ate").value || "23:59";
        const aviso = document.getElementById("aviso-busca");

        if (de > ate) {
            aviso.textContent = "O horário inicial precisa ser antes do horário final.";
            return;
        }
        aviso.textContent = "";

        filtroAtivo = {
            mes: document.getElementById("filtro-mes").value,
            dia: document.getElementById("filtro-dia").value,
            de: de,
            ate: ate
        };
        atualizarTabela();
    });
    document.getElementById("limpar-busca").addEventListener("click", () => {
        filtroAtivo = null;
        limparCamposBusca();
        atualizarTabela();
    });

    atualizarTabela();
}


//BANNER CÉU
const DURACAO_CICLO = 60000;

const FASES_DO_CEU = [
    { t: 0.00, topo: [255, 241, 168], base: [255, 184, 107], estrela: 0 },   // amanhecer (amarelinho)
    { t: 0.25, topo: [30, 144, 255],  base: [135, 206, 235], estrela: 0 },   // dia (azul vivo)
    { t: 0.50, topo: [106, 76, 147],  base: [240, 138, 138], estrela: 0.2 }, // entardecer (arroxeado)
    { t: 0.75, topo: [88, 44, 140],   base: [15, 23, 70],    estrela: 1 },   // noite (roxo -> azul escuro)
    { t: 1.00, topo: [255, 241, 168], base: [255, 184, 107], estrela: 0 }    // volta ao amanhecer
];

const SOL_INICIO = 0.00;
const SOL_FIM    = 0.55;
const LUA_INICIO = 0.55;
const LUA_FIM    = 0.95;

const banner = document.getElementById("banner");
const sol = document.getElementById("sol");
const lua = document.getElementById("lua");
const estrelas = document.getElementById("estrelas");

function misturarNumeros(a, b, f) {
    return a + (b - a) * f;
}

function misturarCores(a, b, f) {
    return a.map((valor, i) => Math.round(misturarNumeros(valor, b[i], f)));
}

// BRILHO ESTRELA ALEATORIO
function criarEstrelas(quantidade) {
    for (let i = 0; i < quantidade; i++) {
        const estrela = document.createElement("span");
        estrela.className = "estrela";
        estrela.style.left = (Math.random() * 100) + "%";
        estrela.style.top = (Math.random() * 65) + "%";       
        const tamanho = 1 + Math.random() * 2;                    
        estrela.style.width = tamanho + "px";
        estrela.style.height = tamanho + "px";
        estrela.style.animationDuration = (2 + Math.random() * 3) + "s";
        estrela.style.animationDelay = (Math.random() * 3) + "s";
        estrelas.appendChild(estrela);
    }
}

// ARCO
function posicionarAstro(elemento, progresso) {
    // Fora do seu período, o astro fica invisível
    if (progresso < 0 || progresso > 1) {
        elemento.style.opacity = 0;
        return;
    }
    // DEGRADE
    elemento.style.opacity = Math.min(1, progresso * 10, (1 - progresso) * 10);
    elemento.style.left = (10 + 80 * progresso) + "%";
    elemento.style.bottom = (5 + Math.sin(Math.PI * progresso) * 60) + "%";
}

function animarCeu(agora) {
    const p = (agora % DURACAO_CICLO) / DURACAO_CICLO;
    let i = 0;
    while (i < FASES_DO_CEU.length - 2 && p > FASES_DO_CEU[i + 1].t) i++;
    const atual = FASES_DO_CEU[i];
    const proxima = FASES_DO_CEU[i + 1];
    const f = (p - atual.t) / (proxima.t - atual.t);

    const topo = misturarCores(atual.topo, proxima.topo, f);
    const base = misturarCores(atual.base, proxima.base, f);
    banner.style.background =
        `linear-gradient(to bottom, rgb(${topo}), rgb(${base}))`;

    // ESTRELA SÓ A NOITE
    estrelas.style.opacity = misturarNumeros(atual.estrela, proxima.estrela, f);

    //MOVIMENTO
    posicionarAstro(sol, (p - SOL_INICIO) / (SOL_FIM - SOL_INICIO));
    posicionarAstro(lua, (p - LUA_INICIO) / (LUA_FIM - LUA_INICIO));

    requestAnimationFrame(animarCeu); 
}

// INICIAR
async function iniciar() {
    // Partes que não dependem dos dados
    iniciarMenu();
    criarEstrelas(45);
    requestAnimationFrame(animarCeu);

    // Partes que dependem dos dados do CSV
    try {
        medicoes = await carregarCSV();
        montarUltimaMedicao(medicoes[medicoes.length - 1]);
        iniciarTabelas();
    } catch (erro) {
        // AVISO TELA
        console.error(erro);
        const mensagem = "Não foi possível carregar os dados.";
        document.getElementById("ultimo").textContent = mensagem;
        document.getElementById("tabela-medicoes").textContent = mensagem;
    }
}

iniciar();