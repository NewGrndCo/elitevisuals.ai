"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export type CardStackItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc?: string | null;
  href?: string;
  ctaLabel?: string;
  tag?: string;
};

type CardStackProps = {
  items: CardStackItem[];
  initialIndex?: number;
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  overlap?: number;
  spreadDeg?: number;
  autoAdvance?: boolean;
  intervalMs?: number;
  className?: string;
  renderCard?: (item: CardStackItem, state: { active: boolean }) => React.ReactNode;
};

function wrapIndex(index: number, length: number) {
  return length ? ((index % length) + length) % length : 0;
}

function signedOffset(index: number, active: number, length: number) {
  const raw = index - active;
  const alternate = raw > 0 ? raw - length : raw + length;
  return Math.abs(alternate) < Math.abs(raw) ? alternate : raw;
}

export function CardStack({
  items,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 330,
  cardHeight = 405,
  overlap = 0.43,
  spreadDeg = 34,
  autoAdvance = true,
  intervalMs = 3200,
  className,
  renderCard,
}: CardStackProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, items.length));
  const [hovering, setHovering] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const length = items.length;
  const maxOffset = Math.floor(maxVisible / 2);
  const spacing = Math.max(22, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset ? spreadDeg / maxOffset : 0;

  const previous = React.useCallback(
    () => setActive((current) => wrapIndex(current - 1, length)),
    [length],
  );
  const next = React.useCallback(
    () => setActive((current) => wrapIndex(current + 1, length)),
    [length],
  );

  React.useEffect(() => setActive((current) => wrapIndex(current, length)), [length]);
  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || hovering || focused || paused || length < 2) return;
    const timer = window.setInterval(next, Math.max(900, intervalMs));
    return () => window.clearInterval(timer);
  }, [autoAdvance, hovering, focused, paused, intervalMs, length, next, reduceMotion]);

  if (!length) return null;

  return (
    <div
      className={cn("card-stack", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className="card-stack-stage"
        style={{ height: Math.max(360, cardHeight + 54) }}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") previous();
          if (event.key === "ArrowRight") next();
        }}
        aria-label="Featured Elite Visuals releases"
      >
        <div className="card-stack-glow" aria-hidden="true" />
        <div className="card-stack-deck" style={{ perspective: "1100px" }}>
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const offset = signedOffset(index, active, length);
              const distance = Math.abs(offset);
              if (distance > maxOffset) return null;
              const isActive = offset === 0;
              const x = offset * spacing;
              const y = distance * 11 + (isActive ? -18 : 0);

              return (
                <motion.div
                  key={item.id}
                  className={cn("card-stack-card", isActive ? "is-active" : "")}
                  style={{ width: cardWidth, height: cardHeight, zIndex: 100 - distance }}
                  initial={
                    reduceMotion ? false : { opacity: 0, x, y: y + 35, rotateZ: offset * stepDeg }
                  }
                  animate={{
                    opacity: 1,
                    x,
                    y,
                    rotateZ: offset * stepDeg,
                    rotateX: isActive ? 0 : 10,
                    scale: isActive ? 1.02 : 0.93,
                  }}
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 270, damping: 27 }
                  }
                  drag={isActive && !reduceMotion ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_event, info) => {
                    if (info.offset.x > 70 || info.velocity.x > 620) previous();
                    if (info.offset.x < -70 || info.velocity.x < -620) next();
                  }}
                  onClick={() => setActive(index)}
                >
                  {renderCard ? (
                    renderCard(item, { active: isActive })
                  ) : (
                    <DefaultCard item={item} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      {autoAdvance && !reduceMotion && length > 1 && (
        <button
          className="motion-toggle"
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Resume featured releases" : "Pause featured releases"}
        </button>
      )}
      <div className="card-stack-dots" aria-label="Choose a featured release">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === active ? "is-active" : ""}
            onClick={() => setActive(index)}
            aria-label={`Show ${item.title}`}
            aria-current={index === active ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function DefaultCard({ item }: { item: CardStackItem }) {
  return (
    <div className="card-stack-default">
      {item.imageSrc ? (
        <img src={item.imageSrc} alt={item.title} draggable={false} />
      ) : (
        <div className="image-fallback" />
      )}
      <div className="card-stack-shade" />
      <div className="card-stack-copy">
        {item.tag && <span>{item.tag}</span>}
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
    </div>
  );
}
