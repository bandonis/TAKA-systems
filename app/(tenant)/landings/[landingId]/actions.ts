"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { LandingStatus } from '@prisma/client';

import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';

export type LandingHeaderFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<'title' | 'slug' | 'status', string>>;
};

const slugPattern = /^[a-z0-9-]+$/;

const updateLandingHeaderSchema = z.object({
  landingId: z.string().min(1),
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(120, 'Title must be 120 characters or fewer.')
    .transform((value) => value.trim()),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(120, 'Slug must be 120 characters or fewer.')
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => slugPattern.test(value), 'Use lowercase letters, numbers, and hyphens only.'),
  status: z.nativeEnum(LandingStatus, {
    errorMap: () => ({ message: 'Select a valid status.' })
  })
});

export async function updateLandingHeader(
  _prevState: LandingHeaderFormState,
  formData: FormData
): Promise<LandingHeaderFormState> {
  const session = await getSession();

  if (!session?.tenantId) {
    return { error: 'Unauthorized.' };
  }

  const parseResult = updateLandingHeaderSchema.safeParse({
    landingId: formData.get('landingId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    status: formData.get('status')
  });

  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        title: fieldErrors.title?.[0],
        slug: fieldErrors.slug?.[0],
        status: fieldErrors.status?.[0]
      }
    };
  }

  const { landingId, title, slug, status } = parseResult.data;
  const prisma = getPrisma();

  const landing = await prisma.landingPage.findFirst({
    where: { id: landingId, tenantId: session.tenantId },
    select: { id: true }
  });

  if (!landing) {
    return { error: 'Landing not found.' };
  }

  const conflictingSlug = await prisma.landingPage.findFirst({
    where: {
      tenantId: session.tenantId,
      slug,
      NOT: { id: landingId }
    },
    select: { id: true }
  });

  if (conflictingSlug) {
    return {
      fieldErrors: { slug: 'Slug already in use. Pick a different one.' }
    };
  }

  await prisma.landingPage.update({
    where: { id: landing.id },
    data: { title, slug, status }
  });

  revalidatePath('/landings');
  revalidatePath(`/landings/${landing.id}`);

  return { success: true };
}

