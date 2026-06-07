import { useState } from "react";
import { Menu, X, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";
import duckLogo from "@/assets/duck-logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { label: "Na żywo", href: "#realtime" },
  { label: "Rozkłady", href: "#rozklady" },
  { label: "Tramwaje", href: "#tramwaje" },
  { label: "Autobusy", href: "#autobusy" },
  { label: "Mapa", href: "#mapa" },
  { label: "Kontakt", href: "#kontakt" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <a href="/" className="flex items-center gap-2">
          <img src={duckLogo} alt="KaczTransit logo" width={44} height={44} />
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            Kacz<span className="text-primary">Transit</span>
          </span>
        </a>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <Link to="/compare" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary font-medium transition-colors">
              <ArrowLeftRight size={16} /> Porównaj
            </Link>
          </li>
        </ul>
        <ThemeToggle />

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground p-2"
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-b">
          <ul className="flex flex-col py-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-6 py-3 text-muted-foreground hover:text-primary hover:bg-muted transition-colors font-medium"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
