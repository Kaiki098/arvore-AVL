import { ArvoreAVL } from "./AVL.js";
import { statusDiv, form, treeContainer, treeHeight } from "./constants.js";

export const arvore = new ArvoreAVL();

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const botaoDeSubmissao = event.submitter;
  const valor = parseInt(document.getElementById("valor").value);
  const acao = botaoDeSubmissao.value;

  // Desabilita botão
  botaoDeSubmissao.disabled = true;

  try {
    if (acao === "inserir") {
      await arvore.insere(valor, atualizaArvore, atualizaStatus);
    } else if (acao === "remover") {
      await arvore.deleta(valor, atualizaArvore, atualizaStatus);
    } else if (acao === "buscar") {
      const caminho = arvore.pesquisa(valor);
      const encontrado = caminho[caminho.length - 1] === valor;
      destacaCaminhoBusca(caminho);

      atualizaStatus(
        encontrado ? `ENCONTRADO: ${valor}` : `NÃO ENCONTRADO: ${valor}`
      );

      if (encontrado) {
        atualizaStatus(`ENCONTRADO: ${valor}`);
      } else {
        atualizaStatus(`NÃO ENCONTRADO: ${valor}`);
        await Swal.fire({
          icon: 'warning',
          title: 'Valor não encontrado',
          text: `Não foi possível encontrar o valor ${valor}.`,
          position: 'center-start',
          backdrop: false,
          customClass: {
            icon: 'swal2-warning',
          }
        });
      }
    }
  } finally {
    // Habilita botão após completar a operação
    // (Garante que o usuário não adicione novos valores
    // antes que a ação anterior esteja finalizada)
    botaoDeSubmissao.disabled = false;
  }
});

// Função responsável por atualizar o campos status
function atualizaStatus(novoStatus) {
  statusDiv.innerText = novoStatus;
}

function destacaCaminhoBusca(caminho) {
  const duracao = 500;

  // Anima nós sequencialmente
  d3.selectAll("circle")
    .transition() // Começa animação
    .duration(duracao) // Tempo de duração da animação, branco para verde
    .style("fill", function (d) {
      // Verifica se o elemento está no caminho,
      // Se não estiver colore de branco,
      // Se estiver, colore com um tom de verde
      const index = caminho.indexOf(d.data.valor);
      if (index === -1) return "#fff";
      return d3.interpolateGreens((index + 1) / caminho.length);
    })
    .transition() // Começa outra animação
    .delay(1000) // Tempo para voltar a cor anterior após animar
    .duration(duracao) // Tempo de duração da animação, verde para branco
    .style("fill", "#fff");
}

// Atualiza a visualização da árvore
function atualizaArvore() {
  return new Promise((resolve) => {
    try {
      // Remove arvore anterior
      d3.select("#tree-container").select("svg").remove();

      // Cria nova árvore
      criaArvore();

      // Atualiza altura
      treeHeight.innerText = `Altura: ${arvore.raiz.altura}`;

      // Centraliza scroll
      treeContainer.scrollLeft =
        (treeContainer.scrollWidth - treeContainer.clientWidth) / 2;
      treeContainer.scrollTop = 0;

      // Garante que toda a árvore seja atualizada
      d3.select("#tree-container")
        .transition()
        .on("end", () => {
          resolve();
        });
    } catch (error) {
      console.log("Erro ao atualizar arvore. erro: " + error.message);
      resolve();
    }
  })
}

function contaDescendentesDireita(no) {
  if (!no) return 0;
  return no
    .descendants()
    .filter((d) => d.data.valor >= no.data.valor && d !== no).length;
}

function contaDescendentesEsquerda(no) {
  if (!no) return 0;
  return no
    .descendants()
    .filter((d) => d.data.valor <= no.data.valor && d !== no).length;
}



// Cria a função de visualização da arvore
function criaArvore() {
  if (!arvore.raiz) return;

  const width = 2000;
  const height = 600;
  const espacamentoVertical = 80;
  const espacamentoHorizontal = 25;
  
  const raiz = d3.hierarchy(arvore.dados);
  
  // Cria container SVG
  const svg = d3
    .select("#tree-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")

  // Posiciona a raiz no meio 
  raiz.x = width / 2;
  raiz.y = 50;

  raiz.descendants().forEach((d) => {
    if (d.parent) {
      // Posição vertical: cada nível desce uma distância fixa
      d.y = d.parent.y + espacamentoVertical;
      // Posição horizontal: baseado no valor do nó
      if (d.data.valor < d.parent.data.valor) {
        // Nó maior: à esquerda do pai
        d.x =
          d.parent.x -
          espacamentoHorizontal * (1 + contaDescendentesDireita(d));
      } else {
        // Nó maior: à direita do pai
        d.x =
          d.parent.x +
          espacamentoHorizontal * (1 + contaDescendentesEsquerda(d));
      }
    }
  });

  // Adiciona links
  svg
    .selectAll("path")
    .data(raiz.links())
    .join("path")
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
    )
    .attr("fill", "none")
    .attr("stroke", "#555");

  // Cria nós
  const nodes = svg
    .selectAll("g")
    .data(raiz.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Adiciona circulos aos nós
  nodes
    .append("circle")
    .attr("r", 20)
    .attr("fill", "#fff")
    .attr("stroke", "#555");

  // Adiciona texto aos nós
  nodes
    .append("text")
    .attr("dy", "4")
    .attr("text-anchor", "middle")
    .text((d) => d.data.valor)
    .style("font-size", "12px");

  // Adiciona fator de balanciamento aos nós
  nodes
    .append("text")
    .attr("dy", "-25")
    .attr("text-anchor", "middle")
    .text((d) => `FB=${d.data.fator}`)
    .style("font-size", "12px");
}

