import { useState } from 'react';
import { motion } from 'framer-motion';

// Polish voivodeships with simplified SVG paths
const voivodeships: { id: string; name: string; path: string; labelX: number; labelY: number }[] = [
  { id: 'dolnoslaskie', name: 'Dolnośląskie', path: 'M120,340 L155,310 L190,315 L200,340 L195,370 L160,385 L125,375 Z', labelX: 158, labelY: 350 },
  { id: 'kujawsko-pomorskie', name: 'Kujawsko-pomorskie', path: 'M220,170 L270,155 L310,165 L315,200 L290,225 L245,230 L215,210 Z', labelX: 265, labelY: 192 },
  { id: 'lubelskie', name: 'Lubelskie', path: 'M370,260 L420,240 L450,270 L455,330 L430,370 L380,360 L360,310 Z', labelX: 410, labelY: 305 },
  { id: 'lubuskie', name: 'Lubuskie', path: 'M70,240 L110,220 L135,240 L140,280 L120,310 L85,305 L65,275 Z', labelX: 102, labelY: 270 },
  { id: 'lodzkie', name: 'Łódzkie', path: 'M260,270 L310,255 L340,275 L335,320 L300,340 L260,325 L250,295 Z', labelX: 295, labelY: 298 },
  { id: 'malopolskie', name: 'Małopolskie', path: 'M280,380 L325,365 L370,375 L380,405 L345,425 L300,420 L275,400 Z', labelX: 328, labelY: 398 },
  { id: 'mazowieckie', name: 'Mazowieckie', path: 'M300,195 L360,180 L400,200 L405,255 L370,280 L320,275 L295,240 Z', labelX: 350, labelY: 235 },
  { id: 'opolskie', name: 'Opolskie', path: 'M195,350 L230,335 L260,350 L255,380 L225,395 L195,385 Z', labelX: 225, labelY: 365 },
  { id: 'podkarpackie', name: 'Podkarpackie', path: 'M380,360 L430,350 L465,375 L460,415 L425,435 L385,420 L370,390 Z', labelX: 420, labelY: 392 },
  { id: 'podlaskie', name: 'Podlaskie', path: 'M380,120 L430,100 L465,130 L460,190 L420,210 L380,195 L370,155 Z', labelX: 420, labelY: 158 },
  { id: 'pomorskie', name: 'Pomorskie', path: 'M190,70 L240,55 L280,75 L275,130 L240,150 L195,140 L180,105 Z', labelX: 232, labelY: 105 },
  { id: 'slaskie', name: 'Śląskie', path: 'M230,355 L265,345 L285,365 L280,400 L250,410 L225,395 Z', labelX: 255, labelY: 378 },
  { id: 'swietokrzyskie', name: 'Świętokrzyskie', path: 'M320,310 L360,295 L385,315 L380,350 L350,365 L320,350 Z', labelX: 350, labelY: 332 },
  { id: 'warminsko-mazurskie', name: 'Warmińsko-mazurskie', path: 'M290,65 L350,50 L400,70 L405,125 L370,150 L315,145 L285,115 Z', labelX: 345, labelY: 100 },
  { id: 'wielkopolskie', name: 'Wielkopolskie', path: 'M140,215 L200,195 L250,210 L260,265 L235,305 L185,310 L145,280 Z', labelX: 200, labelY: 258 },
  { id: 'zachodniopomorskie', name: 'Zachodnio-pomorskie', path: 'M70,80 L130,60 L175,80 L185,140 L155,180 L105,185 L60,155 L55,115 Z', labelX: 118, labelY: 125 },
];

interface PolandMapProps {
  selected: string | null;
  onSelect: (voivodeship: string | null) => void;
}

const PolandMap = ({ selected, onSelect }: PolandMapProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative">
      <svg
        viewBox="30 30 460 430"
        className="w-full h-auto max-h-[320px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {voivodeships.map((v) => {
          const isSelected = selected === v.name;
          const isHovered = hovered === v.id;

          return (
            <motion.g key={v.id}>
              <motion.path
                d={v.path}
                className="cursor-pointer transition-colors duration-150"
                fill={
                  isSelected
                    ? 'hsl(var(--primary))'
                    : isHovered
                    ? 'hsl(var(--primary) / 0.3)'
                    : 'hsl(var(--muted))'
                }
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
                onMouseEnter={() => setHovered(v.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(isSelected ? null : v.name)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{ transformOrigin: `${v.labelX}px ${v.labelY}px` }}
              />
              <text
                x={v.labelX}
                y={v.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
                fontSize={9}
                fontWeight={isSelected ? 700 : 500}
                fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground) / 0.7)'}
              >
                {v.name.length > 14 ? v.name.slice(0, 12) + '…' : v.name}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-md hover:bg-primary/90 transition-colors"
          >
            {selected} ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default PolandMap;
export { voivodeships };
