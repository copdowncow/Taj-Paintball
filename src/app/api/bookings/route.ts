import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyNewBooking } from '@/bot/telegram';

async function genNumber(): Promise<string> {
  try {
    const { data } = await supabase.rpc('generate_booking_number');
    if (data) return data;
  } catch {}
  try {
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true });
    return `TJP-${String((count || 0) + 1).padStart(4, '0')}`;
  } catch {}
  return `TJP-${Date.now()}`;
}

export async function GET(req: NextRequest) {
  const balls = parseInt(req.nextUrl.searchParams.get('balls') || '0');
  if (balls < 100) return NextResponse.json({ error: 'Минимум 100 шаров' }, { status: 400 });
  return NextResponse.json({ total_price: (balls / 100) * 70, prepayment_amount: 50 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, game_date, game_time,
            players_count, balls_count, customer_comment, agree_terms } = body;

    if (!customer_name?.trim()) return NextResponse.json({ error: 'Введите имя' }, { status: 400 });
    if (!customer_phone?.trim()) return NextResponse.json({ error: 'Введите телефон' }, { status: 400 });
    if (!game_date) return NextResponse.json({ error: 'Выберите дату' }, { status: 400 });
    if (!game_time) return NextResponse.json({ error: 'Выберите время' }, { status: 400 });
    if (!agree_terms) return NextResponse.json({ error: 'Необходимо согласие с условиями' }, { status: 400 });

    const [y, m, d] = game_date.split('-').map(Number);
    const gameDate = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (gameDate < today) return NextResponse.json({ error: 'Нельзя бронировать прошедшую дату' }, { status: 400 });

    const balls = parseInt(String(balls_count)) || 300;
    const players = parseInt(String(players_count)) || 1;
    const totalPrice = (balls / 100) * 70;
    const formattedTime = String(game_time).length === 5 ? `${game_time}:00` : String(game_time);
    const bookingNumber = await genNumber();

    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_number: bookingNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      game_date, game_time: formattedTime,
      players_count: players, balls_count: balls,
      price_per_100_balls: 70, total_price: totalPrice,
      prepayment_amount: 50, prepayment_status: 'pending',
      booking_status: 'awaiting_prepayment',
      customer_comment: customer_comment?.trim() || null,
    }).select().single();

    if (error) {
      console.error('Insert error:', JSON.stringify(error));
      return NextResponse.json({ error: error.message || 'Ошибка БД' }, { status: 500 });
    }

    supabase.from('booking_logs').insert({
      booking_id: booking.id, event_type: 'booking_created',
      description: 'Заявка создана через сайт', performed_by: 'client',
    }).then(undefined, console.error);

    notifyNewBooking(booking).catch(console.error);

    return NextResponse.json({
      success: true, booking_number: booking.booking_number,
      total_price: booking.total_price, prepayment_amount: booking.prepayment_amount,
    }, { status: 201 });
  } catch (e) {
    console.error('POST /api/bookings error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}
