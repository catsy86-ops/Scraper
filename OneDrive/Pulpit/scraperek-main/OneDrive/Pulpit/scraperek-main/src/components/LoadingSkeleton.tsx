import { motion } from "framer-motion";

const LoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Metadata skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-lg p-4 space-y-3"
      >
        <div className="h-3 w-20 bg-primary/10 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
      </motion.div>

      {/* Content skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-lg p-4 space-y-3"
      >
        <div className="h-3 w-24 bg-primary/10 rounded animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-3 bg-muted/30 rounded animate-pulse"
              style={{ width: `${60 + Math.random() * 40}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Scan line effect */}
      <div className="relative h-1 rounded overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        />
      </div>
    </div>
  );
};

export default LoadingSkeleton;
