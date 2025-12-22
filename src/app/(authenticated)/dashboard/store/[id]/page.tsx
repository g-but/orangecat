import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import EntityDetailLayout from '@/components/entity/EntityDetailLayout';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect('/auth?mode=login&from=/dashboard/store');
  }

  const { data: product, error } = await supabase
    .from('user_products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !product) {
    notFound();
  }

  const headerActions = (
    <Link href={`/dashboard/store/create?edit=${product.id}`}>
      <Button>Edit</Button>
    </Link>
  );

  return (
    <EntityDetailLayout
      title={product.title}
      subtitle={product.description || ''}
      headerActions={headerActions}
      left={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{product.status}</div>
            <div className="text-gray-500">Price</div>
            <div className="font-medium">
              {product.price_sats} {product.currency}
            </div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium">{product.product_type}</div>
            <div className="text-gray-500">Inventory</div>
            <div className="font-medium">{product.inventory_count}</div>
            <div className="text-gray-500">Fulfillment</div>
            <div className="font-medium">{product.fulfillment_type}</div>
          </div>
          {product.tags?.length ? (
            <div className="text-sm">
              <div className="text-gray-500">Tags</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {product.tags.map((t: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      }
      right={
        <div className="space-y-3 text-sm">
          <div className="text-gray-500">Created</div>
          <div className="font-medium">{new Date(product.created_at).toLocaleString()}</div>
          <div className="text-gray-500">Updated</div>
          <div className="font-medium">{new Date(product.updated_at).toLocaleString()}</div>
        </div>
      }
    />
  );
}
