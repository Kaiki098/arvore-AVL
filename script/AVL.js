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
    this.raiz = null;
    this.dados = {};
  }

  async insert(valor, atualizaArvore, atualizaStatus) {
    this.status = "";
    const insertHelper = async (node, pai = null) => {
      if (!node) {
        const newNode = new NodeArvoreAVL(valor);
        newNode.pai = pai;
        atualizaStatus(`INSERIDO: ${valor}.`);
        return newNode;
      }

      if (valor < node.valor) {
        node.esq = await insertHelper(node.esq, node);
      } else if (valor > node.valor) {
        node.dir = await insertHelper(node.dir, node);
      } else {
        atualizaStatus(`O VALOR ${valor} JÁ EXISTE.`);
        return node;
      }

      this._updateAltura(node);
      this.atualizaFatores(this.raiz);
      this.atualizaDados();

      return await this._balance(node, atualizaArvore, atualizaStatus);
    };

    this.raiz = await insertHelper(this.raiz);
    if (this.raiz.pai) this.raiz.pai = null;
    this.atualizaFatores(this.raiz);
    this.atualizaDados();
    atualizaArvore();
  }

  async delete(valor, atualizaArvore, atualizaStatus) {
    const deleteNode = async (node, valor) => {
      if (!node) {
        atualizaStatus("Nó não existe.")
        return null
      };

      if (valor < node.valor) {
        node.esq = await deleteNode(node.esq, valor);
      } else if (valor > node.valor) {
        node.dir = await deleteNode(node.dir, valor);
      } else {
        atualizaStatus(`REMOVIDO: ${valor}.`);
        if (!node.esq && !node.dir) return null;
        if (!node.esq) return node.dir;
        if (!node.dir) return node.esq;

        const antecessor = this._findMax(node.esq);
        node.valor = antecessor.valor;
        node.esq = await deleteNode(node.esq, antecessor.valor);
        atualizaStatus(`REMOVIDO: ${valor}.`);
      }

      this._updateAltura(node);
      this.atualizaFatores(this.raiz);
      this.atualizaDados();
      return await this._balance(node, atualizaArvore, atualizaStatus);
    };

    this.raiz = await deleteNode(this.raiz, valor);
    if (this.raiz && this.raiz.pai) this.raiz.pai = null;
    this.atualizaFatores(this.raiz);
    this.atualizaDados();
    atualizaArvore();
  }

  search(valor, node = this.raiz, caminho = []) {
    const novoCaminho = !node ? caminho : [...caminho, node.valor];
    if (!node) return novoCaminho;
    if (valor === node.valor) return novoCaminho;
    return valor < node.valor
      ? this.search(valor, node.esq, novoCaminho)
      : this.search(valor, node.dir, novoCaminho);
  }

  async _balance(node, atualizaArvore, atualizaStatus) {
    const bf = this._getFatorBalanceamento(node);

    if (bf > 1) {
      await atualizaArvore(); // usa-se await para esperar a arvore ser atualizada 
      let rotacaoMsg = `rotação à direita no nó ${node.valor}.`;
      if (this._getFatorBalanceamento(node.esq) < 0) {
        rotacaoMsg = `rotação à esquerda no nó ${node.esq.valor} e rotação à direita no nó ${node.valor}.`;
        node.esq = this._esqRotaciona(node.esq);
      }
      atualizaStatus(rotacaoMsg.charAt(0).toUpperCase() + rotacaoMsg.slice(1));
      alert(`Será necessário realizar ${rotacaoMsg}`);

      return this._dirRotaciona(node);
    }

    if (bf < -1) {
      await atualizaArvore(); // usa-se await para esperar a arvore ser atualizada
      let rotacaoMsg = `rotação à esquerda no nó ${node.valor}.`;
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

  _updateAltura(node) {
    node.altura =
      Math.max(this._getNodeAltura(node.esq), this._getNodeAltura(node.dir)) +
      1;
  }

  _getNodeAltura(node) {
    return node ? node.altura : -1;
  }

  _getFatorBalanceamento(node) {
    return this._getNodeAltura(node.esq) - this._getNodeAltura(node.dir);
  }

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

  _findMax(node) {
    while (node.dir) node = node.dir;
    return node;
  }

  atualizaFatores(node) {
    if (!node) return;

    node.fator = -this._getFatorBalanceamento(node);

    this.atualizaFatores(node.esq);
    this.atualizaFatores(node.dir);
  }

  atualizaDados() {
    const constroiDados = (no) => {
      if (!no) return null;

      return {
        valor: no.valor,
        fator: no.fator,
        children: [constroiDados(no.esq), constroiDados(no.dir)].filter(
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
