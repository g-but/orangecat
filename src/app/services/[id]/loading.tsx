export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50/50 via-white to-blue-50/30 animate-pulse">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-32 bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-24 bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
            <div className="h-12 bg-white rounded-lg border border-gray-200" />
            <div className="h-12 bg-white rounded-lg border border-gray-200" />
            <div className="h-16 bg-white rounded-lg border border-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
