import { redirect } from 'next/navigation';

export default function WishlistsPage() {
  redirect('/discover?type=wishlists');
}
