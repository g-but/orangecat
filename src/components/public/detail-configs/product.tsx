import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PriceDisplay from '@/components/public/PriceDisplay';
import type { EntityDetailConfig } from '@/components/public/PublicEntityDetailPage';
import { ROUTES } from '@/config/routes';

// user_products stores `price` in the entity's chosen `currency` (NOT price_btc —
// that column doesn't exist). Read price + currency and format in that currency.
// See decision_currency_convention / 20260618000005.
const getPrice = (entity: Record<string, unknown>) => ({
  amount: typeof entity.price === 'number' ? entity.price : Number(entity.price ?? NaN),
  currency: (entity.currency as string) || 'CHF',
});

/**
 * SSOT for the product detail page. Used by BOTH the public route
 * (/products/[id]) and the owner dashboard route (/dashboard/store/[id]) — one
 * layout, buyers see the listing, the owner sees it plus the manage bar.
 */
export const productDetailConfig: EntityDetailConfig = {
  entityType: 'product',
  ownerLabel: 'Seller',
  createdLabel: 'Listed',
  descriptionTitle: 'About this product',
  getViewRoute: id => ROUTES.PRODUCTS.VIEW(id),
  getCoverImages: entity => {
    const images = Array.isArray(entity.images) ? (entity.images as string[]) : [];
    return [...images, entity.thumbnail_url as string].filter(Boolean);
  },
  getPrice: entity => {
    const { amount, currency } = getPrice(entity);
    return Number.isFinite(amount) && amount > 0 ? { amount, currency } : null;
  },
  getJsonLdExtra: entity => {
    const { amount, currency } = getPrice(entity);
    return amount > 0
      ? { offers: { '@type': 'Offer', priceCurrency: currency, price: amount } }
      : {};
  },
  renderDetails: (entity, payable) => {
    const { amount, currency } = getPrice(entity);
    const hasPrice = Number.isFinite(amount) && amount > 0;
    const productType = entity.product_type as string | undefined;
    const inventory = entity.inventory_count as number | null | undefined;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPrice && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-fg-secondary">Price</span>
              <PriceDisplay
                amount={amount}
                currency={currency}
                className="text-right text-xl font-bold text-fg-primary"
              />
            </div>
          )}
          {productType && (
            <div className="flex items-center justify-between">
              <span className="text-fg-secondary">Type</span>
              <span className="font-medium capitalize">{productType}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-fg-secondary">Availability</span>
            <span className="font-medium">
              {/* inventory_count -1 (or null) = unlimited, e.g. digital goods. */}
              {inventory === null || inventory === undefined || inventory < 0
                ? 'In stock'
                : inventory > 0
                  ? `${inventory} available`
                  : 'Sold out'}
            </span>
          </div>
          {hasPrice && payable && (
            // Anchors to the payment section (#pay) — the buyer's "Buy" is paying
            // the seller direct in Bitcoin. Hidden when the seller has no wallet
            // (payable=false), so the CTA never promises an impossible action.
            <a
              href="#pay"
              className="mt-1 flex w-full items-center justify-center rounded-md bg-accent-warm px-4 py-2.5 font-medium text-on-accent transition-colors hover:bg-accent-warm/90"
            >
              Buy now
            </a>
          )}
        </CardContent>
      </Card>
    );
  },
};
