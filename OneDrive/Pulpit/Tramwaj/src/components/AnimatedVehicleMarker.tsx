import { useEffect, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import type L from "leaflet";

interface Props {
  position: [number, number];
  icon: L.DivIcon | L.Icon;
  zIndexOffset?: number;
  duration?: number;
  children?: React.ReactNode;
}

/**
 * Marker that smoothly tweens between position updates using requestAnimationFrame.
 * Falls back to instant placement on first render.
 */
const AnimatedVehicleMarker = ({
  position,
  icon,
  zIndexOffset,
  duration = 1200,
  children,
}: Props) => {
  const [pos, setPos] = useState<[number, number]>(position);
  const fromRef = useRef<[number, number]>(position);
  const toRef = useRef<[number, number]>(position);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      setPos(position);
      toRef.current = position;
      fromRef.current = position;
      return;
    }
    // Skip tween for tiny or huge jumps (teleports)
    const [fromLat, fromLon] = toRef.current;
    const [toLat, toLon] = position;
    const dLat = Math.abs(toLat - fromLat);
    const dLon = Math.abs(toLon - fromLon);
    if (dLat < 1e-6 && dLon < 1e-6) return;
    if (dLat > 0.05 || dLon > 0.05) {
      fromRef.current = position;
      toRef.current = position;
      setPos(position);
      return;
    }

    fromRef.current = pos;
    toRef.current = position;
    startRef.current = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (t: number) => {
      const elapsed = t - startRef.current;
      const k = Math.min(1, elapsed / duration);
      // ease-out cubic
      const e = 1 - Math.pow(1 - k, 3);
      const lat = fromRef.current[0] + (toRef.current[0] - fromRef.current[0]) * e;
      const lon = fromRef.current[1] + (toRef.current[1] - fromRef.current[1]) * e;
      setPos([lat, lon]);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1], duration]);

  return (
    <Marker position={pos} icon={icon} zIndexOffset={zIndexOffset}>
      {children}
    </Marker>
  );
};

export default AnimatedVehicleMarker;
