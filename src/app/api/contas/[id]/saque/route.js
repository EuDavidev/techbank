import { NextResponse } from 'next/server';
import { bancoService } from '@/lib/services/BancoService';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { valor, descricao } = body;

    const resultado = bancoService.sacar(id, valor, descricao);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Erro ao realizar saque' },
      { status: 400 }
    );
  }
}
