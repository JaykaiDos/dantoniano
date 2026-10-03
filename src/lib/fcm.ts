/**
 * Envío de notificaciones push vía FCM HTTP v1 (lado servidor).
 *
 * Lo usan:
 *  - POST /api/admin/reactions  → llamada directa (sin fetch HTTP a la propia API)
 *  - POST /api/admin/send-firebase-notification → endpoint admin / pruebas
 *
 * SOLO para Route Handlers (usa service_role de Supabase y la service account de Firebase).
 */
import { GoogleAuth } from 'google-auth-library';
import { createAdminClient } from '@/lib/supabase/admin';

/** Dominio de producción. Se usa si el origen de la request no es confiable (ej. localhost). */
export const SITE_URL_PRODUCCION = 'https://dantoniano.online';

/** Cantidad de envíos simultáneos a FCM (evita saturar la conexión con muchos suscriptores). */
const TAMANO_LOTE = 50;

/** Tiempo máximo de espera por cada envío a FCM. */
const TIMEOUT_FCM_MS = 10_000;

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string | null;
  /** Topics a notificar. Si viene vacío se usa ['global']. */
  topics?: string[];
  /** Solo para pruebas: envía a UN token y no toca a los suscriptores. */
  onlyToken?: string;
}

export interface PushResult {
  success: boolean;
  message: string;
  /** Envíos aceptados por FCM. */
  sent: number;
  /** Envíos rechazados por FCM o con error de red. */
  failed: number;
  /** Tokens a los que se intentó enviar. */
  tokens: number;
  /** Tokens muertos (UNREGISTERED) borrados de firebase_subscriptions. */
  removed: number;
}

/** Error de configuración/infraestructura (service account, Supabase). El endpoint lo traduce a 500. */
export class PushConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PushConfigError';
  }
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

/**
 * Devuelve el origen a usar en los links del aviso.
 * Nunca devuelve localhost ni el dominio viejo: en esos casos cae al dominio de producción.
 */
export function resolverSiteUrl(origin?: string | null): string {
  if (!origin) return SITE_URL_PRODUCCION;
  try {
    const { hostname, origin: limpio } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return SITE_URL_PRODUCCION;
    if (hostname === 'dantoniano.vercel.app') return SITE_URL_PRODUCCION;
    return limpio;
  } catch {
    return SITE_URL_PRODUCCION;
  }
}

// ---------------------------------------------------------------------------
// Service account + access token
// ---------------------------------------------------------------------------

/**
 * Lee la service account desde:
 *  1. FIREBASE_SERVICE_ACCOUNT_B64 (JSON en Base64, preferida), o
 *  2. FIREBASE_SERVICE_ACCOUNT (JSON plano, la que documenta .env.example).
 * Normaliza la private_key (los "\\n" literales pasan a saltos de línea reales).
 */
function leerServiceAccount(): ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();
  const plano = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

  let json: string;
  if (b64) {
    json = Buffer.from(b64, 'base64').toString('utf-8');
  } else if (plano) {
    json = plano;
  } else {
    throw new PushConfigError(
      'Falta FIREBASE_SERVICE_ACCOUNT_B64 (o FIREBASE_SERVICE_ACCOUNT) en las variables de entorno.'
    );
  }

  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(json) as Partial<ServiceAccount>;
  } catch {
    throw new PushConfigError('La service account de Firebase no es un JSON válido.');
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new PushConfigError('La service account no tiene client_email o private_key.');
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

// Caché del access token (dura 1 h; se reutiliza ~50 min mientras la instancia siga viva)
let tokenEnCache: string | null = null;
let tokenVenceEn = 0;

async function obtenerAccessToken(): Promise<string> {
  if (tokenEnCache && Date.now() < tokenVenceEn) return tokenEnCache;

  const credenciales = leerServiceAccount();
  const auth = new GoogleAuth({
    credentials: credenciales,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  let token: string | null | undefined;
  try {
    const client = await auth.getClient();
    ({ token } = await client.getAccessToken());
  } catch (err) {
    // Mensaje corto: el error crudo de gaxios es enorme y tapa el log
    const motivo = err instanceof Error ? err.message : String(err);
    throw new PushConfigError(`No se pudo obtener el access token de Google: ${motivo}`);
  }
  if (!token) throw new PushConfigError('Google no devolvió un access token para FCM.');

  tokenEnCache = token;
  tokenVenceEn = Date.now() + 50 * 60 * 1000;
  return token;
}

// ---------------------------------------------------------------------------
// Envío
// ---------------------------------------------------------------------------

interface ErrorFcm {
  /** Código FCM legible: UNREGISTERED, SENDER_ID_MISMATCH, INVALID_ARGUMENT, etc. */
  codigo: string;
  /** Mensaje de texto del error. */
  detalle: string;
  httpStatus: number;
}

/** Extrae el detalle útil de una respuesta de error de FCM v1 (en vez de loguear `{ error: {…} }`). */
function parsearErrorFcm(httpStatus: number, texto: string): ErrorFcm {
  try {
    const json = JSON.parse(texto) as {
      error?: {
        status?: string;
        message?: string;
        details?: Array<{ errorCode?: string }>;
      };
    };
    const e = json.error;
    const codigoFcm = e?.details?.find((d) => d.errorCode)?.errorCode;
    return {
      codigo: codigoFcm || e?.status || `HTTP_${httpStatus}`,
      detalle: e?.message || texto.slice(0, 200),
      httpStatus,
    };
  } catch {
    return { codigo: `HTTP_${httpStatus}`, detalle: texto.slice(0, 200), httpStatus };
  }
}

type ResultadoEnvio = { ok: true } | { ok: false; error: ErrorFcm };

async function enviarAUnToken(
  projectId: string,
  accessToken: string,
  token: string,
  payload: PushPayload
): Promise<ResultadoEnvio> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_FCM_MS),
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: payload.title,
              body: payload.body,
              ...(payload.image && { image: payload.image }),
            },
            data: {
              url: payload.url || '/',
              ...(payload.url && { click_action: payload.url }),
            },
          },
        }),
      }
    );

    if (response.ok) return { ok: true };

    const texto = await response.text();
    return { ok: false, error: parsearErrorFcm(response.status, texto) };
  } catch (err) {
    // Error de red / timeout
    return {
      ok: false,
      error: {
        codigo: 'NETWORK_ERROR',
        detalle: err instanceof Error ? err.message : String(err),
        httpStatus: 0,
      },
    };
  }
}

