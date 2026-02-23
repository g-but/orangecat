import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { LucideIcon } from 'lucide-react';

interface PublicEntityCTAProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export default function PublicEntityCTA({
  href,
  icon: Icon,
  label,
  description,
}: PublicEntityCTAProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Link href={href} className="block">
          <Button className="w-full gap-2">
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        </Link>
        <p className="text-xs text-gray-500 text-center">{description}</p>
      </CardContent>
    </Card>
  );
}
