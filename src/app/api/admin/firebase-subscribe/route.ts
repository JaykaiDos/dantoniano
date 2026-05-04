import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { token, topic } = await req.json();

    if (!token || !topic) {
      return NextResponse.json(
        { error: 'Token y topic son requeridos' },
        { status: 400 }
      );
    }

    // Ignorar tokens de prueba (localhost)
    const isFakeToken = token.startsWith('fake-token-');
    if (isFakeToken) {
      console.log('🔧 Token de desarrollo detectado. No se guarda en BD.');
      return NextResponse.json({ 
        success: true, 
        message: 'Suscripción simulada (token de desarrollo)',
        isFake: true
      });
    }

    const supabase = createAdminClient();

    // Insertar o actualizar suscripción
    const { error } = await supabase
      .from('firebase_subscriptions')
      .upsert({
        token,
        topic,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'token' // Asumiendo que token es único
      });

    if (error) {
      // Si el error es de constraint (duplicado), lo ignoramos
      if (error.code === '23505') {
        console.log('Suscripción ya existente:', token);
        return NextResponse.json({ success: true, message: 'Ya suscrito' });
      }
      
      console.error('Error al guardar suscripción:', error);
      return NextResponse.json(
        { error: 'Error al guardar suscripción: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Suscripción guardada' });
  } catch (error) {
    console.error('Error en subscribe endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { token, topic } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      );
    }

    // Ignorar tokens de prueba
    const isFakeToken = token.startsWith('fake-token-');
    if (isFakeToken) {
      console.log('🔧 Token de desarrollo detectado. No se elimina de BD.');
      return NextResponse.json({ success: true, message: 'Suscripción simulada eliminada' });
    }

    const supabase = createAdminClient();

    // Eliminar suscripción
    const { error } = await supabase
      .from('firebase_subscriptions')
      .delete()
      .eq('token', token)
      .eq('topic', topic || 'global');

    if (error) {
      console.error('Error al eliminar suscripción:', error);
      return NextResponse.json(
        { error: 'Error al eliminar suscripción' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Suscripción eliminada' });
  } catch (error) {
    console.error('Error en unsubscribe endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
