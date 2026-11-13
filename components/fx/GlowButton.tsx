"use client";

import React, { type JSX } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

const MotionLink = motion.create(Link);

export function GlowButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    children?: React.ReactNode;
  },
): JSX.Element {
  const { className, children, ...buttonProps } = props;
  const reduceMotion = useReducedMotion();
  const classes = ["fx-glow-btn", className ?? ""].filter(Boolean).join(" ");

  return (
    <motion.button
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className={classes}
      {...({
        type: "button",
        ...buttonProps,
      } as React.ComponentProps<typeof motion.button>)}
    >
      <span className="fx-glow-btn__glow" aria-hidden="true" />
      <span className="fx-glow-btn__label">{children}</span>
    </motion.button>
  );
}

export function GlowLink(props: React.ComponentProps<typeof Link>): JSX.Element {
  const { className, children, ...linkProps } = props;
  const reduceMotion = useReducedMotion();
  const classes = ["fx-glow-btn", className ?? ""].filter(Boolean).join(" ");

  return (
    <MotionLink
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className={classes}
      {...(linkProps as React.ComponentProps<typeof MotionLink>)}
    >
      <span className="fx-glow-btn__glow" aria-hidden="true" />
      <span className="fx-glow-btn__label">{children}</span>
    </MotionLink>
  );
}
