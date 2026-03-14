import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { notifyStatusChange } from '@/bot/telegram';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { status, admin_comment } = await req.json();
  const valid = ['new','awaiting_prepayment','prepayment_review','confirmed','cancelled','completed','no_show'];
  if (!valid.includes(status)) return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });

  const upd: Record<string, unknown> = { booking_status: status, processed_by: admin.id };
  if (admin_comment) upd.admin_comment = admin_comment;
  if (status === 'confirmed') upd.confirmed_at = new Date().toISOString();
  if (status === 'cancelled') upd.cancelled_at = new Date().toISOString();
  if (['completed','no_show'].includes(status)) upd.completed_at = new Date().toISOString();

  const { data: bk } = await supabase.from('bookings').update(upd).eq('id', params.id).select().single();
  if (!bk) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  if (['completed','no_show'].includes(status)) {
    await supabase.from('games_history').insert({
      booking_id: bk.id, booking_number: bk.booking_number,
      customer_name: bk.customer_name, customer_phone: bk.customer_phone,
      game_date: bk.game_date, game_time: bk.game_time,
      players_count: bk.players_count, balls_count: bk.balls_count,
      total_price: bk.total_price, prepayment_amount: bk.prepayment_amount,
      prepayment_status: bk.prepayment_status, final_status: status,
      finished_at: new Date().toISOString(),
    });
  }

  await supabase.from('booking_logs').insert({
    booking_id: params.id, event_type: 'status_changed',
    new_value: status, description: admin_comment || status, performed_by: admin.login,
  });

  notifyStatusChange(bk, status).catch(console.error);
  return NextResponse.json(bk);
}