/**
 * Envía una notificación a los suscriptores de los topics indicados (o a un solo token si
 * viene `onlyToken`). Devuelve contadores reales y borra los tokens UNREGISTERED.
 *
 * Lanza PushConfigError si falla la configuración o la lectura de Supabase.
 */
export async function enviarPush(payload: PushPayload): Promise<PushResult> {
  const topics = payload.topics && payload.topics.length > 0 ? payload.topics : ['global'];

  console.log('📩 Enviando notificación:', {
    title: payload.title,
    body: payload.body,
    topics: payload.onlyToken ? '(solo un token de prueba)' : topics,
    url: payload.url,
  });

  const supabase = createAdminClient();

  // 1. Resolver a qué tokens se envía
  let tokens: string[];
  if (payload.onlyToken) {
    tokens = [payload.onlyToken];
  } else {
    const { data: subscriptions, error: fetchError } = await supabase
      .from('firebase_subscriptions')
      .select('token')
      .in('topic', topics);

    // Un fallo de Supabase NO es "sin suscriptores": se informa como error real
    if (fetchError) {
      console.error('❌ Error leyendo firebase_subscriptions:', fetchError.message);
      throw new PushConfigError(`No se pudieron leer los suscriptores: ${fetchError.message}`);
    }

    tokens = [...new Set((subscriptions ?? []).map((s: { token: string }) => s.token))];
  }

  if (tokens.length === 0) {
    console.log('⚠️ No hay suscriptores para estos topics:', topics);
    return { success: true, message: 'No hay suscriptores', sent: 0, failed: 0, tokens: 0, removed: 0 };
  }

  // 2. Credenciales
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new PushConfigError('Falta NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
  }
  const accessToken = await obtenerAccessToken();

  console.log(`📱 Enviando a ${tokens.length} dispositivos...`);

  // 3. Envío por lotes
  let sent = 0;
  let failed = 0;
  const tokensMuertos: string[] = [];

  for (let i = 0; i < tokens.length; i += TAMANO_LOTE) {
    const lote = tokens.slice(i, i + TAMANO_LOTE);
    const resultados = await Promise.all(
      lote.map((token) => enviarAUnToken(projectId, accessToken, token, payload))
    );

    resultados.forEach((resultado, idx) => {
      const token = lote[idx];
      if (resultado.ok) {
        sent++;
        console.log('✅ Token enviado:', token.substring(0, 20) + '...');
      } else {
        failed++;
        const { codigo, detalle, httpStatus } = resultado.error;
        console.error(
          `❌ Error FCM [${codigo}] (HTTP ${httpStatus}) token ${token.substring(0, 20)}...: ${detalle}`
        );
        if (codigo === 'UNREGISTERED') tokensMuertos.push(token);
      }
    });
  }

  // 4. Limpiar tokens muertos (la app los desinstaló / revocó el permiso)
  let removed = 0;
  if (tokensMuertos.length > 0) {
    const { error: deleteError } = await supabase
      .from('firebase_subscriptions')
      .delete()
      .in('token', tokensMuertos);

    if (deleteError) {
      console.error('⚠️ No se pudieron borrar tokens muertos:', deleteError.message);
    } else {
      removed = tokensMuertos.length;
      console.log(`🧹 Tokens UNREGISTERED borrados: ${removed}`);
    }
  }

  console.log(
    `📨 Push "${payload.title}": ${sent}/${tokens.length} enviados, ${failed} con error, ${removed} tokens borrados`
  );

  return {
    success: true,
    message: failed === 0 ? 'Notificación enviada' : 'Notificación enviada con errores',
    sent,
    failed,
    tokens: tokens.length,
    removed,
  };
}