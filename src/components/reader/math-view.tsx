"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function MathView({ math, block = false, className = "" }: MathViewProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      return null;
    }
  }, [math, block]);

  if (!html) {
    return <code className={`font-mono text-xs ${className}`}>{math}</code>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
