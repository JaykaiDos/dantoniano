/**
 * Obtiene una URL de subida de Streamtape para direct upload.
 * El browser sube el archivo directo a Streamtape — no pasa por Vercel.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const login = process.env.STREAMTAPE_API_LOGIN;
  const key   = process.env.STREAMTAPE_API_KEY;

  if (!login || !key) {
    return NextResponse.json({ error: 'Credenciales de Streamtape no configuradas' }, { status: 500 });
  }

  try {
    // Paso 1: Obtener URL de subida
    const res = await fetch(
      `https://api.streamtape.com/file/ul?login=${login}&key=${key}`,
      { cache: 'no-store' }
    );
    const data = await res.json();

    if (data.status !== 200) {
      return NextResponse.json({ error: data.msg ?? 'Error de Streamtape' }, { status: 400 });
    }

    return NextResponse.json({
      uploadUrl: data.result.url,
      validUntil: data.result.valid_until,
    });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo conectar con Streamtape' }, { status: 500 });
  }
}