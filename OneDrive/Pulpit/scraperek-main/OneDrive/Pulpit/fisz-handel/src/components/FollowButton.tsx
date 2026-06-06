import { motion } from 'framer-motion';
import { UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  sellerId: string;
  variant?: 'default' | 'compact';
  showCount?: boolean;
}

const FollowButton = ({ sellerId, variant = 'default', showCount = false }: FollowButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { following, count, toggle } = useFollow(sellerId);

  if (user?.id === sellerId) return null;

  const handleClick = async () => {
    if (!user) { navigate('/auth'); return; }
    await toggle();
    toast({
      title: following ? 'Przestałeś obserwować' : 'Obserwujesz sprzedawcę ✨',
      description: following ? '' : 'Otrzymasz powiadomienie o nowych ogłoszeniach',
    });
  };

  return (
    <motion.div whileTap={{ scale: 0.96 }}>
      <Button
        variant={following ? 'secondary' : 'default'}
        size={variant === 'compact' ? 'sm' : 'default'}
        onClick={handleClick}
        className={`gap-2 rounded-xl ${!following ? 'bg-gradient-primary text-primary-foreground' : ''}`}
      >
        {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {following ? 'Obserwujesz' : 'Obserwuj'}
        {showCount && count > 0 && (
          <span className="text-xs opacity-80">· {count}</span>
        )}
      </Button>
    </motion.div>
  );
};

export default FollowButton;