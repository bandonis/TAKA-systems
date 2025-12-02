"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type PublicLinkButtonProps = {
  url: string;
};

export function PublicLinkButton({ url }: PublicLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('Clipboard API is unavailable');
      }
    } catch {
      window.prompt?.('Copy public link', url);
    } finally {
      setCopied(true);
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? 'Copied public link' : 'Copy public link'}
    >
      {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Link2 className="mr-1.5 h-4 w-4" />}
      {copied ? 'Copied' : 'Public link'}
    </Button>
  );
}


