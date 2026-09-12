export function BookLayer() {
  return (
    <div className="pointer-events-none absolute left-[118px] right-0 top-0 z-30 h-[520px] overflow-visible">
      <img
        src="/assets/layers/book_foreground.svg"
        alt="立体地图书本前景"
        className="absolute right-[272px] top-[258px] w-[430px] select-none"
        draggable={false}
      />
    </div>
  );
}
