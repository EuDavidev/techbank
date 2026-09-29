import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ContaBancaria } from '../src/lib/models/ContaBancaria.js';
import { BancoService } from '../src/lib/services/BancoService.js';

describe('TECHBANK - Validação Integral das Regras de Negócio (RN01 - RN10)', () => {
  // RN01: Uma conta deve possuir titular e saldo
  test('RN01 - Uma conta deve possuir titular e saldo válidos', () => {
    const conta = new ContaBancaria({
      titular: 'João Silva',
      saldoInicial: 100.0,
    });

    assert.equal(conta.titular, 'João Silva');
    assert.equal(conta.saldo, 100.0);
    assert.throws(
      () => new ContaBancaria({ titular: '', saldoInicial: 100 }),
      /RN01/
    );
  });

  // RN02: O saldo inicial deve ser informado na criação da conta
  test('RN02 - O saldo inicial deve ser informado na criação e não pode ser negativo', () => {
    assert.throws(
      () => new ContaBancaria({ titular: 'Maria Santos', saldoInicial: undefined }),
      /RN02/
    );
    assert.throws(
      () => new ContaBancaria({ titular: 'Maria Santos', saldoInicial: -50 }),
      /RN02/
    );

    const contaComZero = new ContaBancaria({
      titular: 'Maria Santos',
      saldoInicial: 0,
    });
    assert.equal(contaComZero.saldo, 0);
  });

  // RN03: O sistema deve permitir consultar o saldo
  test('RN03 - O sistema deve permitir consultar o saldo atualizado', () => {
    const conta = new ContaBancaria({
      titular: 'Carlos Lima',
      saldoInicial: 250.75,
    });

    assert.equal(conta.consultarSaldo(), 250.75);
    assert.equal(conta.consultarSaldoFormatado().includes('250,75'), true);
  });

  // RN04 & RN05: Permitir realizar depósitos; somente valores > 0
  test('RN04 & RN05 - Depósitos com valores positivos aumentam o saldo; valores <= 0 são rejeitados', () => {
    const conta = new ContaBancaria({
      titular: 'Fernanda Rocha',
      saldoInicial: 100,
    });

    const resultado = conta.depositar(50);
    assert.equal(resultado.sucesso, true);
    assert.equal(conta.consultarSaldo(), 150);

    // RN05: Somente valores maiores que zero
    assert.throws(() => conta.depositar(0), /RN05/);
    assert.throws(() => conta.depositar(-25), /RN05/);
    assert.throws(() => conta.depositar('invalido'), /RN05/);
  });

  // RN06 & RN07: Permitir realizar saques; somente valores > 0
  test('RN06 & RN07 - Saques com valores positivos deduzem o saldo; valores <= 0 são rejeitados', () => {
    const conta = new ContaBancaria({
      titular: 'Paulo Souza',
      saldoInicial: 200,
    });

    const resultado = conta.sacar(80);
    assert.equal(resultado.sucesso, true);
    assert.equal(conta.consultarSaldo(), 120);

    // RN07: Somente valores maiores que zero podem ser sacados
    assert.throws(() => conta.sacar(0), /RN07/);
    assert.throws(() => conta.sacar(-30), /RN07/);
  });

  // RN08: Não é permitido sacar valor superior ao saldo disponível
  test('RN08 - Não é permitido sacar valor superior ao saldo disponível', () => {
    const conta = new ContaBancaria({
      titular: 'Juliana Dias',
      saldoInicial: 150,
    });

    assert.throws(() => conta.sacar(150.01), /RN08/);
    assert.throws(() => conta.sacar(1000), /RN08/);
    // Saldo permanece inalterado
    assert.equal(conta.consultarSaldo(), 150);
  });

  // RN09: Operações inválidas não podem alterar o saldo da conta
  test('RN09 - Operações inválidas não alteram o saldo da conta', () => {
    const conta = new ContaBancaria({
      titular: 'Roberto Alves',
      saldoInicial: 300,
    });

    const saldoOriginal = conta.consultarSaldo();

    // Tenta depósito inválido
    try {
      conta.depositar(-100);
    } catch (e) {}
    assert.equal(conta.consultarSaldo(), saldoOriginal);

    // Tenta saque com valor maior que o saldo
    try {
      conta.sacar(500);
    } catch (e) {}
    assert.equal(conta.consultarSaldo(), saldoOriginal);

    // Tenta saque com valor negativo
    try {
      conta.sacar(-50);
    } catch (e) {}
    assert.equal(conta.consultarSaldo(), saldoOriginal);
  });

  // RN10: A solução deve ser organizada considerando futuras ampliações
  test('RN10 - Solução modular permite transferências e futuras ampliações', () => {
    const service = new BancoService();
    const { conta: c1 } = service.criarConta({ titular: 'Origem Teste', saldoInicial: 500 });
    const { conta: c2 } = service.criarConta({ titular: 'Destino Teste', saldoInicial: 200 });

    const transf = service.transferir(c1.id, c2.id, 150);
    assert.equal(transf.sucesso, true);

    const saldoC1 = service.consultarSaldo(c1.id).saldo;
    const saldoC2 = service.consultarSaldo(c2.id).saldo;

    assert.equal(saldoC1, 350);
    assert.equal(saldoC2, 350);
  });
});
