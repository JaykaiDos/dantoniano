/**
 * Obtiene una URL de subida de Doodstream para direct upload.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const key = process.env.DOODSTREAM_API_KEY;

  if (!key) {
    return NextResponse.json({ error: 'API key de Doodstream no configurada' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://doodstream.com/api/upload/server?key=${key}`,
      { cache: 'no-store' }
    );
    const data = await res.json();

    if (data.status !== 200) {
      return NextResponse.json({ error: data.msg ?? 'Error de Doodstream' }, { status: 400 });
    }

    return NextResponse.json({
      uploadUrl: data.result,
    });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo conectar con Doodstream' }, { status: 500 });
  }
}