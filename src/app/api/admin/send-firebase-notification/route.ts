import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GoogleAuth } from 'google-auth-library';

// Endpoint para enviar notificaciones push
export async function POST(req: NextRequest) {
  try {
    let { title, body, url, image, topics } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Título y cuerpo son requeridos' },
        { status: 400 }
      );
    }

    // Normalizar topics a array
    if (!topics || topics.length === 0) {
      topics = ['global'];
    } else if (typeof topics === 'string') {
      topics = [topics];
    }

    console.log('📩 Enviando notificación:', { title, body, topics, url });

    const supabase = createAdminClient();

    // Obtener tokens únicos de los topics seleccionados
    const { data: subscriptions, error: fetchError } = await supabase
      .from('firebase_subscriptions')
      .select('token')
      .in('topic', topics);

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No hay suscriptores para estos topics:', topics);
      return NextResponse.json({
        success: true,
        message: 'No hay suscriptores',
        sent: 0,
      });
    }

    // Eliminar duplicados
    const uniqueTokens = [...new Set(subscriptions.map((s) => s.token))];

    if (uniqueTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay tokens válidos',
        sent: 0,
      });
    }

    console.log(`📱 Enviando a ${uniqueTokens.length} dispositivos...`);

    // Obtener access token usando Google Auth
    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error('❌ No se pudo obtener access token');
      return NextResponse.json(
        { error: 'Error de autenticación con Firebase. Revisar variable FIREBASE_SERVICE_ACCOUNT en Vercel.' },
        { status: 500 }
      );
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Enviar notificación a cada token
    const sendPromises = uniqueTokens.map(async (token) => {
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title: title,
                  body: body,
                  ...(image && { image: image }),
                },
                data: {
                  url: url || '/',
                  click_action: url || undefined,
                },
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error FCM:', errorText);
        } else {
          console.log('✅ Token enviado:', token.substring(0, 20) + '...');
        }
      } catch (error) {
        console.error('❌ Error al enviar:', error);
      }
    });

    await Promise.all(sendPromises);

    console.log(`✅ Notificación enviada a ${uniqueTokens.length} dispositivos`);

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada',
      sent: uniqueTokens.length,
    });
  } catch (error) {
    console.error('Error en send-notification:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

// Cache para el token
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string | null> {
  try {
    // Verificar caché
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT no configurada');
      return null;
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error('❌ Error al parsear FIREBASE_SERVICE_ACCOUNT:', e);
      return null;
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    
    if (!accessTokenResponse.token) {
      return null;
    }

    // Cachear el token (dura 1 hora, lo reducimos a 50min)
    cachedToken = accessTokenResponse.token;
    tokenExpiry = Date.now() + (50 * 60 * 1000);

    return cachedToken;
  } catch (error) {
    console.error('Error al obtener access token:', error);
    return null;
  }
}
