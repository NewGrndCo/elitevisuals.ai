// Shopify Storefront API client (direct fetch — no extra deps).
// Configure VITE_SHOPIFY_STORE_URL and VITE_SHOPIFY_STOREFRONT_TOKEN in .env.

const STORE_URL = (import.meta.env.VITE_SHOPIFY_STORE_URL ?? "").replace(/\/$/, "");
export const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN ?? "";
export const STOREFRONT_API_URL = STORE_URL
  ? `${STORE_URL}/api/2024-10/graphql.json`
  : "";

export type Money = { amount: string; currencyCode: string };

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: { id: string; title: string; handle: string };
    image: { url: string; altText: string | null } | null;
    price: Money;
  };
  cost: { totalAmount: Money };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: CartLine[];
};

export function shopifyConfigured(): boolean {
  return Boolean(STOREFRONT_API_URL && STOREFRONT_ACCESS_TOKEN);
}

export async function storefrontFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!shopifyConfigured()) {
    throw new Error("Shopify Storefront API is not configured. Set VITE_SHOPIFY_STORE_URL and VITE_SHOPIFY_STOREFRONT_TOKEN.");
  }
  const res = await fetch(STOREFRONT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Shopify request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Shopify response missing data");
  return json.data;
}

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost { totalAmount { amount currencyCode } }
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              image { url altText }
              product { id title handle }
            }
          }
        }
      }
    }
  }
`;

type RawCart = Omit<Cart, "lines"> & {
  lines: { edges: Array<{ node: CartLine }> };
};

function normalize(raw: RawCart | null | undefined): Cart | null {
  if (!raw) return null;
  return { ...raw, lines: raw.lines.edges.map((e) => e.node) };
}

export async function createCart(): Promise<{ id: string; checkoutUrl: string }> {
  const data = await storefrontFetch<{ cartCreate: { cart: { id: string; checkoutUrl: string } } }>(
    /* GraphQL */ `
      mutation CartCreate { cartCreate { cart { id checkoutUrl } } }
    `,
  );
  return data.cartCreate.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number): Promise<Cart> {
  const data = await storefrontFetch<{ cartLinesAdd: { cart: RawCart } }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
      }
    `,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
  );
  const cart = normalize(data.cartLinesAdd.cart);
  if (!cart) throw new Error("Cart not returned");
  return cart;
}

export async function removeFromCart(cartId: string, lineId: string): Promise<void> {
  await storefrontFetch(
    /* GraphQL */ `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id } }
      }
    `,
    { cartId, lineIds: [lineId] },
  );
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontFetch<{ cart: RawCart | null }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      query GetCart($id: ID!) { cart(id: $id) { ...CartFields } }
    `,
    { id: cartId },
  );
  return normalize(data.cart);
}
