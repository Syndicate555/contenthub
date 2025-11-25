"use client";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-6 text-white shadow-lg animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-6 w-28 bg-white/20 rounded" />
            <div className="h-4 w-40 bg-white/10 rounded" />
          </div>
          <div className="h-12 w-16 bg-white/10 rounded" />
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-3 w-full bg-white/10 rounded" />
          <div className="h-3 w-3/4 bg-white/10 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm animate-pulse space-y-2"
          >
            <div className="h-5 w-12 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 w-full bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse" />
          <div className="h-80 w-full bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-56 w-full bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse" />
          <div className="h-40 w-full bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}
