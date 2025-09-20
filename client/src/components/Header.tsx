import { Link, useLocation } from "wouter";
import { Home, Camera, Settings, Menu, X, Map } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TourSettings } from "@shared/schema";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch tour settings to get the current tour name
  const { data: tourSettings } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  // Helper function to extract initials from tour name
  const getInitialsFromTourName = (tourName: string | undefined): string => {
    if (!tourName) return "WT"; // Default fallback
    
    // Split by spaces and get first two words
    const words = tourName.trim().split(/\s+/);
    
    if (words.length === 0) return "WT";
    
    if (words.length === 1) {
      // If only one word, take first two characters
      const word = words[0].toUpperCase();
      return word.length >= 2 ? word.substring(0, 2) : word + "T";
    }
    
    // Take first letter of first two words
    const firstInitial = words[0].charAt(0).toUpperCase();
    const secondInitial = words[1].charAt(0).toUpperCase();
    
    return firstInitial + secondInitial;
  };

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
              <span className="text-primary-foreground font-bold text-sm" data-testid="header-logo-initials">
                {getInitialsFromTourName(tourSettings?.tourName)}
              </span>
            </div>
            <span className="font-semibold text-lg hidden sm:block" data-testid="header-tour-name">
              {tourSettings?.tourName || 'Weinberg Tour 2025'}
            </span>
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

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Live Feed Button */}
            <Link
              href="/live-feed"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/live-feed")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="mobile-live-feed-button"
              aria-label="Live Feed"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Live Feed</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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