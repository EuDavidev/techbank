/**
 * TECHBANK — Entidade de Domínio: ContaBancaria
 *
 * Modelo simplificado para a disciplina de Teste de Sistemas.
 * Regras essenciais (RN01 a RN09) implementadas de forma direta e previsível.
 */

export class ContaBancaria {
  /**
   * RN01 & RN02: Criação de conta com titular e saldo inicial obrigatórios
   */
  constructor({ id, titular, saldoInicial, tipo = 'CORRENTE' }) {
    // RN01: O titular é obrigatório
    if (!titular || typeof titular !== 'string' || titular.trim().length === 0) {
      throw new Error('RN01: O titular da conta é obrigatório.');
    }

    // RN02: O saldo inicial deve ser informado e não pode ser negativo
    if (saldoInicial === undefined || saldoInicial === null || saldoInicial === '') {
      throw new Error('RN02: O saldo inicial deve ser informado na criação da conta.');
    }

    const saldoNum = Number(saldoInicial);
    if (isNaN(saldoNum) || saldoNum < 0) {
      throw new Error('RN02: O saldo inicial deve ser um valor numérico maior ou igual a zero.');
    }

    this.id = String(id || Math.floor(1000 + Math.random() * 9000));
    this.titular = titular.trim();
    this.saldo = Number(saldoNum.toFixed(2));
    this.tipo = tipo;
    this.criadoEm = new Date().toISOString();
    this.historico = [];

    // Se houver saldo inicial, registra no histórico
    if (this.saldo > 0) {
      this.historico.push({
        id: `tx_${Date.now()}_init`,
        tipo: 'ABERTURA',
        valor: this.saldo,
        saldoApos: this.saldo,
        descricao: 'Saldo inicial de abertura da conta',
        data: this.criadoEm,
      });
    }
  }

  /**
   * RN03: Consulta do saldo numérico
   */
  consultarSaldo() {
    return this.saldo;
  }

  /**
   * RN03: Consulta do saldo formatado em reais (BRL)
   */
  consultarSaldoFormatado() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.saldo);
  }

  /**
   * RN04, RN05 & RN09: Realização de depósito
   * Apenas valores estritamente maiores que zero são aceitos.
   * Operações inválidas não alteram o saldo.
   */
  depositar(valor, descricao = 'Depósito em dinheiro') {
    const valorNum = Number(valor);

    // RN05 & RN09: Validação simples > 0
    if (isNaN(valorNum) || valorNum <= 0) {
      throw new Error('RN05: Somente valores maiores que zero podem ser depositados.');
    }

    const valorAjustado = Number(valorNum.toFixed(2));
    this.saldo = Number((this.saldo + valorAjustado).toFixed(2));

    const transacao = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: 'DEPOSITO',
      valor: valorAjustado,
      saldoApos: this.saldo,
      descricao: descricao?.trim() || 'Depósito em dinheiro',
      data: new Date().toISOString(),
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
   * RN06, RN07, RN08 & RN09: Realização de saque
   * Apenas valores maiores que zero e menores ou iguais ao saldo.
   * Operações inválidas não alteram o saldo.
   */
  sacar(valor, descricao = 'Saque terminal 24h') {
    const valorNum = Number(valor);

    // RN07: Somente valores maiores que zero
    if (isNaN(valorNum) || valorNum <= 0) {
      throw new Error('RN07: Somente valores maiores que zero podem ser sacados.');
    }

    const valorAjustado = Number(valorNum.toFixed(2));

    // RN08: Não é permitido sacar valor superior ao saldo disponível
    if (valorAjustado > this.saldo) {
      throw new Error(
        `RN08: Saldo insuficiente. Saldo disponível: R$ ${this.saldo.toFixed(2)}.`
      );
    }

    this.saldo = Number((this.saldo - valorAjustado).toFixed(2));

    const transacao = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: 'SAQUE',
      valor: valorAjustado,
      saldoApos: this.saldo,
      descricao: descricao?.trim() || 'Saque terminal 24h',
      data: new Date().toISOString(),
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
   * Retorna os dados da conta em formato de objeto plano
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
   * Reconstrói instância a partir de dados salvos
   */
  static fromJSON(data) {
    const conta = new ContaBancaria({
      id: data.id,
      titular: data.titular,
      saldoInicial: 0,
      tipo: data.tipo,
    });
    conta.saldo = Number(data.saldo || 0);
    conta.criadoEm = data.criadoEm;
    conta.historico = Array.isArray(data.historico) ? data.historico : [];
    return conta;
  }
}
