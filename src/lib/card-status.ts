export type CardStatus = 'pending' | 'active' | 'revoked' | 'expired' | 'replaced';

export function isCardVerifiable(input: { status: CardStatus; expiresAt: Date | null; now?: Date }): boolean {
  if (input.status !== 'active') return false;
  if (input.expiresAt === null) return true;
  const now = input.now ?? new Date();
  return input.expiresAt.getTime() > now.getTime();
}
