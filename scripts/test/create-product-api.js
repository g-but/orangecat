#!/usr/bin/env node

// Create Antique Menorah product via API
const productData = {
  title: 'Antique Menorah',
  description: 'Beautiful antique menorah from the 19th century, perfect for Hanukkah celebrations. Made of solid brass with intricate engravings.',
  price_sats: 50000,
  category: 'Antiques',
  product_type: 'physical',
  inventory_count: 1,
  fulfillment_type: 'manual',
  status: 'draft'
};

console.log('🎨 Creating Antique Menorah product via API...');

fetch('http://localhost:3005/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(productData)
})
.then(response => response.json())
.then(result => {
  if (result.success) {
    console.log('✅ Product created successfully!');
    console.log('Product ID:', result.data.id);
    console.log('Title:', result.data.title);
    console.log('Price:', result.data.price_sats, 'sats');
    console.log('Category:', result.data.category);
  } else {
    console.log('❌ Failed to create product:', result.error?.message || result.error);
  }
})
.catch(error => {
  console.error('Network error:', error.message);
});



