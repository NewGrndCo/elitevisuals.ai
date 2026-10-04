"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { type CSSProperties, type ReactNode } from "react";

export function Tilt({
  children,
  className,
  rotationFactor = 7,
  style,
}: {
  children: ReactNode;
  className?: string;
  rotationFactor?: number;
  style?: CSSProperties;
}) {
  const rotateX = useSpring(0, { stiffness: 170, damping: 16, mass: 0.45 });
  const rotateY = useSpring(0, { stiffness: 170, damping: 16, mass: 0.45 });
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{
        ...style,
        transformStyle: "preserve-3d",
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
      }}
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        rotateX.set(((event.clientY - rect.top) / rect.height - 0.5) * -rotationFactor);
        rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * rotationFactor);
      }}
      onPointerLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
