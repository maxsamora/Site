import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { adminAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Shield, 
  Lock, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  LogOut,
  FileText,
  Settings
} from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout, checkSession, getAuthHeader } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [writeups, setWriteups] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkSession();
      setLoading(false);
    };
    init();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWriteups();
    }
  }, [isAuthenticated]);

  const fetchWriteups = async () => {
    try {
      const response = await adminAPI.getAllWriteups(getAuthHeader());
      setWriteups(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
      toast.error("Failed to fetch writeups");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    
    const success = await login(loginForm.username, loginForm.password);
    if (success) {
      toast.success("Logged in successfully");
      setLoginForm({ username: "", password: "" });
    }
    
    setLoggingIn(false);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    
    try {
      await adminAPI.deleteWriteup(id, getAuthHeader());
      toast.success("Writeup deleted");
      fetchWriteups();
    } catch (error) {
      toast.error("Failed to delete writeup");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted font-mono">Loading...</div>
      </div>
    );
  }

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12" data-testid="admin-login-page">
        <div className="w-full max-w-md px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 border border-accent-primary flex items-center justify-center">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
            </div>
            <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
              Admin Access
            </h1>
            <p className="text-text-muted text-sm font-mono">
              // Restricted area
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-text-secondary text-sm font-mono">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter username"
                  className="input-field pl-12"
                  required
                  autoComplete="username"
                  data-testid="admin-username-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-text-secondary text-sm font-mono">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pl-12"
                  required
                  autoComplete="current-password"
                  data-testid="admin-password-input"
                />
              </div>
            </div>

            {/* Honeypot field - hidden from users, bots will fill it */}
            <input 
              type="text" 
              name="website" 
              style={{ display: "none" }} 
              tabIndex={-1}
              autoComplete="off"
            />

            <Button 
              type="submit" 
              className="btn-primary w-full"
              disabled={loggingIn}
              data-testid="admin-login-btn"
            >
              {loggingIn ? "Authenticating..." : "Login"}
            </Button>
          </form>

          <p className="text-text-muted text-xs text-center mt-8 font-mono">
            This area is protected. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen py-12" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
              <span className="text-accent-primary">$</span>
              <span>sudo -i</span>
            </div>
            <h1 className="font-heading font-bold text-3xl text-text-primary flex items-center gap-2">
              <Shield className="w-8 h-8 text-accent-primary" />
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/writeup/new">
              <Button className="btn-primary" data-testid="admin-new-writeup-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Writeup
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-text-muted hover:text-accent-danger"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-background-surface border border-border p-6">
            <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">
              Total Writeups
            </p>
            <p className="text-accent-primary font-heading font-bold text-3xl">
              {writeups.length}
            </p>
          </div>
          <div className="bg-background-surface border border-border p-6">
            <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">
              Published
            </p>
            <p className="text-text-primary font-heading font-bold text-3xl">
              {writeups.filter(w => w.published).length}
            </p>
          </div>
          <div className="bg-background-surface border border-border p-6">
            <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">
              Drafts
            </p>
            <p className="text-text-primary font-heading font-bold text-3xl">
              {writeups.filter(w => !w.published).length}
            </p>
          </div>
        </div>

        {/* Writeups Table */}
        <div className="bg-background-surface border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-primary" />
              Manage Writeups
            </h2>
          </div>
          
          {writeups.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted font-mono">No writeups yet</p>
              <Link to="/admin/writeup/new">
                <Button className="btn-primary mt-4">
                  Create Your First Writeup
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {writeups.map((writeup) => (
                <div 
                  key={writeup.id} 
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-text-primary truncate">
                        {writeup.title}
                      </h3>
                      {!writeup.published && (
                        <span className="text-xs font-mono bg-accent-secondary/20 text-accent-secondary px-2 py-0.5">
                          DRAFT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-text-muted text-xs font-mono">
                      <span className={`capitalize ${
                        writeup.difficulty === "easy" ? "text-accent-primary" :
                        writeup.difficulty === "medium" ? "text-accent-secondary" :
                        writeup.difficulty === "hard" ? "text-orange-500" :
                        "text-accent-danger"
                      }`}>
                        {writeup.difficulty}
                      </span>
                      <span>{writeup.platform}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {writeup.views}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/writeup/${writeup.id}`} target="_blank">
                      <Button variant="ghost" size="sm" className="text-text-muted hover:text-accent-primary">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={`/admin/writeup/${writeup.id}`}>
                      <Button variant="ghost" size="sm" className="text-text-muted hover:text-accent-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-text-muted hover:text-accent-danger"
                      onClick={() => handleDelete(writeup.id, writeup.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
