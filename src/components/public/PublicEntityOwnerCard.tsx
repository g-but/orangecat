import Link from 'next/link';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ROUTES } from '@/config/routes';
import type { EntityOwner } from '@/lib/entities/fetchEntityOwner';

interface PublicEntityOwnerCardProps {
  owner: EntityOwner;
  label: string;
}

export default function PublicEntityOwnerCard({ owner, label }: PublicEntityOwnerCardProps) {
  const profileHref = owner.username ? ROUTES.PROFILES.VIEW(owner.username) : '#';
  const isClickable = !!owner.username;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          href={profileHref}
          className={`flex items-center gap-3 -m-2 p-2 rounded-lg transition-colors ${isClickable ? 'hover:bg-gray-50' : 'cursor-default'}`}
        >
          {owner.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={owner.avatar_url}
              alt={owner.name || owner.username || label}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">
              {owner.name || owner.username || 'Anonymous'}
            </div>
            {owner.username && <div className="text-sm text-gray-500">@{owner.username}</div>}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
