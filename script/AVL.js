class NodeArvoreAVL {
  constructor(valor) {
    this.valor = valor;
    this.esq = null;
    this.dir = null;
    this.pai = null;
    this.altura = 0;
    this.fator = 0;
  }
}

export class ArvoreAVL {
  constructor() {
    this.raiz = null; // Raíz da árvore
    this.dados = {}; // Dados dos nós da árvore para visualização
  }

  /*
    INSERÇÃO

    A função de inserção encontra a posição correta para inserir o novo nó de forma recursiva pelo método insereNode, 
    em seguida atualiza a altura do nó e chama a função de balanceamento.
  */
  async insere(valor, atualizaArvore, atualizaStatus) {
    this.status = "";  //o status é responsável pela mensagem exibida na tela

    /*
      O método insereNode é parecido com o implementado em sala de aula para inserção de valores na árvore
      A busca inicia pela raíz e desce até encontrar a posição correta para inserir o novo nó.
    */
   const insereNode = async (node, pai = null) => {
      // Quando a recursão encontrar a posição adequada (NULL), o nó é inserido
      if (!node) {
        const newNode = new NodeArvoreAVL(valor);
        newNode.pai = pai;
        atualizaStatus(`INSERIDO: ${valor}.`);
        return newNode;
      }

      // Caso o valor novo seja menor que o valor do nó atual, a busca continua para a esquerda, caso contrário, para a direita
      if (valor < node.valor) {
        node.esq = await insereNode(node.esq, node);
      } else if (valor > node.valor) {
        node.dir = await insereNode(node.dir, node);
      } else {
        // Caso o valor novo já exista, ele não é inserido
        atualizaStatus(`O VALOR ${valor} JÁ EXISTE.`);
        return node;
      }
      
      // Atualiza a altura do novo nó
      this._updateAltura(node);

      // Atualiza os fatores de balanceamento
      this.atualizaFatores(this.raiz);

      // Atualiza os dados presentes na árvore para visualização em tempo real no site
      this.atualizaDados();

      // Balanceia a árvore após a inserção
      return await this._balanceia(node, atualizaArvore, atualizaStatus);
    };

    // Chama o método interno insereNode para inserir o novo valor
    this.raiz = await insereNode(this.raiz);

    // Certifica de que o pai da raíz é nulo
    if (this.raiz.pai) this.raiz.pai = null;

    // Atualiza os fatores de balanceamento
    this.atualizaFatores(this.raiz);

    // Atualiza os dados dos nós
    this.atualizaDados();

    // Atualiza a árvore no visualizador
    atualizaArvore();
  }

  /*
    REMOÇÃO

    A função de remoção encontra o nó a ser removido de forma recursiva e, em seguida,
    chama a função de balanceamento para manter a árvore balanceada.
  */
  async deleta(valor, atualizaArvore, atualizaStatus) {

    /*
      O método deletaNode é parecido com o implementado em sala de aula para remoção de valores na árvore
      A busca inicia pela raíz e desce até encontrar a posição correta para inserir o novo nó.
    */
    const deletaNode = async (node, valor) => {
      // Caso a busca chegue abaixo de um nó folha, o valor não existe
      if (!node) {
        atualizaStatus("Nó não existe.")
        return null
      };

      // Caso o valor seja menor que o valor do nó atual, a busca continua para a esquerda, caso contrário, para a direita
      if (valor < node.valor) {
        node.esq = await deletaNode(node.esq, valor);
      } else if (valor > node.valor) {
        node.dir = await deletaNode(node.dir, valor);
      } else {
        // Caso o valor seja encontrado, ele é removido
        atualizaStatus(`REMOVIDO: ${valor}.`);

        // Caso o nó a ser exluído seja um nó folha, ele é setado para null (excluído)
        if (!node.esq && !node.dir) return null;
        // Caso o nó a ser excluído tenha apenas um filho, ele é substituído pelo filho
        if (!node.esq) return node.dir;
        if (!node.dir) return node.esq;

        // Caso o nó a ser excluído tenha dois filhos, ele é substituído pelo antecessor (maior valor da subárvore esquerda)
        const antecessor = this._findMax(node.esq);
        node.valor = antecessor.valor;
        node.esq = await deletaNode(node.esq, antecessor.valor);
      }

      // atualiza a altura do novo nó que ocupa o lugar do nó removido
      this._updateAltura(node);
      this.atualizaFatores(this.raiz);
      this.atualizaDados();

      // balanceia a arvore após a remoção
      return await this._balanceia(node, atualizaArvore, atualizaStatus);
    };

    // Chama o método interno deletaNode para remover o valor
    this.raiz = await deletaNode(this.raiz, valor);

    if (this.raiz && this.raiz.pai) this.raiz.pai = null;
    this.atualizaFatores(this.raiz);
    this.atualizaDados();
    atualizaArvore();
  }

