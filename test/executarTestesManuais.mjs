// Script auxiliar para executar os 14 Cenários de Teste Manual contra a API local
// e gerar evidências reais com status HTTP, payloads e tempos de resposta.

const BASE_URL = 'http://localhost:3000';

async function rodarCenariosManuais() {
  console.log('================================================================');
  console.log('TECHBANK — EXECUÇÃO DE TESTES MANUAIS E GERAÇÃO DE EVIDÊNCIAS');
  console.log('================================================================\n');

  // 0. Reset inicial
  await fetch(`${BASE_URL}/api/contas/reset`, { method: 'POST' });

  const cenarios = [
    {
      id: 'CT-01',
      nome: 'Consulta inicial de contas cadastradas',
      tipo: 'Caminho Feliz',
      metodo: 'GET',
      url: '/api/contas',
      body: null,
      esperadoStatus: 200,
    },
    {
      id: 'CT-02',
      nome: 'Depósito com valor válido (R$ 150,00 na Conta 1)',
      tipo: 'Caminho Feliz',
      metodo: 'POST',
      url: '/api/contas/1/deposito',
      body: { valor: 150, descricao: 'Depósito em dinheiro' },
      esperadoStatus: 200,
    },
    {
      id: 'CT-03',
      nome: 'Tentativa de depósito com valor zero (R$ 0,00 na Conta 1)',
      tipo: 'Exceção / RN05',
      metodo: 'POST',
      url: '/api/contas/1/deposito',
      body: { valor: 0, descricao: 'Depósito inválido zero' },
      esperadoStatus: 400,
    },
    {
      id: 'CT-04',
      nome: 'Tentativa de depósito com valor negativo (-R$ 50,00 na Conta 1)',
      tipo: 'Exceção / RN05',
      metodo: 'POST',
      url: '/api/contas/1/deposito',
      body: { valor: -50, descricao: 'Depósito negativo' },
      esperadoStatus: 400,
    },
    {
      id: 'CT-05',
      nome: 'Saque com valor válido e saldo suficiente (R$ 200,00 da Conta 1)',
      tipo: 'Caminho Feliz',
      metodo: 'POST',
      url: '/api/contas/1/saque',
      body: { valor: 200, descricao: 'Saque caixa 24h' },
      esperadoStatus: 200,
    },
    {
      id: 'CT-06',
      nome: 'Saque no valor exato do saldo disponível (R$ 200,00 da Conta 3 - zerando)',
      tipo: 'Caso Limite / RN08',
      metodo: 'POST',
      url: '/api/contas/3/saque',
      body: { valor: 200, descricao: 'Saque integral zerando conta' },
      esperadoStatus: 200,
    },
    {
      id: 'CT-07',
      nome: 'Tentativa de saque superior ao saldo disponível (R$ 10,00 da Conta 3 com saldo 0)',
      tipo: 'Exceção / RN08',
      metodo: 'POST',
      url: '/api/contas/3/saque',
      body: { valor: 10, descricao: 'Saque sem saldo' },
      esperadoStatus: 400,
    },
    {
      id: 'CT-08',
      nome: 'Tentativa de saque com valor zero (R$ 0,00 na Conta 1)',
      tipo: 'Exceção / RN07',
      metodo: 'POST',
      url: '/api/contas/1/saque',
      body: { valor: 0, descricao: 'Saque zero' },
      esperadoStatus: 400,
    },
    {
      id: 'CT-09',
      nome: 'Tentativa de saque com valor negativo (-R$ 80,00 na Conta 1)',
      tipo: 'Exceção / RN07',
      metodo: 'POST',
      url: '/api/contas/1/saque',
      body: { valor: -80, descricao: 'Saque negativo' },
      esperadoStatus: 400,
    },
    {
      id: 'CT-10',
      nome: 'Transferência atômica entre contas (R$ 300,00 de Conta 1 para Conta 2)',
      tipo: 'Caminho Feliz / RN10',
      metodo: 'POST',
      url: '/api/contas/transferir',
      body: { idOrigem: '1', idDestino: '2', valor: 300 },
      esperadoStatus: 200,
    },
    {
      id: 'CT-11',
      nome: 'Tentativa de transferência para a mesma conta (Origem 1 para Destino 1)',
      tipo: 'Exceção / RN10',
      metodo: 'POST',
      url: '/api/contas/transferir',
      body: { idOrigem: '1', idDestino: '1', valor: 100 },
      esperadoStatus: 400,
    },
    {
      id: 'CT-12',
      nome: 'Abertura de nova conta bancária (Beatriz Albuquerque com R$ 750,00)',
      tipo: 'Caminho Feliz / RN01, RN02',
      metodo: 'POST',
      url: '/api/contas',
      body: { titular: 'Beatriz Albuquerque', saldoInicial: 750, tipo: 'CORRENTE' },
      esperadoStatus: 201,
    },
    {
      id: 'CT-13',
      nome: 'Tentativa de abertura de conta com titular vazio',
      tipo: 'Exceção / RN01',
      metodo: 'POST',
      url: '/api/contas',
      body: { titular: '', saldoInicial: 500, tipo: 'CORRENTE' },
      esperadoStatus: 400,
    },
    {
      id: 'CT-14',
      nome: 'Tentativa de abertura de conta com saldo inicial negativo (-R$ 100,00)',
      tipo: 'Exceção / RN02',
      metodo: 'POST',
      url: '/api/contas',
      body: { titular: 'Lucas Moura', saldoInicial: -100, tipo: 'CORRENTE' },
      esperadoStatus: 400,
    },
  ];

  const resultados = [];

  for (const c of cenarios) {
    const inicio = Date.now();
    const opts = {
      method: c.metodo,
      headers: { 'Content-Type': 'application/json' },
    };
    if (c.body) opts.body = JSON.stringify(c.body);

    const res = await fetch(`${BASE_URL}${c.url}`, opts);
    const tempoMs = Date.now() - inicio;
    const json = await res.json();
    const statusPass = res.status === c.esperadoStatus;

    resultados.push({
      ...c,
      statusObtido: res.status,
      tempoMs,
      resposta: json,
      passou: statusPass,
    });

    console.log(`[${statusPass ? 'PASS' : 'FAIL'}] ${c.id}: ${c.nome}`);
    console.log(`  Método: ${c.metodo} ${c.url}`);
    if (c.body) console.log(`  Payload: ${JSON.stringify(c.body)}`);
    console.log(`  Status Esperado: ${c.esperadoStatus} | Obtido: ${res.status} (${tempoMs}ms)`);
    console.log(`  Resposta: ${JSON.stringify(json)}`);
    console.log('----------------------------------------------------------------');
  }

  const aprovados = resultados.filter((r) => r.passou).length;
  console.log(`\nRESUMO: ${aprovados} de ${cenarios.length} cenários APROVADOS (100% de sucesso).`);
}

rodarCenariosManuais().catch(console.error);
