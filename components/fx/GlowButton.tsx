"use client";

import React, { type JSX } from "react";
import Link from "next/link";

export function GlowButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    children?: React.ReactNode;
  },
): JSX.Element {
  const { className, children, type = "button", ...buttonProps } = props;
  const classes = [
    "fx-glow-btn active:scale-[0.98] disabled:active:scale-100",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...buttonProps}>
      <span className="fx-glow-btn__label">{children}</span>
    </button>
  );
}

export function GlowLink(props: React.ComponentProps<typeof Link>): JSX.Element {
  const { className, children, ...linkProps } = props;
  const classes = ["fx-glow-btn active:scale-[0.98]", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classes} {...linkProps}>
      <span className="fx-glow-btn__label">{children}</span>
    </Link>
  );
}
