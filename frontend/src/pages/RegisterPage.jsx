import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Terminal, Lock, Mail, User } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      login(response.data.access_token, response.data.user);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12" data-testid="register-page">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border border-accent-primary flex items-center justify-center">
              <Terminal className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-text-muted text-sm font-mono">
            // Initialize new user
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-text-secondary text-sm font-mono">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="l33thacker"
                className="input-field pl-12"
                required
                data-testid="register-username-input"
              />
            </div>
          </div>

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
                data-testid="register-email-input"
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
                data-testid="register-password-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-text-secondary text-sm font-mono">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field pl-12"
                required
                data-testid="register-confirm-password-input"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="btn-primary w-full"
            disabled={loading}
            data-testid="register-submit-btn"
          >
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-text-muted text-sm">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-accent-primary hover:underline font-mono"
              data-testid="register-login-link"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
