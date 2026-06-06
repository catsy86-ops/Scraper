import { useState } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

const BlurImage = ({ src, alt, className, containerClassName, ...props }: BlurImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Blur placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-beer-foam/60 via-muted/40 to-beer-amber/10 transition-opacity duration-700",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-all duration-700",
          isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105",
          className
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
};

export default BlurImage;
