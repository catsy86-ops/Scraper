import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const getTimeUntilFriday17 = (): { days: number; hours: number; mins: number; secs: number; reached: boolean } => {
  const now = new Date();
  const target = new Date(now);
  const currentDay = target.getDay(); // 0=Sun, 5=Fri
  let daysUntil = 5 - currentDay;
  if (daysUntil < 0 || (daysUntil === 0 && target.getHours() >= 17)) {
    daysUntil += 7;
  }
  target.setDate(target.getDate() + daysUntil);
  target.setHours(17, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, reached: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return { days, hours, mins, secs, reached: false };
};

const pad = (n: number) => String(n).padStart(2, "0");

const FridayCountdown = () => {
  const [time, setTime] = useState(getTimeUntilFriday17);

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeUntilFriday17), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      {time.reached ? (
        <p className="text-beer-gold font-bold text-sm animate-pulse">
          🎉 JEST PIĄTEK PO 17! FISZ JUŻ TAŃCZY! 🍻
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2 text-beer-foam/50 text-xs">
          <span>🍺 Do piątku 17:00:</span>
          <span className="font-mono text-beer-gold font-bold">
            {time.days > 0 && `${time.days}d `}{pad(time.hours)}:{pad(time.mins)}:{pad(time.secs)}
          </span>
          <span>🍺</span>
        </div>
      )}
    </motion.div>
  );
};

export default FridayCountdown;
