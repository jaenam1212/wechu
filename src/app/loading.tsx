/** 라우트 RSC 준비 중 즉시 표시 · 체감 전환 속도 완화 */
export default function AppLoading() {
  return (
    <div className="flex min-h-[30vh] w-full flex-col gap-5 px-5 py-12">
      <div className="h-9 w-[45%] max-w-[12rem] animate-pulse rounded-xl bg-zinc-200/80" />
      <div className="h-36 w-full max-w-lg animate-pulse rounded-2xl bg-zinc-200/70" />
      <div className="flex gap-3">
        <div className="h-24 flex-1 animate-pulse rounded-2xl bg-sky-100/80" />
        <div className="h-24 flex-1 animate-pulse rounded-2xl bg-sky-100/80" />
      </div>
    </div>
  );
}
