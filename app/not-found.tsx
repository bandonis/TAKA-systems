"use client";

import Link from 'next/link';
import { Compass, MoveLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-semibold">Page not found</CardTitle>
          <CardDescription>We can’t find the trail you’re looking for.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              <MoveLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Double-check the link or start fresh from your dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}






