import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Terminal, Lock, Mail } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      login(response.data.access_token, response.data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12" data-testid="login-page">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border border-accent-primary flex items-center justify-center">
              <Terminal className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-text-muted text-sm font-mono">
            // Access your terminal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-secondary text-sm font-mono">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="root@zerodaylog.com"
                className="input-field pl-12"
                required
                data-testid="login-email-input"
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field pl-12"
                required
                data-testid="login-password-input"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="btn-primary w-full"
            disabled={loading}
            data-testid="login-submit-btn"
          >
            {loading ? "Authenticating..." : "Login"}
          </Button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-text-muted text-sm">
            Don't have an account?{" "}
            <Link 
              to="/register" 
              className="text-accent-primary hover:underline font-mono"
              data-testid="login-register-link"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
