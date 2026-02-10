'use client';

import { LucideIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface CallToActionCardProps {
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonIcon: LucideIcon;
  primaryButtonAction?: () => void;
  gradientColors: string;
  textColors: string;
  buttonColors: string;
}

export default function CallToActionCard({
  title,
  description,
  primaryButtonText,
  primaryButtonIcon: PrimaryIcon,
  primaryButtonAction,
  gradientColors,
  textColors,
  buttonColors,
}: CallToActionCardProps) {
  return (
    <Card className={`${gradientColors} text-white border-0`}>
      <CardContent className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className={`${textColors} mb-6 max-w-2xl mx-auto`}>{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className={buttonColors} onClick={primaryButtonAction}>
            <PrimaryIcon className="w-4 h-4 mr-2" />
            {primaryButtonText}
          </Button>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-700"
            >
              Back to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
