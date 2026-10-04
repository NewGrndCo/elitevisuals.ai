"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@/components-next/icons";
import { motion, useReducedMotion, useSpring } from "framer-motion";
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
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const rotateX = useSpring(0, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 180, damping: 18 });
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="interactive-3d-card"
      style={{
        transformStyle: "preserve-3d",
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
      }}
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType === "touch") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        rotateX.set(((event.clientY - bounds.top) / bounds.height - 0.5) * -10);
        rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 10);
      }}
      onPointerLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      <Link href={href} className="interactive-3d-card-link">
        {imageUrl && failedSource !== imageUrl ? (
          <Image
            src={imageUrl}
            unoptimized={imageUrl.startsWith("/media/prompts/")}
            alt={title}
            fill
            sizes="(max-width: 800px) 78vw, (max-width: 1240px) 31vw, 382px"
            draggable={false}
            onError={() => setFailedSource(imageUrl)}
          />
        ) : (
          <div className="image-fallback" role="img" aria-label={`${title} preview unavailable`} />
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
