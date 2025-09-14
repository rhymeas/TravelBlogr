import { Link, useLocation } from "wouter";
import { Home, Camera, Settings, Menu, X, Map } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Create navigation links with context-aware Reiseverlauf on home page
  const baseNavLinks = [
    { href: "/", label: "Startseite", icon: Home, type: "link" },
  ];

  const homePageScrollLinks = location === "/" ? [
    { href: "#timeline", label: "Reiseverlauf", icon: Map, type: "scroll", scrollTarget: "timeline" },
  ] : [];

  const otherNavLinks = [
    { href: "/live-feed", label: "Live Feed", icon: Camera, type: "link" },
    { href: "/admin", label: "Editieren", icon: Settings, type: "link" },
  ];

  const navLinks = [...baseNavLinks, ...homePageScrollLinks, ...otherNavLinks];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" data-testid="main-header">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-3 text-foreground" data-testid="header-logo">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">WT</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">Weinberg Tour 2025</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              
              if (link.type === "scroll") {
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection((link as any).scrollTarget || "timeline")}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                    data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </button>
                );
              }
              
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" data-testid="mobile-menu">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              
              if (link.type === "scroll") {
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection((link as any).scrollTarget || "timeline")}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                    data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </button>
                );
              }
              
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}