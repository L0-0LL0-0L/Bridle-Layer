import type { MarketplaceListing, Resource, ResourceHealthStatus, ResourceStatus, ResourceType } from "./types";

export type MarketplaceResourceSummary = {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  description: string;
  visibility: Resource["visibility"];
  pricingMode: Resource["pricingMode"];
  usageRequests: number;
  uptime: number;
  earningsEstimate: number;
  healthStatus: ResourceHealthStatus;
  lastLatencyMs?: number;
  lastHttpStatus?: number;
  lastHealthAt?: string;
  tags: string[];
};

export type MarketplaceListItem = {
  listing: MarketplaceListing;
  resource: MarketplaceResourceSummary;
};

export const marketplaceResourceColumns = [
  "id",
  "name",
  "type",
  "status",
  "description",
  "visibility",
  "pricingMode",
  "usageRequests",
  "uptime",
  "earningsEstimate",
  "healthStatus",
  "lastLatencyMs",
  "lastHttpStatus",
  "lastHealthAt",
  "tags"
] as const;

export function listMarketplace({
  listings,
  resources,
  type = "all"
}: {
  listings: MarketplaceListing[];
  resources: Resource[];
  type?: "all" | ResourceType;
}): MarketplaceListItem[] {
  return listings
    .map((listing) => {
      const resource = resources.find((item) => item.id === listing.resourceId);

      if (!resource || (type !== "all" && resource.type !== type)) {
        return null;
      }

      const item: MarketplaceListItem = {
        listing,
        resource: {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          status: resource.status,
          description: resource.description,
          visibility: resource.visibility,
          pricingMode: resource.pricingMode,
          usageRequests: resource.usage.requests,
          uptime: resource.usage.uptime,
          earningsEstimate: resource.earningsEstimate,
          healthStatus: resource.healthStatus,
          lastLatencyMs: resource.lastLatencyMs,
          lastHttpStatus: resource.lastHttpStatus,
          lastHealthAt: resource.lastHealthAt,
          tags: resource.tags
        }
      };

      return item;
    })
    .filter((item): item is MarketplaceListItem => item !== null);
}
