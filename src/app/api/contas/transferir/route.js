import { NextResponse } from 'next/server';
import { bancoService } from '@/lib/services/BancoService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { idOrigem, idDestino, valor } = body;

    const resultado = bancoService.transferir(idOrigem, idDestino, valor);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Erro ao realizar transferência' },
      { status: 400 }
    );
  }
}
