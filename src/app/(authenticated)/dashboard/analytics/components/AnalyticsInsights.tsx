import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart3, PieChart, Activity, TrendingUp, Share2, Heart } from 'lucide-react';

interface AnalyticsInsightsProps {
  hasProjects: boolean;
}

export default function AnalyticsInsights({ hasProjects }: AnalyticsInsightsProps) {
  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Funding Over Time
            </CardTitle>
            <CardDescription>Track your fundraising progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                {process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true' ? (
                  <p>Interactive charts will render here</p>
                ) : (
                  <p className="text-gray-600">Analytics are disabled in this environment.</p>
                )}
                <p className="text-sm">Real-time funding visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Supporter Insights
            </CardTitle>
            <CardDescription>Understand your audience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                {process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true' ? (
                  <p>Demographic analysis will render here</p>
                ) : (
                  <p className="text-gray-600">This module is currently disabled.</p>
                )}
                <p className="text-sm">Supporter behavior insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Personalized recommendations to improve your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hasProjects ? (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Optimize Your Campaign Timing</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Your projects perform 23% better when launched on Tuesdays. Consider timing
                        your next launch accordingly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Share2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Increase Social Sharing</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Projects with regular social media updates raise 40% more on average. Share
                        updates 2-3 times per week.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Engage Your Supporters</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Send personalized thank-you messages to increase repeat contributions by up
                        to 60%.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Create your first project to see personalized insights</p>
                <Button href="/projects/create" className="mt-4">
                  Create Project
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
