/**
 * TECHBANK - Entidade de Domínio: ContaBancaria
 * 
 * Implementação das Regras de Negócio:
 * RN01 — Uma conta deve possuir titular e saldo.
 * RN02 — O saldo inicial deve ser informado na criação da conta.
 * RN03 — O sistema deve permitir consultar o saldo.
 * RN04 — O sistema deve permitir realizar depósitos.
 * RN05 — Somente valores maiores que zero podem ser depositados.
 * RN06 — O sistema deve permitir realizar saques.
 * RN07 — Somente valores maiores que zero podem ser sacados.
 * RN08 — Não é permitido sacar valor superior ao saldo disponível.
 * RN09 — Operações inválidas não podem alterar o saldo da conta.
 * RN10 — A solução deve ser organizada considerando futuras ampliações.
 */

export class ContaBancaria {
  /**
   * Construtor da conta bancária.
   * Atende RN01 e RN02.
   * @param {Object} params
   * @param {string} params.id Identificador único da conta
   * @param {string} params.titular Nome completo do titular
   * @param {number|string} params.saldoInicial Saldo inicial obrigatório na criação
   * @param {string} [params.tipo='CORRENTE'] Tipo da conta (CORRENTE, POUPANCA, etc.)
   */
  constructor({ id, titular, saldoInicial, tipo = 'CORRENTE' }) {
    // RN01: Validação do titular
    if (!titular || typeof titular !== 'string' || titular.trim().length < 2) {
      throw new Error('RN01: O titular da conta é obrigatório e deve ter ao menos 2 caracteres.');
    }

    // RN02: O saldo inicial deve ser informado na criação da conta
    if (saldoInicial === undefined || saldoInicial === null || saldoInicial === '') {
      throw new Error('RN02: O saldo inicial deve ser informado na criação da conta.');
    }

    const saldoNum = Number(saldoInicial);
    if (isNaN(saldoNum) || !isFinite(saldoNum)) {
      throw new Error('RN02: O saldo inicial deve ser um valor numérico válido.');
    }

    if (saldoNum < 0) {
      throw new Error('RN02: O saldo inicial não pode ser negativo.');
    }

    this.id = id || `TB-${Math.floor(100000 + Math.random() * 900000)}`;
    this.titular = titular.trim();
    // RN01: Uma conta deve possuir saldo
    this.saldo = Number(saldoNum.toFixed(2));
    this.tipo = tipo;
    this.criadoEm = new Date().toISOString();
    this.historico = [];

    // Se houve saldo inicial positivo, registra no histórico como abertura
    if (this.saldo > 0) {
      this.historico.push({
        id: `tx_${Date.now()}_init`,
        tipo: 'ABERTURA',
        categoria: 'CREDITO',
        valor: this.saldo,
        saldoApos: this.saldo,
        descricao: 'Saldo inicial de abertura da conta',
        data: this.criadoEm,
        status: 'SUCESSO',
      });
    }
  }

  /**
   * RN03 — O sistema deve permitir consultar o saldo.
   * @returns {number} Saldo atual em formato numérico
   */
  consultarSaldo() {
    return this.saldo;
  }

