import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, UserX } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserX className="w-16 h-16 text-gray-400" />
          </div>
          <CardTitle>Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            The profile you are looking for does not exist or may have been removed.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href={ROUTES.HOME}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Home
              </Button>
            </Link>
            <Link href={ROUTES.DISCOVER}>
              <Button>Discover Projects</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
