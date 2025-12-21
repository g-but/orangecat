'use client';

/**
 * CREATE PRODUCT PAGE
 *
 * Uses the unified EntityForm component with useTemplateSelection hook.
 * Templates appear at the bottom to help users who need inspiration.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-16
 * Last Modified Summary: Moved templates to bottom of form
 */

import { EntityForm } from '@/components/create';
import { productConfig } from '@/config/entity-configs';
import { ProductTemplates } from '@/components/create/templates';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';
import { Component, ReactNode } from 'react';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('EntityForm Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">EntityForm Error</h3>
          <p className="text-red-700 mb-4">{this.state.error?.message}</p>
          <details className="text-sm text-red-600">
            <summary>Stack Trace</summary>
            <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function CreateProductPage() {
  const { mergedConfig, handleSelectTemplate } = useTemplateSelection(productConfig);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">Debug: Create Product Page Loaded</h2>
        <p>Config loaded: {mergedConfig ? 'Yes' : 'No'}</p>
        <p>Template handler: {handleSelectTemplate ? 'Yes' : 'No'}</p>
      </div>

      {/* Simple working form */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Create Product (Working Form)</h3>
        <div id="form-status" className="mb-4 hidden"></div>
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            price_sats: parseInt(formData.get('price_sats') as string) || 0,
            category: formData.get('category') || 'Test',
            product_type: 'physical',
            inventory_count: -1,
            fulfillment_type: 'manual',
            status: 'draft'
          };

          const statusDiv = document.getElementById('form-status')!;
          statusDiv.className = 'mb-4 p-3 rounded-lg text-sm';
          statusDiv.classList.remove('hidden');

          statusDiv.textContent = 'Creating product...';
          statusDiv.className = 'mb-4 p-3 rounded-lg text-sm bg-blue-50 text-blue-700';

          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              statusDiv.textContent = 'Product created successfully! Redirecting...';
              statusDiv.className = 'mb-4 p-3 rounded-lg text-sm bg-green-50 text-green-700';
              setTimeout(() => {
                window.location.href = '/dashboard/store';
              }, 2000);
            } else {
              statusDiv.textContent = `Error: ${result.error?.message || 'Unknown error'}`;
              statusDiv.className = 'mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700';
            }
          })
          .catch(error => {
            statusDiv.textContent = `Network error: ${error.message}`;
            statusDiv.className = 'mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700';
          });
        }}>
          <div>
            <label className="block text-sm font-medium mb-2">Product Title</label>
            <input
              name="title"
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Handmade Ceramic Mug"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              className="w-full p-3 border rounded-lg"
              rows={4}
              placeholder="Describe your product in detail..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price (sats)</label>
            <input
              name="price_sats"
              type="number"
              className="w-full p-3 border rounded-lg"
              placeholder="2500"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input
              name="category"
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Handmade, Digital, Food"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
          >
            Create Product
          </button>
        </form>
      </div>

      <ErrorBoundary>
        <EntityForm config={mergedConfig} />
      </ErrorBoundary>
      <ProductTemplates onSelectTemplate={handleSelectTemplate} />
    </div>
  );
}
