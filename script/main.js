import { ArvoreAVL } from "./AVL.js";
import { statusDiv, form, treeContainer, treeHeight } from "./constants.js";

export const arvore = new ArvoreAVL();

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const submitButton = event.submitter;
  const valor = parseInt(document.getElementById("valor").value);
  const acao = submitButton.value;

  // Disable button
  submitButton.disabled = true;

  try {
    if (acao === "inserir") {
      await arvore.insert(valor, atualizaArvore, atualizaStatus);
    } else if (acao === "remover") {
      await arvore.delete(valor, atualizaArvore, atualizaStatus);
    } else if (acao === "buscar") {
      const caminho = arvore.search(valor);
      console.log(caminho);
      const encontrado = caminho[caminho.length - 1] === valor;
      highlightSearchPath(caminho);
      atualizaStatus(
        encontrado ? `ENCONTRADO: ${valor}` : `NÃO ENCONTRADO: ${valor}`
      );
    }
  } finally {
    // Re-enable button after operation completes
    submitButton.disabled = false;
  }
});

function atualizaStatus(novoStatus) {
  statusDiv.innerText = novoStatus;
}

function highlightSearchPath(caminho) {
  const duracao = 1000;

  // Animate nodes sequentially
  d3.selectAll("circle")
    .transition()
    .duration(duracao)
    .style("fill", function (d) {
      const index = caminho.indexOf(d.data.value);
      if (index === -1) return "#fff";
      return d3.interpolateGreens((index+1) / caminho.length);
    })
    .transition()
    .delay(1000)
    .duration(duracao)
    .style("fill", "#fff");
}

async function atualizaArvore() {
  return await new Promise((resolve) => {
    try {
      // Remove previous tree
      d3.select("#tree-container").select("svg").remove();

      // Create new tree
      createTree();

      // Update height
      treeHeight.innerText = `Altura: ${arvore.raiz.altura}`;

      // Center scroll
      treeContainer.scrollLeft =
        (treeContainer.scrollWidth - treeContainer.clientWidth) / 2;
      treeContainer.scrollTop = 0;

      // Wait for D3 transitions to complete
      d3.select("#tree-container")
        .transition()
        .duration(500)
        .on("end", resolve);
    } catch (error) {
      console.error("Error updating tree:", error);
      resolve(); // Resolve even on error to prevent blocking
    }
  });
}

function contaDescendentesDireita(node) {
  if (!node) return [];
  return node
    .descendants()
    .filter((d) => d.data.value >= node.data.value && d !== node).length;
}

function contaDescendentesEsquerda(node) {
  if (!node) return [];
  return node
    .descendants()
    .filter((d) => d.data.value <= node.data.value && d !== node).length;
}

function updateNodeText(nodes) {
  // Update value text
  nodes
    .selectAll("text.value-text")
    .data((d) => [d])
    .join("text")
    .attr("class", "value-text")
    .attr("dy", "4")
    .attr("text-anchor", "middle")
    .text((d) => d.data.value)
    .style("font-size", "12px");

  // Update factor text
  nodes
    .selectAll("text.factor-text")
    .data((d) => [d])
    .join("text")
    .attr("class", "factor-text")
    .attr("dy", "-25")
    .attr("text-anchor", "middle")
    .text((d) => `FB=${d.data.fator}`)
    .style("font-size", "12px");
}

// Create the visualization function
function createTree() {
  if (!arvore.raiz) return;
  const root = d3.hierarchy(arvore.dados);

  console.log(root);
  const width = 2000;
  const height = 600; // Increased height
  const verticalSpacing = 80; // Increased vertical spacing
  const horizontalSpacing = 25;

  // Create SVG container
  const svg = d3
    .select("#tree-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, 50)`);

  // Custom node positioning
  root.x = 0;
  root.y = 0;

  root.descendants().forEach((d) => {
    if (d.parent) {
      // Posição vertical: cada nível desce uma distância fixa
      d.y = d.parent.y + verticalSpacing;
      // Posição horizontal: baseado no valor do nó
      if (d.data.value < d.parent.data.value) {
        d.x =
          d.parent.x - horizontalSpacing * (1 + contaDescendentesDireita(d));
      } else {
        // Nó maior: à direita do pai
        d.x =
          d.parent.x + horizontalSpacing * (1 + contaDescendentesEsquerda(d));
      }
    }
  });

  // Add links
  svg
    .selectAll("path")
    .data(root.links())
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

  // Create node groups
  const nodes = svg
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Add circles to groups
  nodes
    .append("circle")
    .attr("r", 20)
    .attr("fill", "#fff")
    .attr("stroke", "#555");

  // Add text to groups
  nodes
    .append("text")
    .attr("dy", "4")
    .attr("text-anchor", "middle")
    .text((d) => d.data.value)
    .style("font-size", "12px");

  updateNodeText(nodes);
}
