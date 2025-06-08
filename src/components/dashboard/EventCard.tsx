'use client'

import { Calendar, MapPin, Users, Ticket, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { EventData } from '@/types/dashboard'

interface EventCardProps {
  event: EventData
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${event.color}`}>
              {event.type}
            </span>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            event.status === 'Upcoming' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {event.role}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{event.date} at {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{event.attendees}/{event.capacity} attendees</span>
          </div>
          {event.revenue > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Ticket className="w-4 h-4" />
              <span>{event.revenue.toLocaleString('en-US')} sats revenue</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Users className="w-4 h-4 mr-1" />
              Attendees
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 