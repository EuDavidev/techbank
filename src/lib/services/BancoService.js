import { ContaBancaria } from '../models/ContaBancaria.js';

/**
 * TECHBANK — BancoService
 *
 * Camada de serviço simplificada para facilitar a realização de testes
 * manuais na disciplina de Teste de Sistemas.
 * Contas com IDs simples ("1", "2", "3") e valores arredondados para validação rápida.
 */
export class BancoService {
  constructor() {
    this.contas = new Map();
    this.proximoId = 4;
    this.inicializarContasExemplo();
  }

  /**
   * Inicializa contas de teste simples e previsíveis para testes manuais
   */
  inicializarContasExemplo() {
    this.contas.clear();
    this.proximoId = 4;

    // Conta 1: ID 1 com Saldo R$ 1.000,00 (ideal para testar saques e depósitos)
    const conta1 = new ContaBancaria({
      id: '1',
      titular: 'João Silva',
      saldoInicial: 1000.0,
      tipo: 'CORRENTE',
    });

    // Conta 2: ID 2 com Saldo R$ 500,00 (ideal para testar transferências entre contas)
    const conta2 = new ContaBancaria({
      id: '2',
      titular: 'Maria Santos',
      saldoInicial: 500.0,
      tipo: 'POUPANCA',
    });

    // Conta 3: ID 3 com Saldo R$ 200,00
    const conta3 = new ContaBancaria({
      id: '3',
      titular: 'Carlos Oliveira',
      saldoInicial: 200.0,
      tipo: 'CORRENTE',
    });

    this.contas.set(conta1.id, conta1);
    this.contas.set(conta2.id, conta2);
    this.contas.set(conta3.id, conta3);
  }

  /**
   * Lista todas as contas cadastradas
   */
  listarContas() {
    return Array.from(this.contas.values()).map((conta) => conta.toJSON());
  }

  /**
   * Busca conta pelo identificador (aceita string ou número)
   */
  buscarConta(id) {
    const idStr = String(id).trim();
    // Busca direta ou tolerante (ex: "1" ou "TB-1")
    let conta = this.contas.get(idStr);
    if (!conta) {
      // Tenta localizar por id numérico simples se fornecido com prefixo
      const cleanId = idStr.replace(/^TB-0*/i, '');
      conta = this.contas.get(cleanId);
    }

    if (!conta) {
      throw new Error(`Conta com ID "${id}" não foi encontrada.`);
    }
    return conta;
  }

  /**
   * RN01 & RN02: Cria uma nova conta bancária
   */
  criarConta({ titular, saldoInicial, tipo = 'CORRENTE' }) {
    const id = String(this.proximoId++);
    const novaConta = new ContaBancaria({
      id,
      titular,
      saldoInicial,
      tipo,
    });

    this.contas.set(novaConta.id, novaConta);

    return {
      sucesso: true,
      mensagem: `Conta ${novaConta.id} criada com sucesso para ${novaConta.titular}!`,
      conta: novaConta.toJSON(),
    };
  }

  /**
   * RN03: Consulta de saldo
   */
  consultarSaldo(idConta) {
    const conta = this.buscarConta(idConta);
    return {
      id: conta.id,
      titular: conta.titular,
      saldo: conta.consultarSaldo(),
      saldoFormatado: conta.consultarSaldoFormatado(),
    };
  }

  /**
   * RN04 & RN05: Depósito
   */
  depositar(idConta, valor, descricao) {
    const conta = this.buscarConta(idConta);
    const resultado = conta.depositar(valor, descricao);
    return {
      ...resultado,
      conta: conta.toJSON(),
    };
  }

  /**
   * RN06, RN07 & RN08: Saque
   */
  sacar(idConta, valor, descricao) {
    const conta = this.buscarConta(idConta);
    const resultado = conta.sacar(valor, descricao);
    return {
      ...resultado,
      conta: conta.toJSON(),
    };
  }

  /**
   * RN10: Transferência simples entre duas contas
   */
  transferir(idOrigem, idDestino, valor) {
    const origId = String(idOrigem).trim();
    const destId = String(idDestino).trim();

    if (origId === destId) {
      throw new Error('RN10: Não é possível transferir para a mesma conta.');
    }

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      throw new Error('RN05: O valor da transferência deve ser maior que zero.');
    }

    const contaOrigem = this.buscarConta(origId);
    const contaDestino = this.buscarConta(destId);

    // Efetua o débito na conta de origem (valida saldo e valor)
    contaOrigem.sacar(valorNum, `Transferência enviada para ${contaDestino.titular} (Conta ${contaDestino.id})`);

    // Efetua o crédito na conta de destino
    contaDestino.depositar(valorNum, `Transferência recebida de ${contaOrigem.titular} (Conta ${contaOrigem.id})`);

    return {
      sucesso: true,
      mensagem: `Transferência de R$ ${valorNum.toFixed(2)} realizada com sucesso de ${contaOrigem.titular} para ${contaDestino.titular}!`,
      saldoOrigem: contaOrigem.saldo,
      contaOrigem: contaOrigem.toJSON(),
      contaDestino: contaDestino.toJSON(),
    };
  }

  /**
   * Métricas básicas do sistema
   */
  obterMetricas() {
    let totalCustodia = 0;
    let totalTransacoes = 0;

    for (const conta of this.contas.values()) {
      totalCustodia += conta.saldo;
      totalTransacoes += conta.historico.length;
    }

    return {
      totalContas: this.contas.size,
      totalCustodia: Number(totalCustodia.toFixed(2)),
      totalTransacoes,
    };
  }

  /**
   * Restaura o sistema para as contas de teste iniciais
   */
  resetar() {
    this.inicializarContasExemplo();
    return { sucesso: true, mensagem: 'Dados reinicializados para os valores padrão de teste.' };
  }
}

// Padrão Singleton para manter estado em memória durante o desenvolvimento
const globalForBanco = globalThis;
globalForBanco.bancoServiceInstance = new BancoService();

export const bancoService = globalForBanco.bancoServiceInstance;
export default bancoService;
