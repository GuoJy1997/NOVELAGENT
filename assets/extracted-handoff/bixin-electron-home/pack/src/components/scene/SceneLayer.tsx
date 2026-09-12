export function SceneLayer() {
  return (
    <div className="pointer-events-none absolute left-[118px] right-0 top-0 z-10 h-[500px] overflow-hidden rounded-tr-[32px]">
      <img
        src="/assets/layers/scene_robot_background.png"
        alt="背景与机器人"
        className="h-full w-full object-cover object-center opacity-[0.98]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_35%,rgba(248,251,248,0.18)_100%)]" />
    </div>
  );
}
