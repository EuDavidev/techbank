import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ContaBancaria } from '../src/lib/models/ContaBancaria.js';
import { BancoService } from '../src/lib/services/BancoService.js';

describe('TECHBANK — Suíte de Testes Unitários Automatizados (Padrão AAA)', () => {

  // =========================================================================
  // CENÁRIOS OBRIGATÓRIOS: DEPÓSITO
  // =========================================================================
  describe('Cenários de Depósito (RN04 / RN05)', () => {

    test('1. Depósito com valor válido (atualização correta do saldo)', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 100.0;
      const valorDeposito = 50.0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'João Silva',
        saldoInicial,
      });

      // 2. Act: Execução do Método
      const resultado = conta.depositar(valorDeposito, 'Depósito em dinheiro');

      // 3. Assert: Validação do Resultado Obtido vs. Esperado
      assert.equal(resultado.sucesso, true, 'O status de sucesso deve ser true');
      assert.equal(conta.consultarSaldo(), 150.0, 'O saldo deve ser atualizado para 150.00');
      assert.equal(resultado.saldo, 150.0, 'O saldo retornado no payload deve ser 150.00');
      assert.equal(conta.historico.length, 2, 'Histórico deve registrar abertura e depósito');
    });

    test('2. Tentativa de depósito com valor zero (lançamento de exceção ou rejeição)', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 200.0;
      const valorInvalido = 0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Maria Santos',
        saldoInicial,
      });

      // 2. Act & 3. Assert: Execução e Validação de Exceção
      assert.throws(
        () => {
          conta.depositar(valorInvalido, 'Depósito de valor zero');
        },
        {
          name: 'Error',
          message: /RN05/,
        },
        'Deve lançar erro indicando violação da RN05 para valor zero'
      );

      // Validação de RN09: Saldo deve permanecer estritamente inalterado
      assert.equal(conta.consultarSaldo(), 200.0, 'Saldo deve permanecer intacto após rejeição');
    });

    test('3. Tentativa de depósito com valor negativo (validação de entrada de dados)', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 300.0;
      const valorNegativo = -50.0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Carlos Oliveira',
        saldoInicial,
      });

      // 2. Act & 3. Assert: Execução e Validação de Exceção
      assert.throws(
        () => {
          conta.depositar(valorNegativo, 'Depósito negativo');
        },
        {
          name: 'Error',
          message: /RN05/,
        },
        'Deve lançar erro indicando violação da RN05 para valor negativo'
      );

      // Validação de RN09: Saldo permanece inalterado
      assert.equal(conta.consultarSaldo(), 300.0, 'Saldo deve permanecer inalterado');
    });
  });

  // =========================================================================
  // CENÁRIOS OBRIGATÓRIOS: SAQUE
  // =========================================================================
  describe('Cenários de Saque (RN06 / RN07 / RN08)', () => {

    test('4. Saque com valor válido e saldo suficiente', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 500.0;
      const valorSaque = 150.0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Ana Lima',
        saldoInicial,
      });

      // 2. Act: Execução do Método
      const resultado = conta.sacar(valorSaque, 'Saque terminal 24h');

      // 3. Assert: Validação do Resultado Obtido vs. Esperado
      assert.equal(resultado.sucesso, true, 'O status de sucesso deve ser true');
      assert.equal(conta.consultarSaldo(), 350.0, 'O saldo deve ser atualizado para 350.00');
      assert.equal(resultado.saldo, 350.0, 'O saldo no retorno deve ser 350.00');
    });

    test('5. Saque com valor exato do saldo disponível (zerando a conta com sucesso)', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 250.0;
      const valorSaqueExato = 250.0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Roberto Alves',
        saldoInicial,
      });

      // 2. Act: Execução do Método
      const resultado = conta.sacar(valorSaqueExato, 'Saque de valor integral');

      // 3. Assert: Validação do Resultado Obtido vs. Esperado
      assert.equal(resultado.sucesso, true, 'Saque integral deve ser bem-sucedido');
      assert.equal(conta.consultarSaldo(), 0.0, 'Saldo deve ser exatamente 0.00');
      assert.equal(resultado.saldo, 0.0, 'Saldo retornado deve ser 0.00');
    });

    test('6. Tentativa de saque com valor superior ao saldo disponível (recusa por saldo insuficiente)', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 100.0;
      const valorSaqueExcessivo = 150.0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Juliana Dias',
        saldoInicial,
      });

      // 2. Act & 3. Assert: Execução e Validação de Bloqueio RN08
      assert.throws(
        () => {
          conta.sacar(valorSaqueExcessivo, 'Saque acima do limite');
        },
        {
          name: 'Error',
          message: /RN08/,
        },
        'Deve lançar erro de RN08 por saldo insuficiente'
      );

      // Validação de RN09: Saldo deve ser 100% preservado
      assert.equal(conta.consultarSaldo(), 100.0, 'Saldo original de 100.00 não pode ser debitado');
    });

    test('7. Tentativa de saque com valor zero', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 300.0;
      const valorZero = 0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Paulo Souza',
        saldoInicial,
      });

      // 2. Act & 3. Assert: Execução e Validação de Bloqueio RN07
      assert.throws(
        () => {
          conta.sacar(valorZero, 'Tentativa de saque zero');
        },
        {
          name: 'Error',
          message: /RN07/,
        },
        'Deve lançar erro de RN07 para valor de saque zero'
      );

      assert.equal(conta.consultarSaldo(), 300.0, 'Saldo permanece inalterado');
    });

    test('8. Tentativa de saque com valor negativo', () => {
      // 1. Arrange: Cenário e Dados de Entrada
      const saldoInicial = 400.0;
      const valorNegativo = -80.0;
      const conta = new ContaBancaria({
        id: '1',
        titular: 'Fernanda Rocha',
        saldoInicial,
      });

      // 2. Act & 3. Assert: Execução e Validação de Bloqueio RN07
      assert.throws(
        () => {
          conta.sacar(valorNegativo, 'Tentativa de saque negativo');
        },
        {
          name: 'Error',
          message: /RN07/,
        },
        'Deve lançar erro de RN07 para valor de saque negativo'
      );

      assert.equal(conta.consultarSaldo(), 400.0, 'Saldo permanece inalterado');
    });
  });

  // =========================================================================
  // CENÁRIOS COMPLEMENTARES: CRIAÇÃO, CONSULTA E TRANSFERÊNCIA
  // =========================================================================
  describe('Cenários Complementares de Domínio e Serviço (RN01, RN02, RN03, RN10)', () => {

    test('9. RN01 & RN02 — Criação de conta com titular e saldo inicial válidos', () => {
      // Arrange & Act
      const conta = new ContaBancaria({
        titular: 'João Silva',
        saldoInicial: 100.0,
      });

      // Assert
      assert.equal(conta.titular, 'João Silva');
      assert.equal(conta.saldo, 100.0);

      // Rejeição de titular vazio (RN01)
      assert.throws(() => new ContaBancaria({ titular: '', saldoInicial: 100 }), /RN01/);

      // Rejeição de saldo inicial não informado ou negativo (RN02)
      assert.throws(() => new ContaBancaria({ titular: 'Maria Santos', saldoInicial: undefined }), /RN02/);
      assert.throws(() => new ContaBancaria({ titular: 'Maria Santos', saldoInicial: -50 }), /RN02/);
    });

    test('10. RN03 — Consulta de saldo numérico e formatado em padrão BRL', () => {
      // Arrange
      const conta = new ContaBancaria({
        titular: 'Carlos Lima',
        saldoInicial: 250.75,
      });

      // Act & Assert
      assert.equal(conta.consultarSaldo(), 250.75);
      assert.equal(conta.consultarSaldoFormatado().includes('250,75'), true);
    });

    test('11. RN10 — Transferência entre contas com consistência atômica', () => {
      // Arrange
      const service = new BancoService();
      const { conta: c1 } = service.criarConta({ titular: 'Origem Teste', saldoInicial: 500 });
      const { conta: c2 } = service.criarConta({ titular: 'Destino Teste', saldoInicial: 200 });

      // Act
      const transf = service.transferir(c1.id, c2.id, 150);

      // Assert
      assert.equal(transf.sucesso, true);
      assert.equal(service.consultarSaldo(c1.id).saldo, 350);
      assert.equal(service.consultarSaldo(c2.id).saldo, 350);
    });
  });
});
