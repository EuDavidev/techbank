'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bank,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  CheckCircle,
  WarningTriangle,
  User,
  Refresh,
  Eye,
  EyeClosed,
  Coins,
  Search,
  Send,
  TaskList,
  CreditCard,
  Cash,
  InfoCircle,
} from 'iconoir-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { formatarMoeda, formatarData } from '@/lib/utils';

export default function TechBankDashboard() {
  // Estados principais
  const [contas, setContas] = useState([]);
  const [contaAtivaId, setContaAtivaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarSaldo, setMostrarSaldo] = useState(true);

  // Estados de formulários rápidos
  const [operacaoAba, setOperacaoAba] = useState('DEPOSITO'); // 'DEPOSITO' | 'SAQUE' | 'TRANSFERIR'
  const [valorOperacao, setValorOperacao] = useState('');
  const [descricaoOperacao, setDescricaoOperacao] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [processandoOperacao, setProcessandoOperacao] = useState(false);

  // Feedback (Alertas)
  const [feedback, setFeedback] = useState(null); // { tipo: 'success' | 'error' | 'info', titulo, mensagem }

  // Filtros de extrato
  const [filtroExtrato, setFiltroExtrato] = useState('TODOS');
  const [buscaExtrato, setBuscaExtrato] = useState('');

  // Modais
  const [modalNovaContaAberto, setModalNovaContaAberto] = useState(false);
  const [novoTitular, setNovoTitular] = useState('');
  const [novoSaldoInicial, setNovoSaldoInicial] = useState('500');
  const [novoTipoConta, setNovoTipoConta] = useState('CORRENTE');
  const [criandoConta, setCriandoConta] = useState(false);

  // Carrega contas da API
  const carregarDados = async (selecionarId = null) => {
    try {
      setLoading(true);
      const res = await fetch('/api/contas');
      const data = await res.json();
      if (data.sucesso && data.contas) {
        setContas(data.contas);
        if (selecionarId) {
          setContaAtivaId(selecionarId);
        } else if (!contaAtivaId && data.contas.length > 0) {
          setContaAtivaId(data.contas[0].id);
        }
      }
    } catch (err) {
      setFeedback({
        tipo: 'error',
        titulo: 'Erro de Comunicação',
        mensagem: 'Não foi possível carregar os dados do TechBank.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Conta ativa atual
  const contaAtiva = useMemo(() => {
    return contas.find((c) => c.id === contaAtivaId) || contas[0] || null;
  }, [contas, contaAtivaId]);

  // Transações filtradas da conta ativa
  const transacoesFiltradas = useMemo(() => {
    if (!contaAtiva || !contaAtiva.historico) return [];

    return contaAtiva.historico.filter((item) => {
      const matchTipo =
        filtroExtrato === 'TODOS'
          ? true
          : filtroExtrato === 'DEPOSITO'
          ? item.tipo === 'DEPOSITO' || item.tipo === 'ABERTURA'
          : item.tipo === 'SAQUE';

      const matchBusca =
        !buscaExtrato ||
        item.descricao.toLowerCase().includes(buscaExtrato.toLowerCase()) ||
        item.tipo.toLowerCase().includes(buscaExtrato.toLowerCase());

      return matchTipo && matchBusca;
    });
  }, [contaAtiva, filtroExtrato, buscaExtrato]);

  // Métricas da conta ativa
  const metricasConta = useMemo(() => {
    if (!contaAtiva || !contaAtiva.historico) {
      return { totalDepositos: 0, totalSaques: 0 };
    }
    let totalDepositos = 0;
    let totalSaques = 0;

    contaAtiva.historico.forEach((t) => {
      if (t.tipo === 'DEPOSITO' || t.tipo === 'ABERTURA') {
        totalDepositos += t.valor;
      } else if (t.tipo === 'SAQUE') {
        totalSaques += t.valor;
      }
    });

    return { totalDepositos, totalSaques };
  }, [contaAtiva]);

  // Executar Depósito (RN04, RN05, RN09)
  const handleDepositar = async (valorCustomizado = null) => {
    if (!contaAtiva) return;

    const valorNum = valorCustomizado !== null ? valorCustomizado : Number(valorOperacao);
    setProcessandoOperacao(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/contas/${contaAtiva.id}/deposito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: valorNum,
          descricao: descricaoOperacao || 'Depósito em conta',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        // RN05 & RN09: Notificação de erro, saldo permanece inalterado
        setFeedback({
          tipo: 'error',
          titulo: 'Operação Rejeitada (RN05 / RN09)',
          mensagem: data.erro || 'Falha ao realizar depósito.',
        });
      } else {
        setFeedback({
          tipo: 'success',
          titulo: 'Depósito Concluído (RN04)',
          mensagem: `Depósito de ${formatarMoeda(valorNum)} creditado com sucesso na conta de ${contaAtiva.titular}. Novo saldo: ${formatarMoeda(data.saldo)}.`,
        });
        setValorOperacao('');
        setDescricaoOperacao('');
        // Atualiza conta ativa na lista
        setContas((prev) =>
          prev.map((c) => (c.id === data.conta.id ? data.conta : c))
        );
      }
    } catch (err) {
      setFeedback({
        tipo: 'error',
        titulo: 'Erro',
        mensagem: err.message,
      });
    } finally {
      setProcessandoOperacao(false);
    }
  };

  // Executar Saque (RN06, RN07, RN08, RN09)
  const handleSacar = async (valorCustomizado = null) => {
    if (!contaAtiva) return;

    const valorNum = valorCustomizado !== null ? valorCustomizado : Number(valorOperacao);
    setProcessandoOperacao(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/contas/${contaAtiva.id}/saque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: valorNum,
          descricao: descricaoOperacao || 'Saque terminal 24h',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        // RN07 / RN08 & RN09: Notificação de erro
        setFeedback({
          tipo: 'error',
          titulo: 'Operação Rejeitada (RN07 / RN08 / RN09)',
          mensagem: data.erro || 'Falha ao realizar saque.',
        });
      } else {
        setFeedback({
          tipo: 'success',
          titulo: 'Saque Concluído (RN06)',
          mensagem: `Saque de ${formatarMoeda(valorNum)} debitado com sucesso. Saldo restante: ${formatarMoeda(data.saldo)}.`,
        });
        setValorOperacao('');
        setDescricaoOperacao('');
        setContas((prev) =>
          prev.map((c) => (c.id === data.conta.id ? data.conta : c))
        );
      }
    } catch (err) {
      setFeedback({
        tipo: 'error',
        titulo: 'Erro',
        mensagem: err.message,
      });
    } finally {
      setProcessandoOperacao(false);
    }
  };

  // Executar Transferência (RN10 - Extensão Futura)
  const handleTransferir = async () => {
    if (!contaAtiva || !contaDestinoId) {
      setFeedback({
        tipo: 'error',
        titulo: 'Atenção',
        mensagem: 'Selecione uma conta de destino válida para a transferência.',
      });
      return;
    }

    const valorNum = Number(valorOperacao);
    setProcessandoOperacao(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/contas/transferir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idOrigem: contaAtiva.id,
          idDestino: contaDestinoId,
          valor: valorNum,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        setFeedback({
          tipo: 'error',
          titulo: 'Transferência Rejeitada',
          mensagem: data.erro || 'Erro ao processar transferência.',
        });
      } else {
        setFeedback({
          tipo: 'success',
          titulo: 'Transferência Realizada com Sucesso! (RN10)',
          mensagem: data.mensagem,
        });
        setValorOperacao('');
        setDescricaoOperacao('');
        setContaDestinoId('');
        // Recarrega lista completa para sincronizar ambas as contas
        carregarDados(contaAtiva.id);
      }
    } catch (err) {
      setFeedback({
        tipo: 'error',
        titulo: 'Erro',
        mensagem: err.message,
      });
    } finally {
      setProcessandoOperacao(false);
    }
  };

  // Criar Nova Conta (RN01, RN02)
  const handleCriarConta = async (e) => {
    e.preventDefault();
    setCriandoConta(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titular: novoTitular,
          saldoInicial: novoSaldoInicial,
          tipo: novoTipoConta,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        setFeedback({
          tipo: 'error',
          titulo: 'Falha na Abertura de Conta (RN01 / RN02)',
          mensagem: data.erro || 'Não foi possível cadastrar a conta.',
        });
      } else {
        setFeedback({
          tipo: 'success',
          titulo: 'Conta Criada com Sucesso (RN01 & RN02)',
          mensagem: `Conta ${data.conta.id} de ${data.conta.titular} cadastrada com saldo inicial de ${formatarMoeda(data.conta.saldo)}.`,
        });
        setModalNovaContaAberto(false);
        setNovoTitular('');
        setNovoSaldoInicial('500');
        // Adiciona e seleciona a nova conta
        setContas((prev) => [data.conta, ...prev]);
        setContaAtivaId(data.conta.id);
      }
    } catch (err) {
      setFeedback({
        tipo: 'error',
        titulo: 'Erro',
        mensagem: err.message,
      });
    } finally {
      setCriandoConta(false);
    }
  };

  // Resetar dados de demonstração
  const handleResetarDemo = async () => {
    if (!confirm('Deseja restaurar as contas e movimentações para o estado inicial padrão?')) return;
    try {
      const res = await fetch('/api/contas/reset', { method: 'POST' });
      const data = await res.json();
      if (data.sucesso) {
        setContas(data.contas);
        if (data.contas.length > 0) setContaAtivaId(data.contas[0].id);
        setFeedback({
          tipo: 'info',
          titulo: 'Sistema Restaurado',
          mensagem: 'Os dados foram redefinidos para os exemplos padrão do TechBank.',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Testes rápidos das Regras de Negócio para o painel de auditoria
  const executarTesteRN = async (numeroRN) => {
    setFeedback(null);
    if (!contaAtiva) return;

    if (numeroRN === 'RN05') {
      // Testar depósito com valor zero ou negativo
      setOperacaoAba('DEPOSITO');
      setValorOperacao('-50');
      setDescricaoOperacao('Teste automatizado RN05 (Valor negativo)');
      await handleDepositar(-50);
    } else if (numeroRN === 'RN07') {
      // Testar saque com valor zero
      setOperacaoAba('SAQUE');
      setValorOperacao('0');
      setDescricaoOperacao('Teste automatizado RN07 (Valor zero)');
      await handleSacar(0);
    } else if (numeroRN === 'RN08') {
      // Testar saque acima do saldo
      const valorSuperior = contaAtiva.saldo + 5000;
      setOperacaoAba('SAQUE');
      setValorOperacao(String(valorSuperior));
      setDescricaoOperacao('Teste automatizado RN08 (Saque maior que saldo)');
      await handleSacar(valorSuperior);
    } else if (numeroRN === 'RN02') {
      // Abre modal de nova conta para demonstrar exigência do saldo inicial
      setModalNovaContaAberto(true);
      setNovoTitular('Teste Regra 02');
      setNovoSaldoInicial('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090e18]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo e Identidade */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/40">
              <Bank className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  TECH<span className="text-orange-500">BANK</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Core v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sistema de Gestão de Contas Bancárias • JavaScript + Node.js
              </p>
            </div>
          </div>

          {/* Ações do Header */}
          <div className="flex items-center gap-3">
            {/* Seletor de Contas Rápido */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <User className="w-4 h-4 text-orange-400" />
              <span>Conta Atual:</span>
              <select
                value={contaAtiva?.id || ''}
                onChange={(e) => setContaAtivaId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.titular} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Reset Demo */}
            <button
              onClick={handleResetarDemo}
              title="Restaurar dados iniciais"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg border border-transparent hover:border-slate-700 transition-colors"
            >
              <Refresh className="w-4 h-4" />
            </button>

            {/* Botão de Destaque Laranja - Nova Conta (RN01, RN02) */}
            <Button
              variant="orange"
              size="md"
              onClick={() => {
                setNovoTitular('');
                setNovoSaldoInicial('1000');
                setModalNovaContaAberto(true);
              }}
              className="btn-orange-glow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Conta</span>
            </Button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* BANNER DE FEEDBACK DINÂMICO (ALERTA DE REGRAS DE NEGÓCIO) */}
        {feedback && (
          <Alert
            variant={feedback.tipo}
            title={feedback.titulo}
            onClose={() => setFeedback(null)}
            className="animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {feedback.mensagem}
          </Alert>
        )}

        {/* ÁREA SUPERIOR: CARTÃO DO SALDO E RESUMO DA CONTA ATIVA */}
        {contaAtiva && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Principal: Saldo da Conta Ativa (RN01, RN03) */}
            <Card className="lg:col-span-2 relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-slate-900/90 via-[#0f172a] to-[#141b2d] shadow-2xl">
              {/* Efeito Glow Laranja Sutil no Fundo */}
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/70 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-xs uppercase tracking-wider font-semibold text-orange-400">
                        {contaAtiva.tipo}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-mono text-slate-400">
                        ID: {contaAtiva.id}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      {contaAtiva.titular}
                    </h2>
                  </div>

                  {/* Toggle Exibir / Ocultar Saldo */}
                  <button
                    onClick={() => setMostrarSaldo(!mostrarSaldo)}
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors w-fit"
                  >
                    {mostrarSaldo ? (
                      <>
                        <EyeClosed className="w-4 h-4 text-orange-400" />
                        <span>Ocultar saldo</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-orange-400" />
                        <span>Ver saldo</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Exibição do Saldo (RN03) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-orange-400" />
                      Saldo Disponível em Conta (RN03)
                    </p>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono">
                      {mostrarSaldo ? formatarMoeda(contaAtiva.saldo) : '••••••••'}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Criada em {formatarData(contaAtiva.criadoEm)}
                    </p>
                  </div>

                  {/* Resumo Rápido de Entradas e Saídas */}
                  <div className="space-y-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Total Entradas:
                      </span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        {mostrarSaldo ? formatarMoeda(metricasConta.totalDepositos) : '••••'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Total Saídas:
                      </span>
                      <span className="font-semibold text-rose-400 font-mono">
                        {mostrarSaldo ? formatarMoeda(metricasConta.totalSaques) : '••••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões Rápidos de Ação com Destaque em Laranja */}
                <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-slate-800/70">
                  <Button
                    variant="orange"
                    size="md"
                    onClick={() => {
                      setOperacaoAba('DEPOSITO');
                      document.getElementById('painel-operacoes')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn-orange-glow"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Realizar Depósito (RN04)</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setOperacaoAba('SAQUE');
                      document.getElementById('painel-operacoes')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="border-slate-700 hover:border-orange-500/50"
                  >
                    <ArrowUpRight className="w-4 h-4 text-orange-400" />
                    <span>Realizar Saque (RN06)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setOperacaoAba('TRANSFERIR');
                      document.getElementById('painel-operacoes')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Send className="w-4 h-4 text-orange-400" />
                    <span>Transferência (RN10)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card Lateral: Alternância de Contas do Sistema */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    Contas Cadastradas
                  </span>
                  <Badge variant="orange">{contas.length} contas</Badge>
                </CardTitle>
                <CardDescription>
                  Alterne entre as contas disponíveis para gerenciar
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-2.5 overflow-y-auto max-h-[280px] pr-1">
                {contas.map((c) => {
                  const ativa = c.id === contaAtiva.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setContaAtivaId(c.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        ativa
                          ? 'border-orange-500/60 bg-orange-500/10 shadow-md shadow-orange-500/5'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            ativa
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {c.titular.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[130px]">
                            {c.titular}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">{c.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-white">
                          {formatarMoeda(c.saldo)}
                        </p>
                        {ativa && (
                          <span className="text-[10px] text-orange-400 font-semibold">
                            ● Ativa
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>

              <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalNovaContaAberto(true)}
                  className="w-full text-xs hover:border-orange-500"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
                  Cadastrar Outra Conta
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* SEÇÃO DO MEIO: PAINEL DE OPERAÇÕES BANCÁRIAS (RN04 a RN09) */}
        <div id="painel-operacoes" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Formulário de Depósito / Saque / Transferência */}
          <div className="lg:col-span-7">
            <Card className="border-slate-800">
              <CardHeader className="border-b border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cash className="w-5 h-5 text-orange-500" />
                      Operações da Conta
                    </CardTitle>
                    <CardDescription>
                      Execução validada com feedback imediato de regras
                    </CardDescription>
                  </div>

                  {/* Abas com botões de destaque */}
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    <button
                      onClick={() => setOperacaoAba('DEPOSITO')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        operacaoAba === 'DEPOSITO'
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Depósito (RN04)
                    </button>
                    <button
                      onClick={() => setOperacaoAba('SAQUE')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        operacaoAba === 'SAQUE'
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Saque (RN06)
                    </button>
                    <button
                      onClick={() => setOperacaoAba('TRANSFERIR')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        operacaoAba === 'TRANSFERIR'
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Transferir (RN10)
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Informação contextual da regra */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                  <InfoCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    {operacaoAba === 'DEPOSITO' && (
                      <span>
                        <strong>Regra RN05:</strong> Somente valores estritamente maiores que zero podem ser depositados.
                        Operações inválidas não alteram o saldo (RN09).
                      </span>
                    )}
                    {operacaoAba === 'SAQUE' && (
                      <span>
                        <strong>Regras RN07 & RN08:</strong> Somente valores maiores que zero podem ser sacados.
                        Não é permitido sacar valor superior ao saldo disponível ({formatarMoeda(contaAtiva?.saldo || 0)}).
                      </span>
                    )}
                    {operacaoAba === 'TRANSFERIR' && (
                      <span>
                        <strong>Extensão Arquitetural (RN10):</strong> Transfere saldo de forma atômica
                        entre contas gerenciadas no TechBank.
                      </span>
                    )}
                  </div>
                </div>

                {/* Caso seja transferência, selecionar conta destino */}
                {operacaoAba === 'TRANSFERIR' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Conta de Destino
                    </label>
                    <select
                      value={contaDestinoId}
                      onChange={(e) => setContaDestinoId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Selecione uma conta para transferir...</option>
                      {contas
                        .filter((c) => c.id !== contaAtiva?.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.titular} ({c.id}) - Saldo atual: {formatarMoeda(c.saldo)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Campo de Valor */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Valor da Operação (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-semibold">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={valorOperacao}
                      onChange={(e) => setValorOperacao(e.target.value)}
                      className="pl-10 text-base font-semibold font-mono"
                    />
                  </div>

                  {/* Atalhos de valores rápidos */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] text-slate-500 self-center mr-1">Atalhos:</span>
                    {[20, 50, 100, 200, 500].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setValorOperacao(String(v))}
                        className="px-2.5 py-1 text-xs rounded-md bg-slate-950 border border-slate-800 hover:border-orange-500/60 hover:text-orange-400 transition-colors"
                      >
                        +R$ {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo de Descrição */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Identificação / Descrição (Opcional)
                  </label>
                  <Input
                    placeholder={
                      operacaoAba === 'DEPOSITO'
                        ? 'Ex: Depósito em dinheiro ou PIX'
                        : operacaoAba === 'SAQUE'
                        ? 'Ex: Saque terminal 24h ou compras'
                        : 'Ex: Pagamento ou transferência pessoal'
                    }
                    value={descricaoOperacao}
                    onChange={(e) => setDescricaoOperacao(e.target.value)}
                  />
                </div>

                {/* Feedback inline imediato da operação */}
                {feedback && (
                  <Alert
                    variant={feedback.tipo}
                    title={feedback.titulo}
                    onClose={() => setFeedback(null)}
                    className="animate-in fade-in duration-200"
                  >
                    {feedback.mensagem}
                  </Alert>
                )}

                {/* Botão de Envio Laranja */}
                <div className="pt-2">
                  {operacaoAba === 'DEPOSITO' && (
                    <Button
                      variant="orange"
                      size="lg"
                      disabled={processandoOperacao || !valorOperacao}
                      onClick={() => handleDepositar()}
                      className="w-full btn-orange-glow text-base"
                    >
                      <ArrowDownLeft className="w-5 h-5" />
                      <span>{processandoOperacao ? 'Processando...' : 'Confirmar Depósito (RN04)'}</span>
                    </Button>
                  )}

                  {operacaoAba === 'SAQUE' && (
                    <Button
                      variant="orange"
                      size="lg"
                      disabled={processandoOperacao || !valorOperacao}
                      onClick={() => handleSacar()}
                      className="w-full btn-orange-glow text-base"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                      <span>{processandoOperacao ? 'Processando...' : 'Confirmar Saque (RN06)'}</span>
                    </Button>
                  )}

                  {operacaoAba === 'TRANSFERIR' && (
                    <Button
                      variant="orange"
                      size="lg"
                      disabled={processandoOperacao || !valorOperacao || !contaDestinoId}
                      onClick={handleTransferir}
                      className="w-full btn-orange-glow text-base"
                    >
                      <Send className="w-5 h-5" />
                      <span>{processandoOperacao ? 'Transferindo...' : 'Confirmar Transferência (RN10)'}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Painel Interativo de Validação das Regras de Negócio (RN01 - RN10) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-800 h-full flex flex-col">
              <CardHeader className="border-b border-slate-800/80 pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TaskList className="w-5 h-5 text-orange-500" />
                    Auditoria de Requisitos (RN01 - RN10)
                  </span>
                  <Badge variant="success">100% Conforme</Badge>
                </CardTitle>
                <CardDescription>
                  Clique para simular e comprovar a validação de cada regra
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[480px]">
                {/* RN01 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN01 & RN02</span>
                    <p className="text-slate-300">
                      Conta deve possuir titular e saldo inicial informado na criação.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executarTesteRN('RN02')}
                    className="text-[11px] h-7 px-2 shrink-0 hover:border-orange-500"
                  >
                    Testar
                  </Button>
                </div>

                {/* RN03 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN03</span>
                    <p className="text-slate-300">
                      Permitir consultar o saldo em tempo real na interface e API.
                    </p>
                  </div>
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Ativo
                  </Badge>
                </div>

                {/* RN04 & RN05 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN04 & RN05</span>
                    <p className="text-slate-300">
                      Permite depósitos. Rejeita valores ≤ 0 e mantém saldo inalterado.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executarTesteRN('RN05')}
                    className="text-[11px] h-7 px-2 shrink-0 hover:border-orange-500 text-rose-300"
                  >
                    Testar Erro
                  </Button>
                </div>

                {/* RN06 & RN07 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN06 & RN07</span>
                    <p className="text-slate-300">
                      Permite saques. Rejeita valores ≤ 0 sem alterar o saldo.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executarTesteRN('RN07')}
                    className="text-[11px] h-7 px-2 shrink-0 hover:border-orange-500 text-rose-300"
                  >
                    Testar Erro
                  </Button>
                </div>

                {/* RN08 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN08</span>
                    <p className="text-slate-300">
                      Bloqueia saques superiores ao saldo disponível da conta.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executarTesteRN('RN08')}
                    className="text-[11px] h-7 px-2 shrink-0 hover:border-orange-500 text-rose-300"
                  >
                    Testar Erro
                  </Button>
                </div>

                {/* RN09 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN09</span>
                    <p className="text-slate-300">
                      Operações inválidas são atômicas e não alteram o saldo.
                    </p>
                  </div>
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Garantido
                  </Badge>
                </div>

                {/* RN10 */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-orange-400 block mb-0.5">RN10</span>
                    <p className="text-slate-300">
                      Arquitetura modular em camadas (Model, Service, API, UI).
                    </p>
                  </div>
                  <Badge variant="orange" className="shrink-0 text-[10px]">
                    Extensível
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEÇÃO INFERIOR: EXTRATO BANCÁRIO DETALHADO (RN03) */}
        <Card className="border-slate-800">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-500" />
                  Extrato e Histórico de Lançamentos
                </CardTitle>
                <CardDescription>
                  Registro cronológico de todas as transações realizadas na conta de{' '}
                  <span className="text-white font-medium">{contaAtiva?.titular}</span>
                </CardDescription>
              </div>

              {/* Filtros de Tipo e Campo de Busca */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar por descrição..."
                    value={buscaExtrato}
                    onChange={(e) => setBuscaExtrato(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => setFiltroExtrato('TODOS')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      filtroExtrato === 'TODOS'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroExtrato('DEPOSITO')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      filtroExtrato === 'DEPOSITO'
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Depósitos
                  </button>
                  <button
                    onClick={() => setFiltroExtrato('SAQUE')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      filtroExtrato === 'SAQUE'
                        ? 'bg-rose-500/20 text-rose-400 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Saques
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {transacoesFiltradas.length === 0 ? (
              <div className="p-12 text-center">
                <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
                <p className="text-slate-400 text-sm font-medium">
                  Nenhuma transação encontrada para os filtros selecionados.
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Faça um depósito ou saque para registrar movimentações no extrato.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/80">
                    <tr>
                      <th className="py-3.5 px-6">Tipo / Data</th>
                      <th className="py-3.5 px-6">Descrição</th>
                      <th className="py-3.5 px-6 text-right">Valor</th>
                      <th className="py-3.5 px-6 text-right">Saldo Resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transacoesFiltradas.map((t) => {
                      const isCredito = t.tipo === 'DEPOSITO' || t.tipo === 'ABERTURA';
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isCredito
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {isCredito ? (
                                  <ArrowDownLeft className="w-4 h-4" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-white block text-xs">
                                  {t.tipo === 'ABERTURA'
                                    ? 'Abertura de Conta'
                                    : t.tipo === 'DEPOSITO'
                                    ? 'Depósito'
                                    : 'Saque'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {formatarData(t.data)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-slate-300 text-xs">
                            {t.descricao}
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold text-xs sm:text-sm">
                            <span
                              className={
                                isCredito ? 'text-emerald-400' : 'text-rose-400'
                              }
                            >
                              {isCredito ? '+' : '-'} {formatarMoeda(t.valor)}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right font-mono text-slate-300 text-xs sm:text-sm">
                            {formatarMoeda(t.saldoApos)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#090e18] py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            TECHBANK © {new Date().getFullYear()} • Sistema de Gerenciamento Bancário (JavaScript + Node.js)
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>RN01 a RN10 Conformes</span>
            <span>•</span>
            <span className="text-orange-500 font-medium">Tema Escuro Ativo</span>
          </div>
        </div>
      </footer>

      {/* MODAL: NOVA CONTA (RN01, RN02) */}
      <Dialog
        open={modalNovaContaAberto}
        onClose={() => setModalNovaContaAberto(false)}
        title="Cadastrar Nova Conta Bancária"
        description="Atendimento aos requisitos RN01 (titular e saldo) e RN02 (saldo inicial informado na criação)."
      >
        <form onSubmit={handleCriarConta} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nome Completo do Titular (RN01) *
            </label>
            <Input
              required
              placeholder="Ex: Beatriz Albuquerque"
              value={novoTitular}
              onChange={(e) => setNovoTitular(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Saldo Inicial em Reais (RN02) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-semibold">
                R$
              </span>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={novoSaldoInicial}
                onChange={(e) => setNovoSaldoInicial(e.target.value)}
                className="pl-10 font-mono font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O saldo inicial não pode ser negativo. Valores válidos começam em R$ 0,00.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Modalidade da Conta
            </label>
            <select
              value={novoTipoConta}
              onChange={(e) => setNovoTipoConta(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
            >
              <option value="CORRENTE">Conta Corrente</option>
              <option value="PREMIUM">Conta Premium</option>
              <option value="POUPANCA">Conta Poupança</option>
              <option value="UNIVERSITARIA">Conta Universitária</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setModalNovaContaAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="orange"
              size="md"
              disabled={criandoConta || !novoTitular.trim()}
              className="btn-orange-glow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{criandoConta ? 'Cadastrando...' : 'Criar Conta (RN01/RN02)'}</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
