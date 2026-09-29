import { NextResponse } from 'next/server';
import { bancoService } from '@/lib/services/BancoService';

export async function POST() {
  try {
    const resultado = bancoService.resetar();
    const contas = bancoService.listarContas();
    return NextResponse.json({ ...resultado, contas }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Erro ao reiniciar dados' },
      { status: 500 }
    );
  }
}
