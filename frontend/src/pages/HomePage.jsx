import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { writeupAPI, statsAPI } from "@/lib/api";
import WriteupCard from "@/components/WriteupCard";
import { Button } from "@/components/ui/button";
import { Terminal, ChevronRight, Search, Shield, Code2, Lock } from "lucide-react";

const HomePage = () => {
  const [featuredWriteups, setFeaturedWriteups] = useState([]);
  const [latestWriteups, setLatestWriteups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, latestRes, statsRes] = await Promise.all([
          writeupAPI.getFeatured(),
          writeupAPI.getAll({ limit: 6 }),
          statsAPI.get()
        ]);
        setFeaturedWriteups(featuredRes.data);
        setLatestWriteups(latestRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="animate-in" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-6 font-mono text-sm text-text-muted">
              <span className="text-accent-primary">$</span>
              <span>cat /var/log/ctf/welcome.txt</span>
              <span className="terminal-cursor" />
            </div>

            <h1 className="font-heading font-black text-4xl md:text-6xl lg:text-7xl text-text-primary mb-6 tracking-tight">
              Crack. Document.
              <br />
              <span className="text-accent-primary">Share.</span>
            </h1>

            <p className="text-text-secondary text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              Welcome to ZeroDay.log — a personal archive of CTF writeups from 
              Hack The Box, Offensive Security, and beyond. Dive into detailed 
              solutions and learn the art of exploitation.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/archive">
                <Button className="btn-primary btn-skew" data-testid="hero-browse-btn">
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Browse Writeups
                  </span>
                </Button>
              </Link>
              <Link to="/resources">
                <Button className="btn-secondary" data-testid="hero-resources-btn">
                  View Resources
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="border-y border-border bg-background-surface">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center md:text-left" data-testid="stats-writeups">
                <p className="text-3xl md:text-4xl font-heading font-bold text-accent-primary">
                  {stats.writeup_count}
                </p>
                <p className="text-text-muted text-sm font-mono uppercase tracking-wider">
                  Writeups
                </p>
              </div>
              <div className="text-center md:text-left" data-testid="stats-users">
                <p className="text-3xl md:text-4xl font-heading font-bold text-text-primary">
                  {stats.user_count}
                </p>
                <p className="text-text-muted text-sm font-mono uppercase tracking-wider">
                  Members
                </p>
              </div>
              <div className="text-center md:text-left col-span-2 md:col-span-2">
                <p className="text-text-muted text-sm font-mono uppercase tracking-wider mb-2">
                  Popular Tags
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {stats.popular_tags.slice(0, 5).map((t) => (
                    <Link
                      key={t.tag}
                      to={`/archive?tag=${t.tag}`}
                      className="text-xs font-mono bg-background border border-border px-3 py-1 text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
                    >
                      #{t.tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Writeups */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary">
                Featured Writeups
              </h2>
              <p className="text-text-muted text-sm font-mono mt-1">
                // Most popular challenges
              </p>
            </div>
            <Link to="/archive" className="hidden md:block">
              <Button variant="ghost" className="text-text-secondary hover:text-accent-primary font-mono text-sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-writeup animate-pulse">
                  <div className="h-4 bg-background-surface-highlight w-1/3 mb-4" />
                  <div className="h-6 bg-background-surface-highlight w-2/3 mb-2" />
                  <div className="h-4 bg-background-surface-highlight w-full mb-4" />
                  <div className="h-4 bg-background-surface-highlight w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredWriteups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="featured-writeups">
              {featuredWriteups.map((writeup) => (
                <WriteupCard key={writeup.id} writeup={writeup} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-border bg-background-surface">
              <Terminal className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted font-mono">No writeups yet. Be the first to post!</p>
            </div>
          )}
        </div>
      </section>

      {/* Latest Writeups */}
      {latestWriteups.length > 0 && latestWriteups.length !== featuredWriteups.length && (
        <section className="py-16 md:py-24 bg-background-surface border-t border-border">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary">
                  Latest Posts
                </h2>
                <p className="text-text-muted text-sm font-mono mt-1">
                  // Fresh from the terminal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="latest-writeups">
              {latestWriteups.slice(0, 3).map((writeup) => (
                <WriteupCard key={writeup.id} writeup={writeup} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary mb-2">
              Why ZeroDay.log?
            </h2>
            <p className="text-text-muted text-sm font-mono">
              // The hacker's writeup platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background-surface border border-border p-8 group hover:border-accent-primary/50 transition-colors duration-300">
              <Shield className="w-10 h-10 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-lg text-text-primary mb-2">
                Detailed Solutions
              </h3>
              <p className="text-text-secondary text-sm">
                Step-by-step writeups with commands, screenshots, and explanations for every exploit.
              </p>
            </div>
            <div className="bg-background-surface border border-border p-8 group hover:border-accent-primary/50 transition-colors duration-300">
              <Code2 className="w-10 h-10 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-lg text-text-primary mb-2">
                Markdown Support
              </h3>
              <p className="text-text-secondary text-sm">
                Write beautiful writeups with full markdown support, code blocks, and syntax highlighting.
              </p>
            </div>
            <div className="bg-background-surface border border-border p-8 group hover:border-accent-primary/50 transition-colors duration-300">
              <Lock className="w-10 h-10 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-lg text-text-primary mb-2">
                Searchable Archive
              </h3>
              <p className="text-text-secondary text-sm">
                Find writeups by platform, difficulty, tags, or machine name. Never lose a solution again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-background-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary mb-4">
            Ready to document your exploits?
          </h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">
            Join the community and start sharing your CTF solutions today.
          </p>
          <Link to="/register">
            <Button className="btn-primary btn-skew" data-testid="cta-register-btn">
              <span>Get Started</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
