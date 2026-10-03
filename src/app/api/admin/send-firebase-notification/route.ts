import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enviarPush, PushConfigError } from '@/lib/fcm';

/**
 * Endpoint admin para enviar notificaciones push.
 *
 * Autenticación (cualquiera de las dos):
 *  - sesión de admin (NextAuth), o
 *  - header `Authorization: Bearer <CRON_SECRET>` (para llamadas servidor→servidor).
 *
 * Body: { title, body, url?, image?, topics?, onlyToken? }
 *  - `onlyToken`: envía a UN solo token (pruebas, no notifica a los suscriptores).
 *
 * Respuesta: { success, message, sent, failed, tokens, removed }
 */
async function estaAutorizado(req: NextRequest): Promise<boolean> {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get('authorization') === `Bearer ${secreto}`) return true;

  const session = await auth();
  return !!session;
}

export async function POST(req: NextRequest) {
  if (!(await estaAutorizado(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { title, body, url, image, topics, onlyToken } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Título y cuerpo son requeridos' }, { status: 400 });
    }

    // Normalizar topics a array
    const topicsArray: string[] =
      typeof topics === 'string' ? [topics] : Array.isArray(topics) ? topics : [];

    const result = await enviarPush({
      title,
      body,
      url,
      image,
      topics: topicsArray,
      onlyToken: typeof onlyToken === 'string' && onlyToken ? onlyToken : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PushConfigError) {
      console.error('❌ Error de configuración/lectura en push:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Error en send-notification:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}