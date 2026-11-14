"use client";

import React, { type JSX } from "react";

export function GlassFilterDefs(): null {
  return null;
}

export function GlassPanel(
  props: {
    as?: "div" | "section" | "nav" | "header";
    tone?: "light" | "dark";
    refract?: boolean;
    className?: string;
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLElement>,
): JSX.Element {
  const {
    as: Tag = "div",
    tone = "light",
    refract,
    className,
    children,
    ...rest
  } = props;
  void refract;

  const classes = [
    "fx-glass",
    tone === "dark" ? "fx-glass--dark" : "fx-glass--light",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
