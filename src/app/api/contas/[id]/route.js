import { NextResponse } from 'next/server';
import { bancoService } from '@/lib/services/BancoService';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const conta = bancoService.buscarConta(id);
    return NextResponse.json({
      sucesso: true,
      conta: conta.toJSON(),
      saldo: conta.consultarSaldo(),
      saldoFormatado: conta.consultarSaldoFormatado(),
    });
  } catch (error) {
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Conta não encontrada' },
      { status: 404 }
    );
  }
}