  /**
   * RN03 — Retorna saldo formatado no padrão brasileiro (BRL).
   * @returns {string} Ex: "R$ 1.500,00"
   */
  consultarSaldoFormatado() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.saldo);
  }

  /**
   * RN04 & RN05 & RN09 — Realização de depósitos.
   * @param {number|string} valor Valor a ser depositado
   * @param {string} [descricao='Depósito'] Descrição opcional
   * @returns {Object} Detalhes da transação
   */
  depositar(valor, descricao = 'Depósito em conta') {
    const valorNum = Number(valor);

    // RN05 & RN09: Validação numérica e estritamente maior que zero
    if (isNaN(valorNum) || !isFinite(valorNum)) {
      // RN09: Operação inválida não altera o saldo
      throw new Error('RN05/RN09: O valor do depósito deve ser um número válido.');
    }

    if (valorNum <= 0) {
      // RN05: Somente valores maiores que zero podem ser depositados
      // RN09: Operação inválida não altera o saldo
      throw new Error('RN05: Somente valores estritamente maiores que zero podem ser depositados.');
    }

    const valorAjustado = Number(valorNum.toFixed(2));
    this.saldo = Number((this.saldo + valorAjustado).toFixed(2));

    const transacao = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: 'DEPOSITO',
      categoria: 'CREDITO',
      valor: valorAjustado,
      saldoApos: this.saldo,
      descricao: descricao?.trim() || 'Depósito em dinheiro',
      data: new Date().toISOString(),
      status: 'SUCESSO',
    };

    this.historico.unshift(transacao);

    return {
      sucesso: true,
      mensagem: `Depósito de R$ ${valorAjustado.toFixed(2)} realizado com sucesso!`,
      transacao,
      saldo: this.saldo,
    };
  }

  /**
   * RN06 & RN07 & RN08 & RN09 — Realização de saques.
   * @param {number|string} valor Valor a ser sacado
   * @param {string} [descricao='Saque'] Descrição opcional
   * @returns {Object} Detalhes da transação
   */
  sacar(valor, descricao = 'Saque em conta') {
    const valorNum = Number(valor);

    // RN07 & RN09: Validação numérica
    if (isNaN(valorNum) || !isFinite(valorNum)) {
      throw new Error('RN07/RN09: O valor do saque deve ser um número válido.');
    }

    // RN07: Somente valores maiores que zero podem ser sacados
    if (valorNum <= 0) {
      throw new Error('RN07: Somente valores estritamente maiores que zero podem ser sacados.');
    }

    const valorAjustado = Number(valorNum.toFixed(2));

    // RN08: Não é permitido sacar valor superior ao saldo disponível
    if (valorAjustado > this.saldo) {
      // RN09: Saldo permanece intacto
      throw new Error(
        `RN08: Saldo insuficiente. Saldo disponível: R$ ${this.saldo.toFixed(2)}, valor solicitado: R$ ${valorAjustado.toFixed(2)}.`
      );
    }

    this.saldo = Number((this.saldo - valorAjustado).toFixed(2));

    const transacao = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: 'SAQUE',
      categoria: 'DEBITO',
      valor: valorAjustado,
      saldoApos: this.saldo,
      descricao: descricao?.trim() || 'Saque no caixa eletrônico',
      data: new Date().toISOString(),
      status: 'SUCESSO',
    };

    this.historico.unshift(transacao);

    return {
      sucesso: true,
      mensagem: `Saque de R$ ${valorAjustado.toFixed(2)} realizado com sucesso!`,
      transacao,
      saldo: this.saldo,
    };
  }

  /**
   * Obtém histórico completo ou filtrado.
   * @param {'TODOS'|'DEPOSITO'|'SAQUE'} [filtro='TODOS']
   * @returns {Array} Lista de transações
   */
  obterExtrato(filtro = 'TODOS') {
    if (filtro === 'DEPOSITO') {
      return this.historico.filter((t) => t.tipo === 'DEPOSITO' || t.tipo === 'ABERTURA');
    }
    if (filtro === 'SAQUE') {
      return this.historico.filter((t) => t.tipo === 'SAQUE');
    }
    return [...this.historico];
  }

  /**
   * Serialização para JSON.
   */
  toJSON() {
    return {
      id: this.id,
      titular: this.titular,
      saldo: this.saldo,
      tipo: this.tipo,
      criadoEm: this.criadoEm,
      historico: this.historico,
    };
  }

  /**
   * Fábrica para reconstruir instância a partir de dados serializados.
   * @param {Object} data 
   * @returns {ContaBancaria}
   */
  static fromJSON(data) {
    const conta = new ContaBancaria({
      id: data.id,
      titular: data.titular,
      saldoInicial: 0,
      tipo: data.tipo,
    });
    conta.saldo = Number(data.saldo);
    conta.criadoEm = data.criadoEm;
    conta.historico = Array.isArray(data.historico) ? data.historico : [];
    return conta;
  }
}
