// Skeleton fallback while the dashboard's parallel queries complete.
// Mirrors the bento grid so the layout doesn't jump on first paint.

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg p-4 md:p-10">
      <div className="max-w-[1100px] mx-auto">
        <div className="h-8 w-48 bg-line/60 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-72 bg-line/40 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(140px,auto)] gap-4">
          <div className="md:col-span-2 md:row-span-2 min-h-[300px] rounded-[24px] bg-line/40 animate-pulse" />
          <div className="md:col-span-2 rounded-[24px] bg-line/40 animate-pulse min-h-[140px]" />
          <div className="md:col-span-2 rounded-[24px] bg-line/40 animate-pulse min-h-[140px]" />
          <div className="rounded-[24px] bg-line/40 animate-pulse min-h-[140px]" />
          <div className="rounded-[24px] bg-line/40 animate-pulse min-h-[140px]" />
          <div className="rounded-[24px] bg-line/40 animate-pulse min-h-[140px]" />
          <div className="rounded-[24px] bg-line/40 animate-pulse min-h-[140px]" />
        </div>
      </div>
    </div>
  );
}
