export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-navy-900 py-10">
        <div className="page-container">
          <div className="h-4 w-48 bg-navy-700 rounded animate-pulse mb-3" />
          <div className="h-8 w-64 bg-navy-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="page-container py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-5" />
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="order-first lg:order-last">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-20 bg-gray-100 rounded-lg animate-pulse mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
