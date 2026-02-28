import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { writeupAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import WriteupCard from "@/components/WriteupCard";
import { Button } from "@/components/ui/button";
import { Terminal, PenLine, User } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchMyWriteups = async () => {
      try {
        // Fetch all writeups and filter by author
        const response = await writeupAPI.getAll({ limit: 100 });
        const myWriteups = response.data.filter(w => w.author_id === user.id);
        setWriteups(myWriteups);
      } catch (error) {
        console.error("Failed to fetch writeups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyWriteups();
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen py-12" data-testid="profile-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Profile Header */}
        <div className="bg-background-surface border border-border p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 border border-accent-primary flex items-center justify-center">
              <User className="w-10 h-10 text-accent-primary" />
            </div>
            <div className="flex-grow">
              <h1 className="font-heading font-bold text-2xl text-text-primary mb-1">
                @{user.username}
              </h1>
              <p className="text-text-muted text-sm font-mono mb-2">{user.email}</p>
              <p className="text-text-secondary text-sm">
                Member since {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
            <Link to="/create">
              <Button className="btn-primary btn-skew" data-testid="profile-create-btn">
                <span className="flex items-center gap-2">
                  <PenLine className="w-4 h-4" />
                  New Writeup
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* My Writeups */}
        <div>
          <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
            My Writeups ({writeups.length})
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card-writeup animate-pulse">
                  <div className="h-4 bg-background-surface-highlight w-1/3 mb-4" />
                  <div className="h-6 bg-background-surface-highlight w-2/3 mb-2" />
                  <div className="h-4 bg-background-surface-highlight w-full mb-4" />
                  <div className="h-4 bg-background-surface-highlight w-1/2" />
                </div>
              ))}
            </div>
          ) : writeups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="profile-writeups">
              {writeups.map((writeup) => (
                <WriteupCard key={writeup.id} writeup={writeup} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-border bg-background-surface">
              <Terminal className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted font-mono mb-4">No writeups yet</p>
              <Link to="/create">
                <Button className="btn-primary" data-testid="profile-empty-create-btn">
                  Create Your First Writeup
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
