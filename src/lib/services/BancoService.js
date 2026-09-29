import { ContaBancaria } from '../models/ContaBancaria.js';

/**
 * TECHBANK - BancoService
 * 
 * Camada de Serviço que orquestra as operações bancárias, gerencia as contas
 * em memória e oferece uma interface limpa e expansível (RN10).
 */
export class BancoService {
  constructor() {
    this.contas = new Map();
    this.inicializarContasExemplo();
  }

  /**
   * Inicializa dados de demonstração para exibição imediata
   */
  inicializarContasExemplo() {
    this.contas.clear();

    // Conta 1: Ana Carolina Silva
    const conta1 = new ContaBancaria({
      id: 'TB-102938',
      titular: 'Ana Carolina Silva',
      saldoInicial: 2500.0,
      tipo: 'CORRENTE',
    });
    // Adiciona algumas transações simuladas para enriquecer o extrato
    conta1.depositar(750.0, 'Transferência PIX recebida');
    conta1.sacar(200.0, 'Saque terminal 24h');
    this.contas.set(conta1.id, conta1);

    // Conta 2: Carlos Eduardo Mendes
    const conta2 = new ContaBancaria({
      id: 'TB-405921',
      titular: 'Carlos Eduardo Mendes',
      saldoInicial: 12000.5,
      tipo: 'PREMIUM',
    });
    conta2.depositar(3500.0, 'Depósito de bonificação');
    conta2.sacar(1500.0, 'Pagamento fornecedor');
    this.contas.set(conta2.id, conta2);

    // Conta 3: Mariana Oliveira Costa
    const conta3 = new ContaBancaria({
      id: 'TB-783912',
      titular: 'Mariana Oliveira Costa',
      saldoInicial: 450.0,
      tipo: 'UNIVERSITARIA',
    });
    this.contas.set(conta3.id, conta3);
  }

  /**
   * Lista todas as contas cadastradas
   * @returns {Array<Object>}
   */
  listarContas() {
    return Array.from(this.contas.values()).map((conta) => conta.toJSON());
  }

  /**
   * Busca uma conta pelo ID
   * @param {string} id 
   * @returns {ContaBancaria}
   */
  buscarConta(id) {
    const conta = this.contas.get(id);
    if (!conta) {
      throw new Error(`Conta de identificador "${id}" não foi encontrada no TechBank.`);
    }
    return conta;
  }

  /**
   * RN01 & RN02: Cria uma nova conta bancária no sistema
   * @param {Object} dados
   * @param {string} dados.titular
   * @param {number|string} dados.saldoInicial
   * @param {string} [dados.tipo]
   * @returns {Object} Dados da conta criada
   */
  criarConta({ titular, saldoInicial, tipo = 'CORRENTE' }) {
    const novaConta = new ContaBancaria({
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
   * RN03: Consulta o saldo da conta
   * @param {string} idConta 
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
   * RN04 & RN05 & RN09: Realiza depósito
   * @param {string} idConta 
   * @param {number|string} valor 
   * @param {string} [descricao] 
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
   * RN06 & RN07 & RN08 & RN09: Realiza saque
   * @param {string} idConta 
   * @param {number|string} valor 
   * @param {string} [descricao] 
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
   * Extensão futura (RN10): Transferência entre contas
   * Demonstra que a arquitetura suporta novas regras de negócio facilmente.
   * @param {string} idOrigem 
   * @param {string} idDestino 
   * @param {number|string} valor 
   */
  transferir(idOrigem, idDestino, valor) {
    if (idOrigem === idDestino) {
      throw new Error('RN10: Não é possível transferir para a mesma conta.');
    }

    const contaOrigem = this.buscarConta(idOrigem);
    const contaDestino = this.buscarConta(idDestino);

    // Efetua saque na origem
    const resSaque = contaOrigem.sacar(valor, `Transferência para ${contaDestino.titular} (${contaDestino.id})`);

    // Efetua depósito no destino
    contaDestino.depositar(valor, `Transferência recebida de ${contaOrigem.titular} (${contaOrigem.id})`);

    return {
      sucesso: true,
      mensagem: `Transferência de R$ ${Number(valor).toFixed(2)} realizada com sucesso de ${contaOrigem.titular} para ${contaDestino.titular}!`,
      saldoOrigem: contaOrigem.saldo,
      contaOrigem: contaOrigem.toJSON(),
      contaDestino: contaDestino.toJSON(),
    };
  }

  /**
   * Obtém métricas e consolidação do banco
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
   * Restaura contas para o estado padrão
   */
  resetar() {
    this.inicializarContasExemplo();
    return { sucesso: true, mensagem: 'Dados reinicializados com sucesso.' };
  }
}

// Padrão Singleton para manter estado em memória no servidor Node.js
const globalForBanco = globalThis;
if (!globalForBanco.bancoServiceInstance) {
  globalForBanco.bancoServiceInstance = new BancoService();
}

export const bancoService = globalForBanco.bancoServiceInstance;
export default bancoService;
