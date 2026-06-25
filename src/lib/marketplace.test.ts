import { describe, expect, it } from "vitest";
import { listMarketplace, marketplaceResourceColumns } from "./marketplace";
import type { MarketplaceListing, Resource } from "./types";

describe("listMarketplace", () => {
  it("never returns resources.endpoint and exposes only curated resource columns", () => {
    const resources: Resource[] = [
      {
        id: "res_private_api",
        ownerId: "user_test",
        name: "Private Settlement API",
        type: "api",
        description: "A listed API with a private upstream endpoint.",
        status: "active",
        visibility: "monetized",
        pricingMode: "metered",
        endpoint: "https://secret.internal.example/proxy",
        address: "internal-address-that-should-not-leak",
        metadata: {
          authHeader: "Bearer secret",
          internalRegion: "private"
        },
        tags: ["api", "settlement"],
        usage: {
          requests: 1200,
          computeHours: 0,
          uptime: 99.8,
          latencyMs: 180,
          errorRate: 0.2
        },
        earningsEstimate: 320,
        createdAt: "2026-06-25T10:00:00.000Z",
        lastHeartbeat: "2026-06-25T10:01:00.000Z"
      }
    ];
    const listings: MarketplaceListing[] = [
      {
        id: "listing_private_api",
        resourceId: "res_private_api",
        availability: "99.8% live",
        priceLabel: "$0.01 / call",
        shortDescription: "Curated listing copy.",
        featured: true
      }
    ];

    const [item] = listMarketplace({ listings, resources });

    expect(item.resource).not.toHaveProperty("endpoint");
    expect(item.resource).not.toHaveProperty("address");
    expect(item.resource).not.toHaveProperty("metadata");
    expect(item.resource).not.toHaveProperty("usage");
    expect(Object.keys(item.resource).sort()).toEqual([...marketplaceResourceColumns].sort());
  });
});
