"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type CSSProperties, type ReactNode, useState } from "react";

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ ...style, transformStyle: "preserve-3d" }}
      animate={reduceMotion ? {} : { rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 170, damping: 16, mass: 0.45 }}
      onPointerMove={(event) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((event.clientY - rect.top) / rect.height - 0.5) * -rotationFactor,
          y: ((event.clientX - rect.left) / rect.width - 0.5) * rotationFactor,
        });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  );
}
