"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

type Interactive3DCardProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  href: string;
  actionText?: string;
};

export function Interactive3DCard({
  title,
  subtitle,
  imageUrl,
  href,
  actionText = "View prompt",
}: Interactive3DCardProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="interactive-3d-card"
      style={{ transformStyle: "preserve-3d" }}
      animate={reduceMotion ? {} : { rotateX: rotation.x, rotateY: rotation.y }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      onPointerMove={(event) => {
        if (reduceMotion) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        setRotation({
          x: ((event.clientY - bounds.top) / bounds.height - 0.5) * -10,
          y: ((event.clientX - bounds.left) / bounds.width - 0.5) * 10,
        });
      }}
      onPointerLeave={() => setRotation({ x: 0, y: 0 })}
    >
      <Link href={href} className="interactive-3d-card-link">
        {imageUrl ? (
          <img src={imageUrl} alt={title} draggable={false} />
        ) : (
          <div className="image-fallback" />
        )}
        <div className="interactive-3d-card-shade" />
        <div className="interactive-3d-card-copy">
          {subtitle && <span>{subtitle}</span>}
          <h3>{title}</h3>
          <b>
            {actionText} <ArrowRight size={15} />
          </b>
        </div>
      </Link>
    </motion.div>
  );
}
