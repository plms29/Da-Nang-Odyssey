"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

let hasMounted = false;

// transitionEnd clears the transform after the fade: a lingering transform breaks position:fixed/sticky descendants.
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [animateIn] = useState(() => hasMounted);

  useEffect(() => {
    hasMounted = true;
  }, []);

  return (
    <motion.div
      className="w-full"
      initial={reduce || !animateIn ? false : { opacity: 0, y: 12 }}
      animate={
        reduce
          ? { opacity: 1, transitionEnd: { transform: "none" } }
          : { opacity: 1, y: 0, transitionEnd: { transform: "none" } }
      }
      transition={{ duration: reduce ? 0.15 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
