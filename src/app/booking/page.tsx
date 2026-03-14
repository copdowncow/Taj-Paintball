'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TimeSlot { id: string; slot_time: string; is_available: boolean; }

const BALLS_OPTIONS = [
  { balls: 100, price: 70 },
  { balls: 200, price: 140 },
  { balls: 300, price: 210 },
  { balls: 500, price: 350 },
  { balls: 700, price: 490 },
  { balls: 1000, price: 700 },
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    booking_number: string; total_price: number; prepayment_amount: number;
  } | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    game_date: '', game_time: '',
    customer_name: '', customer_phone: '',
    players_count: 4, balls_count: 300,
    customer_comment: '', agree_terms: false,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const totalPrice = (form.balls_count / 100) * 70;
  const prepayment = 50;

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const loadSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    const defaultSlots = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
      .map((t, i) => ({ id: `d-${i}`, slot_time: t, is_available: true }));
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();
      setSlots(Array.isArray(data) && data.length > 0 ? data : defaultSlots);
    } catch {
      setSlots(defaultSlots);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (form.game_date) { set('game_time', ''); loadSlots(form.game_date); }
  }, [form.game_date, loadSlots]);

  const handleSubmit = async () => {
    setError('');
    if (!form.agree_terms) { setError('Необходимо согласие с условиями'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка'); return; }
      setSuccess(data);
    } catch {
      setError('Ошибка соединения');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (success) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-black text-white mb-2">Заявка принята!</h1>
          <p className="text-neutral-400 text-sm">Номер брони: <span className="text-orange-400 font-black">{success.booking_number}</span></p>
        </div>

        {/* Статус */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">1</div>
            <div>
              <p className="text-white font-semibold text-sm">Заявка создана</p>
              <p className="text-green-400 text-xs">✓ Выполнено</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">2</div>
            <div>
              <p className="text-white font-semibold text-sm">Внесите предоплату</p>
              <p className="text-yellow-400 text-xs font-bold">{success.prepayment_amount} сомони — ожидается</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-500 font-bold text-sm flex-shrink-0">3</div>
            <div>
              <p className="text-neutral-500 font-semibold text-sm">Бронь подтверждена</p>
              <p className="text-neutral-600 text-xs">После получения предоплаты</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-4">
          <p className="text-orange-300 text-sm leading-relaxed font-medium mb-2">
            💰 Как внести предоплату {success.prepayment_amount} сомони:
          </p>
          <p className="text-neutral-300 text-sm leading-relaxed">
            Переведите на номер <strong>+992 50 213 14 15</strong> или оплатите при визите до начала игры. Администратор подтвердит бронь после получения оплаты.
          </p>
        </div>

        <div className="card p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Итого:</span>
            <span className="text-white font-bold">{success.total_price} сомони</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Предоплата:</span>
            <span className="text-orange-400 font-bold">{success.prepayment_amount} сомони</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Остаток:</span>
            <span className="text-neutral-300">{success.total_price - success.prepayment_amount} сомони</span>
          </div>
        </div>

        <a href="tel:+992502131415"
          className="flex items-center justify-center gap-2 w-full bg-green-600 active:bg-green-700 text-white font-bold py-4 rounded-2xl text-base mb-3"
          style={{ WebkitTapHighlightColor: 'transparent' }}>
          📞 Позвонить администратору
        </a>
        <Link href="/" className="btn-secondary w-full py-3 rounded-2xl text-sm block text-center">← На главную</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-neutral-400 text-xl p-1" style={{ WebkitTapHighlightColor: 'transparent' }}>←</Link>
        <div className="flex-1">
          <h1 className="text-base font-black text-white">Бронирование</h1>
          <div className="flex gap-1 mt-1">
            {[1,2,3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-orange-500' : 'bg-neutral-700'}`} />
            ))}
          </div>
        </div>
        <span className="text-neutral-500 text-sm">{step}/3</span>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white mb-1">Выберите дату и время</h2>
              <p className="text-neutral-500 text-sm">Доступно на 30 дней вперёд</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Дата игры *</label>
              <input type="date" min={minDate} max={maxDate} value={form.game_date}
                onChange={e => set('game_date', e.target.value)}
                className="input-field" style={{ colorScheme: 'dark' }} />
              {form.game_date && (
                <p className="text-orange-400 text-sm mt-2">
                  📅 {new Date(form.game_date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}
                </p>
              )}
            </div>

            {form.game_date && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-3">Время *</label>
                {slotsLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-neutral-800 rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => {
                      const time = String(slot.slot_time).substring(0, 5);
                      const selected = form.game_time === time;
                      return (
                        <button key={slot.id} disabled={!slot.is_available}
                          onClick={() => set('game_time', time)}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          className={[
                            'py-3 rounded-xl text-sm font-bold transition-all',
                            !slot.is_available ? 'bg-neutral-800/40 text-neutral-600 line-through cursor-not-allowed' :
                            selected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                            'bg-neutral-800 text-neutral-200 active:bg-neutral-700'
                          ].join(' ')}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
                {form.game_time && <p className="text-green-400 text-sm mt-2">✓ Выбрано: {form.game_time}</p>}
              </div>
            )}

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

            <button onClick={() => {
              if (!form.game_date) { setError('Выберите дату'); return; }
              if (!form.game_time) { setError('Выберите время'); return; }
              setError(''); setStep(2);
            }} className="btn-primary w-full py-4 rounded-2xl text-base">Далее →</button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-white mb-1">Ваши данные</h2>
              <p className="text-neutral-500 text-sm">Бронь оформляется на имя и номер телефона</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Имя *</label>
              <input type="text" placeholder="Али Рахимов" value={form.customer_name}
                onChange={e => set('customer_name', e.target.value)}
                className="input-field" autoComplete="name" autoCapitalize="words" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Телефон *</label>
              <input type="tel" placeholder="+992 50 213 14 15" value={form.customer_phone}
                onChange={e => set('customer_phone', e.target.value)}
                className="input-field" autoComplete="tel" inputMode="tel" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Количество игроков</label>
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-between px-5 py-3">
                <button onClick={() => set('players_count', Math.max(1, form.players_count - 1))}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="w-11 h-11 rounded-full bg-neutral-700 active:bg-neutral-600 flex items-center justify-center text-white text-2xl font-bold">−</button>
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-500">{form.players_count}</div>
                  <div className="text-xs text-neutral-500">человек</div>
                </div>
                <button onClick={() => set('players_count', Math.min(50, form.players_count + 1))}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="w-11 h-11 rounded-full bg-neutral-700 active:bg-neutral-600 flex items-center justify-center text-white text-2xl font-bold">+</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Количество шаров</label>
              <div className="grid grid-cols-3 gap-2">
                {BALLS_OPTIONS.map(opt => (
                  <button key={opt.balls} onClick={() => set('balls_count', opt.balls)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={['py-3 px-2 rounded-xl text-sm font-medium transition-all',
                      form.balls_count === opt.balls ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-300 active:bg-neutral-700'
                    ].join(' ')}>
                    <div className="font-bold">{opt.balls}</div>
                    <div className="text-xs opacity-70">{opt.price} сом</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Комментарий</label>
              <textarea placeholder="День рождения, особые пожелания..." value={form.customer_comment}
                onChange={e => set('customer_comment', e.target.value)}
                className="input-field resize-none" rows={3} />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setError(''); setStep(1); }} className="btn-secondary py-4 rounded-2xl text-sm">← Назад</button>
              <button onClick={() => {
                if (!form.customer_name.trim()) { setError('Введите имя'); return; }
                if (!form.customer_phone.trim()) { setError('Введите телефон'); return; }
                setError(''); setStep(3);
              }} className="btn-primary py-4 rounded-2xl text-sm">Далее →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-white mb-1">Подтверждение</h2>
              <p className="text-neutral-500 text-sm">Проверьте данные перед отправкой</p>
            </div>

            <div className="card p-5 space-y-3 text-sm">
              {[
                ['📅 Дата', `${new Date(form.game_date + 'T12:00:00').toLocaleDateString('ru-RU')} в ${form.game_time}`],
                ['👤 Имя', form.customer_name],
                ['📞 Телефон', form.customer_phone],
                ['👥 Игроков', `${form.players_count} чел.`],
                ['🎯 Шаров', `${form.balls_count} шт.`],
                ...(form.customer_comment ? [['💬', form.customer_comment]] : []),
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-start gap-3">
                  <span className="text-neutral-500 flex-shrink-0">{l}</span>
                  <span className="text-white text-right">{v}</span>
                </div>
              ))}
              <div className="border-t border-neutral-800 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Итого:</span>
                  <span className="text-white font-black text-xl">{totalPrice} сом.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-400">Предоплата:</span>
                  <span className="text-orange-400 font-black text-xl">{prepayment} сом.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-xs">Остаток при игре:</span>
                  <span className="text-neutral-400 text-xs">{totalPrice - prepayment} сом.</span>
                </div>
              </div>
            </div>

            {/* Flow explanation */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 space-y-2">
              <p className="text-white text-sm font-bold mb-3">Как это работает:</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-orange-500 font-black w-5 text-center">1</span>
                <span className="text-neutral-300">Отправляешь заявку</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-orange-500 font-black w-5 text-center">2</span>
                <span className="text-neutral-300">Вносишь предоплату <strong className="text-orange-400">{prepayment} сомони</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-orange-500 font-black w-5 text-center">3</span>
                <span className="text-neutral-300">Администратор подтверждает бронь автоматически</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-orange-500 font-black w-5 text-center">4</span>
                <span className="text-neutral-300">Предоплата возвращается после игры</span>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl cursor-pointer active:bg-neutral-800"
              style={{ WebkitTapHighlightColor: 'transparent' }}>
              <input type="checkbox" checked={form.agree_terms} onChange={e => set('agree_terms', e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-orange-500 flex-shrink-0" />
              <span className="text-sm text-neutral-300 leading-relaxed">
                Согласен с условиями бронирования и обязуюсь внести предоплату {prepayment} сомони
              </span>
            </label>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setError(''); setStep(2); }} className="btn-secondary py-4 rounded-2xl text-sm">← Назад</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="btn-primary py-4 rounded-2xl text-sm disabled:opacity-50">
                {submitting ? '⏳ Отправка...' : '✅ Отправить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
