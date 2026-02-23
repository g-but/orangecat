import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDistanceToNow, format } from 'date-fns';

interface PublicEntityTimestampsProps {
  createdAt: string;
  updatedAt?: string | null;
  createdLabel?: string;
}

export default function PublicEntityTimestamps({
  createdAt,
  updatedAt,
  createdLabel = 'Created',
}: PublicEntityTimestampsProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {createdLabel} {format(new Date(createdAt), 'MMM d, yyyy')}
          </span>
        </div>
        {updatedAt && updatedAt !== createdAt && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
