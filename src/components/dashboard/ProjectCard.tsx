'use client'

import { GitBranch, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ProjectData } from '@/types/dashboard'

interface ProjectCardProps {
  project: ProjectData
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{project.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${project.color}`}>
              {project.type}
            </span>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            project.status === 'Active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {project.role}
          </span>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Contributors</span>
            <span className="font-medium">{project.contributors}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Funding</span>
                          <span className="font-medium">{project.funding.toLocaleString('en-US')} sats</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Deadline</span>
            <span className="font-medium">{project.deadline}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <GitBranch className="w-4 h-4 mr-1" />
              Code
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