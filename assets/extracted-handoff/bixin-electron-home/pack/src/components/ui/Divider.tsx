export function Divider({ vertical = false }: { vertical?: boolean }) {
  return vertical ? <span className="block h-full w-px bg-neutral-100" /> : <span className="block h-px w-full bg-neutral-100" />;
}
