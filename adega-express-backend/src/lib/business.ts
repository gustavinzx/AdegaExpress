import { Prisma, OrderStatus, DeliveryStatus } from '@prisma/client';
import { AppError } from './errors';

export function businessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function isAdult(date: Date, now = new Date()): boolean {
  const birth = date.toISOString().slice(0, 10);
  const today = businessDate(now);
  let age = Number(today.slice(0, 4)) - Number(birth.slice(0, 4));
  if (today.slice(5) < birth.slice(5)) {
    age--;
  }
  return age >= 18 && birth <= today;
}
export function startBusinessDay(value: string): Date {
  // Resolve local midnight using timezone data rather than assuming a fixed UTC offset.
  const target = new Date(value + 'T00:00:00Z').getTime();
  let instant = target;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(new Date(instant));
    const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
    const wallTime = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
    const delta = target - wallTime;
    if (!delta) {
      break;
    }
    instant += delta;
  }
  return new Date(instant);
}
export function discountedTotal(
  subtotal: Prisma.Decimal,
  type: string,
  value: Prisma.Decimal,
): Prisma.Decimal {
  const discount = type === 'PERCENTUAL' ? subtotal.mul(value).div(100) : value;
  return Prisma.Decimal.max(0, subtotal.sub(discount)).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}
const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['SEPARADO', 'CANCELADO'],
  SEPARADO: ['EM_ROTA', 'CANCELADO'],
  EM_ROTA: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
};
const deliveryTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  AGUARDANDO: ['SAIU_PARA_ENTREGA'],
  SAIU_PARA_ENTREGA: ['ENTREGUE'],
  ENTREGUE: [],
};
export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (from !== to && !orderTransitions[from].includes(to)) {
    throw new AppError(409, `Transição de ${from} para ${to} não permitida.`);
  }
}
export function assertDeliveryTransition(from: DeliveryStatus, to: DeliveryStatus): void {
  if (from !== to && !deliveryTransitions[from].includes(to)) {
    throw new AppError(409, `Transição de ${from} para ${to} não permitida.`);
  }
}
