import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  delivery_address: string | null;
  delivery_city: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const OrderHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchOrders();
  }, [user, authLoading]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "⏳ Oczekujące",
      confirmed: "✅ Potwierdzone",
      shipped: "🚚 Wysłane",
      delivered: "📦 Dostarczone",
    };
    return map[status] || status;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Ładowanie... 🐟</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-12">
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-beer-amber hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do sklepu
        </Link>

        <h1 className="font-display text-4xl font-bold text-foreground mb-8">
          <Package className="inline h-8 w-8 mr-2" />
          Historia zamówień
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <p className="text-5xl mb-4">🐟</p>
            <p className="font-display text-xl text-foreground">Brak zamówień</p>
            <p className="text-muted-foreground mt-2">Czas na zakupy u Fisza!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.delivery_address && `${order.delivery_address}, ${order.delivery_city}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{statusLabel(order.status)}</span>
                    <p className="text-beer-amber font-bold text-xl mt-1">
                      {Number(order.total).toFixed(2)} zł
                    </p>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {(item.price * item.quantity).toFixed(2)} zł
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
