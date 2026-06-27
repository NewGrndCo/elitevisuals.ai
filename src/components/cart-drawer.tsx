import { useCart } from "@/lib/cart-context";
import { ShoppingBag, X, Trash2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartDrawer() {
  const { isOpen, closeCart, items, totalCents, isLoading, removeItem, checkout } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[100] transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div onClick={closeCart} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[rgba(124,92,252,0.2)] backdrop-blur-xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "oklch(0.18 0.03 270 / 0.92)" }}
      >
        <header className="flex items-center justify-between border-b border-[rgba(124,92,252,0.15)] px-6 py-5">
          <h2 className="font-display text-lg font-bold tracking-[-0.02em]">Your cart</h2>
          <button
            onClick={closeCart}
            className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-[rgba(124,92,252,0.35)] hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[rgba(124,92,252,0.2)] bg-[rgba(124,92,252,0.08)]">
                <ShoppingBag className="h-7 w-7 text-[#a78bfa]" />
              </div>
              <div>
                <div className="font-semibold">Nothing here yet</div>
                <p className="mt-1 text-sm text-muted-foreground">Add a pack to get started.</p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((line) => (
                <li key={line.id} className="glass flex gap-3 rounded-2xl p-3">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[rgba(124,92,252,0.1)]">
                    {line.image ? (
                      <img src={line.image} alt={line.title} className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background:
                            "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.45), transparent 60%), #0f0c1f",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="text-sm font-semibold leading-tight">{line.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground capitalize">{line.kind}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-[#a78bfa]">{formatMoney(line.priceCents)}</div>
                      <button
                        onClick={() => removeItem(line.id)}
                        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-[rgba(124,92,252,0.12)] hover:text-foreground"
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-[rgba(124,92,252,0.15)] px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-lg font-bold">{formatMoney(totalCents)}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await checkout();
                  setTimeout(() => {
                    toast.info("If checkout didn't open, click here to try again.", {
                      action: { label: "Open checkout", onClick: () => checkout() },
                      duration: 8000,
                    });
                  }, 3000);
                } catch {
                  toast.error("Checkout failed. Please try again.");
                }
              }}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-3.5 text-center text-base font-bold tracking-[-0.01em] text-primary-foreground shadow-[0_0_28px_rgba(124,92,252,0.35),0_0_60px_rgba(124,92,252,0.18)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Checkout
            </button>
            <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
              Secure checkout via Stripe
            </p>
          </footer>
        )}
      </aside>
    </div>
  );
}
