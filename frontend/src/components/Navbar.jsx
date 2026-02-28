import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Terminal, Menu, User, LogOut, PenLine, BookOpen } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/archive", label: "Archive" },
    { to: "/resources", label: "Resources" },
    { to: "/contact", label: "Contact" },
  ];

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
                className="text-text-secondary hover:text-accent-primary transition-colors duration-300 text-sm font-mono uppercase tracking-wider"
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/create">
                  <Button 
                    className="btn-primary btn-skew"
                    data-testid="nav-create-btn"
                  >
                    <span className="flex items-center gap-2">
                      <PenLine className="w-4 h-4" />
                      New Writeup
                    </span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-text-secondary hover:text-accent-primary"
                      data-testid="nav-user-menu"
                    >
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background-surface border-border">
                    <DropdownMenuItem className="text-text-secondary">
                      <span className="font-mono text-xs text-accent-primary">@{user?.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="nav-profile-link">
                        <BookOpen className="w-4 h-4" />
                        My Writeups
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-accent-danger cursor-pointer"
                      data-testid="nav-logout-btn"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="text-text-secondary hover:text-accent-primary font-mono text-sm"
                    data-testid="nav-login-btn"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    className="btn-primary btn-skew"
                    data-testid="nav-register-btn"
                  >
                    <span>Register</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-secondary hover:text-accent-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="nav-mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" data-testid="nav-mobile-menu">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-text-secondary hover:text-accent-primary transition-colors duration-300 text-sm font-mono uppercase tracking-wider py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border pt-4 mt-2">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/create" 
                      className="block py-2 text-accent-primary font-mono text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      + New Writeup
                    </Link>
                    <Link 
                      to="/profile" 
                      className="block py-2 text-text-secondary font-mono text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Writeups
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block py-2 text-accent-danger font-mono text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="block py-2 text-text-secondary font-mono text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="block py-2 text-accent-primary font-mono text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
