import { Link, useLocation } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Terminal, Menu, Shield, Search } from "lucide-react";
import { useState } from "react";
import SearchCommand from "./SearchCommand";

const Navbar = () => {
  const { isAuthenticated } = useAdmin();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/writeups", label: "Writeups" },
    { to: "/resources", label: "Resources" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-40 glass" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
            data-testid="nav-logo"
          >
            <Terminal className="w-6 h-6 text-accent-primary" />
            <span className="font-heading font-bold text-lg text-text-primary group-hover:text-accent-primary transition-colors duration-300">
              ZeroDay<span className="text-accent-primary">.log</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-mono uppercase tracking-wider transition-colors duration-300 ${
                  isActive(link.to) 
                    ? "text-accent-primary" 
                    : "text-text-secondary hover:text-accent-primary"
                }`}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-border hover:border-accent-primary/50 text-text-muted hover:text-accent-primary transition-all duration-300 group"
              data-testid="nav-search-btn"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-mono hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-text-muted group-hover:border-accent-primary/30">
                ⌘K
              </kbd>
            </button>
            
            {/* Admin indicator - only shown if authenticated */}
            {isAuthenticated && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-sm font-mono uppercase tracking-wider text-accent-primary"
                data-testid="nav-admin"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              className="text-text-secondary hover:text-accent-primary p-2"
              onClick={() => setSearchOpen(true)}
              data-testid="nav-mobile-search-btn"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="text-text-secondary hover:text-accent-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="nav-mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" data-testid="nav-mobile-menu">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-mono uppercase tracking-wider py-2 ${
                    isActive(link.to) 
                      ? "text-accent-primary" 
                      : "text-text-secondary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link 
                  to="/admin"
                  className="text-sm font-mono uppercase tracking-wider py-2 text-accent-primary flex items-center gap-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Global Search Dialog */}
      <SearchCommand open={searchOpen} setOpen={setSearchOpen} />
    </nav>
  );
};

export default Navbar;
