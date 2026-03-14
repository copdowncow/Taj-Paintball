import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEFAULT = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
  .map((t, i) => ({ id: `d${i}`, slot_time: t, is_active: true, sort_order: i }));

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  let slots = DEFAULT;
  try {
    const { data } = await supabase.from('time_slots').select('*').eq('is_active', true).order('sort_order');
    if (data && data.length > 0) slots = data;
  } catch {}

  if (!date) return NextResponse.json(slots.map(s => ({ ...s, is_available: true })));

  let booked = new Set<string>();
  try {
    const { data } = await supabase.from('bookings').select('game_time')
      .eq('game_date', date).not('booking_status', 'eq', 'cancelled');
    booked = new Set(data?.map(b => String(b.game_time).substring(0, 5)) || []);
  } catch {}

  return NextResponse.json(slots.map(s => ({
    ...s, is_available: !booked.has(String(s.slot_time).substring(0, 5)),
  })));
}
