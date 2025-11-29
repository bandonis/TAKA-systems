import { BadRequestError } from '@/lib/tenants';

type RuleInput = {
  date: Date;
  earlyBirdDeadline?: Date | null;
  priceGroup?: number | null;
  maxParticipants?: number | null;
};

export function ensureEventBusinessRules({ date, earlyBirdDeadline, priceGroup, maxParticipants }: RuleInput) {
  if (earlyBirdDeadline && earlyBirdDeadline > date) {
    throw new BadRequestError('Early bird deadline must be on or before the event date');
  }

  if (priceGroup !== undefined && priceGroup !== null) {
    if (!maxParticipants || maxParticipants < 2) {
      throw new BadRequestError('Group pricing requires maxParticipants of at least 2');
    }
  }
}





