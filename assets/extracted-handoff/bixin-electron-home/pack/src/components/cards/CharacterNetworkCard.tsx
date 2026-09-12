import { Card } from '@/components/ui/Card';
import { characters } from '@/data/home';
import { Network } from 'lucide-react';

function AvatarNode({ name, role, x, y, color, center = false }: { name: string; role: string; x: number; y: number; color: string; center?: boolean }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <div
        className={center ? 'network-node network-node-center' : 'network-node'}
        style={center ? { boxShadow: `0 0 0 7px ${color}1A` } : { background: `linear-gradient(135deg, ${color}, #ffffff)` }}
      >
        <span>{name.slice(0, 1)}</span>
      </div>
      <div className="mt-2 text-[15px] font-semibold text-neutral-900">{name}</div>
      <div className="text-[13px] text-neutral-500">{role}</div>
    </div>
  );
}

export function CharacterNetworkCard() {
  return (
    <Card className="h-full overflow-hidden p-7">
      <div className="mb-4 flex items-center gap-3 text-[18px] font-semibold text-neutral-900">
        <Network size={20} className="text-bixin-600" />
        人物关系网
      </div>
      <div className="relative h-[188px] overflow-hidden rounded-[22px] bg-white/[0.24]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 220" preserveAspectRatio="none">
          <line x1="300" y1="100" x2="90" y2="48" stroke="#30b567" strokeWidth="2.2" strokeDasharray="5 5" />
          <line x1="300" y1="100" x2="96" y2="140" stroke="#794cff" strokeWidth="2.2" strokeDasharray="5 5" />
          <line x1="300" y1="100" x2="510" y2="48" stroke="#30b567" strokeWidth="2.2" strokeDasharray="5 5" />
          <line x1="300" y1="100" x2="505" y2="140" stroke="#f15b4c" strokeWidth="2.2" strokeDasharray="5 5" />
          <line x1="300" y1="100" x2="300" y2="185" stroke="#48a8ff" strokeWidth="2.2" strokeDasharray="5 5" />
        </svg>
        {characters.nodes.map((node) => (
          <AvatarNode key={node.name} {...node} />
        ))}
        <AvatarNode {...characters.center} x={50} y={46} color="#48be69" center />
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-[12px] text-neutral-500">
        {characters.legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="h-[2px] w-5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