  /* 
    PESQUISA

    A função de pesquisa encontra o valor desejado de forma recursiva e retorna o caminho percorrido.
  */
  pesquisa(valor, node = this.raiz, caminho = []) {
    // cria um novo caminho
    const novoCaminho = !node ? caminho : [...caminho, node.valor];
    
    // Caso o valor não seja encontrado, retorna o caminho mais próximo
    if (!node) return novoCaminho;

    // Caso o valor seja encontrado, retorna o caminho
    if (valor === node.valor) return novoCaminho;

    // Caso o valor seja menor que o valor do nó atual, a busca continua para a esquerda, caso contrário, para a direita
    return valor < node.valor
      ? this.pesquisa(valor, node.esq, novoCaminho)
      : this.pesquisa(valor, node.dir, novoCaminho);
  }

  /*
    BALANCEAMENTO

    A função auxiliar de balanceamento é responsável por manter a árvore balanceada após inserções e remoções.
  */
  async _balanceia(node, atualizaArvore, atualizaStatus) {
    // Inicialmente, obtem-se o fator de balanceamento do nó
    const bf = this._getFatorBalanceamento(node);

    // Caso o fator de balanceamento seja maior que 1, é necessário realizar uma rotação à direita
    if (bf > 1) {
      await atualizaArvore(); // usa-se await para esperar a arvore ser atualizada 
      let rotacaoMsg = `rotação à direita no nó ${node.valor}.`;

      // Caso o fator de balanceamento do filho à esquerda seja menor que 0, é necessário realizar uma rotação dupla
      // à esquerda e, em seguida, à direita
      if (this._getFatorBalanceamento(node.esq) < 0) {
        rotacaoMsg = `rotação à esquerda no nó ${node.esq.valor} e rotação à direita no nó ${node.valor}.`;
        node.esq = this._esqRotaciona(node.esq);
      }
      atualizaStatus(rotacaoMsg.charAt(0).toUpperCase() + rotacaoMsg.slice(1));
      alert(`Será necessário realizar ${rotacaoMsg}`);

      return this._dirRotaciona(node);
    }

    // Caso o fator de balanceamento seja menor que -1, é necessário realizar uma rotação à esquerda
    if (bf < -1) {
      await atualizaArvore(); // usa-se await para esperar a arvore ser atualizada
      let rotacaoMsg = `rotação à esquerda no nó ${node.valor}.`;

      // Caso o fator de balanceamento do filho à direita seja maior que 0, é necessário realizar uma rotação dupla
      // à direita e, em seguida, à esquerda
      if (this._getFatorBalanceamento(node.dir) > 0) {
        rotacaoMsg = `rotação à direita no nó ${node.dir.valor} e rotação à esquerda no nó ${node.valor}.`;
        node.dir = this._dirRotaciona(node.dir);
      }
      atualizaStatus(rotacaoMsg.charAt(0).toUpperCase() + rotacaoMsg.slice(1));
      alert(`Será necessário realizar ${rotacaoMsg}`);
      return this._esqRotaciona(node);
    }

    return node;
  }

  /*
    Função auxiliar que atualiza a altura do nó baseado na altura dos filhos.
    A altura de um nó é a distancia entre o nó e a folha mais distante da sua subárvore.
  */
  _updateAltura(node) {
    node.altura =
      Math.max(this._getNodeAltura(node.esq), this._getNodeAltura(node.dir)) +
      1;
  }

  // Função auxiliar que retorna a altura de um nó
  _getNodeAltura(node) {
    return node ? node.altura : -1;
  }

  // Função auxiliar que retorna o fator de balanceamento atual do nó
  _getFatorBalanceamento(node) {
    return this._getNodeAltura(node.esq) - this._getNodeAltura(node.dir);
  }

  // Função auxiliar que realiza uma rotação à esquerda
  _esqRotaciona(node) {
    const temp = node.dir;
    node.dir = temp.esq;
    if (temp.esq) temp.esq.pai = node;
    temp.esq = node;
    temp.pai = node.pai;
    node.pai = temp;
    this._updateAltura(node);
    this._updateAltura(temp);
    return temp;
  }

  // Função auxiliar que realiza uma rotação à direita
  _dirRotaciona(node) {
    const temp = node.esq;
    node.esq = temp.dir;
    if (temp.dir) temp.dir.pai = node;
    temp.dir = node;
    temp.pai = node.pai;
    node.pai = temp;
    this._updateAltura(node);
    this._updateAltura(temp);
    return temp;
  }

  // Função auxiliar que encontra o maior valor da subárvore esquerda
  _findMax(node) {
    while (node.dir) node = node.dir;
    return node;
  }

  // Função auxiliar que atualiza os fatores de balanceamento dos nós
  atualizaFatores(node) {
    if (!node) return;

    node.fator = -this._getFatorBalanceamento(node);

    this.atualizaFatores(node.esq);
    this.atualizaFatores(node.dir);
  }

  // Função auxiliar responsável por atualizar os dados da árvore para visualização em tempo real no site.
  atualizaDados() {
    const constroiDados = (node) => {
      if (!node) return null;

      return {
        valor: node.valor,
        fator: node.fator,
        children: [constroiDados(node.esq), constroiDados(node.dir)].filter(
          Boolean // Converte valores para boolean -> null se torna false
        ), // Filtra valores que são nulos
      };
    };

    if (this.raiz) {
      this.dados = constroiDados(this.raiz);
    } else {
      this.dados = {};
    }
  }
}
