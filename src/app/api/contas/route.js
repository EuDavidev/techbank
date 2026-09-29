import { NextResponse } from 'next/server';
import { bancoService } from '@/lib/services/BancoService';

export async function GET() {
  try {
    const contas = bancoService.listarContas();
    const metricas = bancoService.obterMetricas();
    return NextResponse.json({ sucesso: true, contas, metricas });
  } catch (error) {
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Erro ao listar contas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { titular, saldoInicial, tipo } = body;

    const resultado = bancoService.criarConta({ titular, saldoInicial, tipo });
    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Erro ao criar conta' },
      { status: 400 }
    );
  }
}
