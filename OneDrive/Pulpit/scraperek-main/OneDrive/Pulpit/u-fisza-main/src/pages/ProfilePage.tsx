import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, User } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import LoyaltyCard from "@/components/LoyaltyCard";

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setPostalCode(data.postal_code || "");
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        address,
        city,
        postal_code: postalCode,
      })
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Błąd przy zapisywaniu profilu 😢");
    } else {
      toast.success("Profil zaktualizowany! 🐟✅");
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Ładowanie... 🐟</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-lg">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-beer-amber hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do sklepu
          </Link>

          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-beer-amber to-beer-gold flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-beer-dark" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Mój profil</h1>
            <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
          </div>

          <form onSubmit={handleSave} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Imię i nazwisko</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="Jan Kowalski"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="+48 123 456 789"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Adres</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="ul. Piwna 7"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-foreground mb-1">Miasto</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  placeholder="Warszawa"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-semibold text-foreground mb-1">Kod</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                  placeholder="00-001"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-beer-amber to-beer-gold text-beer-dark font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {saving ? "Zapisywanie..." : "Zapisz profil"}
            </button>
          </form>

          {/* Loyalty Card */}
          <div className="mt-8">
            <LoyaltyCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
