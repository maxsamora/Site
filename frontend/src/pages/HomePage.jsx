import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { writeupAPI, statsAPI } from "@/lib/api";
import WriteupCard from "@/components/WriteupCard";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, 
  ChevronRight, 
  Shield, 
  Target,
  Server,
  Award,
  Eye,
  TrendingUp,
  Tag
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredWriteups, setFeaturedWriteups] = useState([]);
  const [stats, setStats] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const fullText = "Documenting real-world CTF exploitation, privilege escalation, Active Directory attacks, and offensive security research.";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, statsRes, tagsRes] = await Promise.all([
          writeupAPI.getFeatured(),
          statsAPI.get(),
          fetch(`${API_URL}/api/tags/popular?limit=8`).then(r => r.json())
        ]);
        setFeaturedWriteups(featuredRes.data);
        setStats(statsRes.data);
        setPopularTags(tagsRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Typing effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, []);

  const difficultyColors = {
    easy: "text-accent-primary",
    medium: "text-accent-secondary",
    hard: "text-orange-500",
    insane: "text-accent-danger"
  };

  return (
    <div className="animate-in" data-testid="home-page">
      <SEO />
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="hero-glow absolute inset-0" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-7">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 mb-4 font-mono text-sm text-text-muted">
                <span className="text-accent-primary">$</span>
                <span>whoami</span>
              </div>

              <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-text-primary mb-4 tracking-tight">
                Maxwell Ferreira
              </h1>
              
              <p className="text-accent-primary font-mono text-lg mb-6">
                Offensive Security | Penetration Testing | Red Team Journey
              </p>

              <p className="text-text-secondary text-lg leading-relaxed mb-8 min-h-[60px]">
                {typedText}
                <span className="terminal-cursor" />
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/writeups">
                  <Button className="btn-primary btn-skew" data-testid="hero-browse-btn">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      View Writeups
                    </span>
                  </Button>
                </Link>
                <Link to="/about">
                  <Button className="btn-secondary" data-testid="hero-about-btn">
                    About Me
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Stats Dashboard */}
            <div className="lg:col-span-5">
              <div className="bg-background-surface border border-border p-6">
                <div className="flex items-center gap-2 mb-6 font-mono text-xs text-text-muted uppercase tracking-wider">
                  <Target className="w-4 h-4 text-accent-primary" />
                  Progress Dashboard
                </div>

                {/* Machines Owned */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-muted text-sm font-mono">Machines Owned</span>
                    <span className="text-accent-primary font-heading font-bold text-3xl">
                      {stats?.machines_owned || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-background border border-border">
                    <div 
                      className="h-full bg-accent-primary transition-all duration-1000"
                      style={{ width: `${Math.min((stats?.machines_owned || 0) * 2, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="mb-6">
                  <span className="text-text-muted text-xs font-mono uppercase tracking-wider block mb-3">
                    Difficulty Breakdown
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {["easy", "medium", "hard", "insane"].map((diff) => (
                      <div key={diff} className="text-center">
                        <p className={`font-heading font-bold text-xl ${difficultyColors[diff]}`}>
                          {stats?.difficulty_distribution?.[diff] || 0}
                        </p>
                        <p className="text-text-muted text-xs capitalize">{diff}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background border border-border p-4 text-center">
                    <p className="text-green-400 font-heading font-bold text-xl">
                      {stats?.platform_distribution?.htb || 0}
                    </p>
                    <p className="text-text-muted text-xs font-mono">Hack The Box</p>
                  </div>
                  <div className="bg-background border border-border p-4 text-center">
                    <p className="text-orange-400 font-heading font-bold text-xl">
                      {stats?.platform_distribution?.proving_grounds || 0}
                    </p>
                    <p className="text-text-muted text-xs font-mono">Proving Grounds</p>
                  </div>
                </div>

                {/* Total Views */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-text-muted text-sm">
                    <Eye className="w-4 h-4" />
                    Total Views
                  </div>
                  <span className="text-text-primary font-mono">{stats?.total_views || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OSCP Journey Banner */}
      <section className="border-y border-border bg-background-surface">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-accent-primary flex items-center justify-center">
                <Award className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <p className="text-text-primary font-heading font-bold">OSCP Journey</p>
                <p className="text-text-muted text-sm">Preparing for Offensive Security Certified Professional</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm font-mono">
              <div className="text-center">
                <p className="text-accent-primary font-bold">{stats?.machines_owned || 0}/50</p>
                <p className="text-text-muted text-xs">Lab Progress</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-text-primary font-bold">Active</p>
                <p className="text-text-muted text-xs">Status</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Skills */}
      {stats?.popular_skills?.length > 0 && (
        <section className="py-12 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
              <span className="text-text-muted text-sm font-mono uppercase tracking-wider">
                Skills Demonstrated
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {stats.popular_skills.map((s) => (
                <Link
                  key={s.skill}
                  to={`/writeups?skill=${s.skill}`}
                  className="bg-background-surface border border-border px-4 py-2 text-sm font-mono text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
                >
                  {s.skill}
                  <span className="text-text-muted ml-2">({s.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Tags */}
      {popularTags?.length > 0 && (
        <section className="py-12 border-b border-border" data-testid="popular-tags-section">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-5 h-5 text-accent-primary" />
              <span className="text-text-muted text-sm font-mono uppercase tracking-wider">
                Popular Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((t) => (
                <Badge
                  key={t.tag}
                  variant="outline"
                  className="cursor-pointer border-border hover:border-accent-primary hover:text-accent-primary transition-colors px-3 py-1.5 text-sm font-mono"
                  onClick={() => navigate(`/writeups?tag=${encodeURIComponent(t.tag)}`)}
                  data-testid={`tag-${t.tag}`}
                >
                  #{t.tag}
                  <span className="text-text-muted ml-1.5">({t.count})</span>
                </Badge>
              ))}
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
                Recent Writeups
              </h2>
              <p className="text-text-muted text-sm font-mono mt-1">
                // Latest documented exploits
              </p>
            </div>
            <Link to="/writeups" className="hidden md:block">
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
              <p className="text-text-muted font-mono">No writeups yet. Starting the journey!</p>
            </div>
          )}
        </div>
      </section>

      {/* Skills & Focus Areas */}
      <section className="py-16 md:py-24 bg-background-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary mb-2">
              Focus Areas
            </h2>
            <p className="text-text-muted text-sm font-mono">
              // Core offensive security competencies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background border border-border p-6 group hover:border-accent-primary/50 transition-colors duration-300">
              <Shield className="w-8 h-8 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-text-primary mb-2">
                Web Exploitation
              </h3>
              <p className="text-text-muted text-sm">
                SQLi, XSS, SSTI, SSRF, Authentication Bypass
              </p>
            </div>
            <div className="bg-background border border-border p-6 group hover:border-accent-primary/50 transition-colors duration-300">
              <Server className="w-8 h-8 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-text-primary mb-2">
                Active Directory
              </h3>
              <p className="text-text-muted text-sm">
                Kerberoasting, AS-REP Roasting, DCSync, Pass-the-Hash
              </p>
            </div>
            <div className="bg-background border border-border p-6 group hover:border-accent-primary/50 transition-colors duration-300">
              <Terminal className="w-8 h-8 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-text-primary mb-2">
                Linux Privilege Escalation
              </h3>
              <p className="text-text-muted text-sm">
                SUID, Capabilities, Kernel Exploits, Cron Jobs
              </p>
            </div>
            <div className="bg-background border border-border p-6 group hover:border-accent-primary/50 transition-colors duration-300">
              <Target className="w-8 h-8 text-accent-primary mb-4" />
              <h3 className="font-heading font-bold text-text-primary mb-2">
                Windows Privilege Escalation
              </h3>
              <p className="text-text-muted text-sm">
                Token Impersonation, Service Exploits, UAC Bypass
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary mb-4">
                Looking to hire a pentester?
              </h2>
              <p className="text-text-secondary mb-6">
                I'm actively seeking opportunities in offensive security. 
                Let's discuss how I can contribute to your red team.
              </p>
              <Link to="/contact">
                <Button className="btn-primary btn-skew" data-testid="cta-contact-btn">
                  <span>Get In Touch</span>
                </Button>
              </Link>
            </div>
            <div className="bg-background-surface border border-border p-6">
              <pre className="font-mono text-sm text-text-muted overflow-x-auto">
{`$ cat /etc/profile
# Maxwell Ferreira
# ---------------
ROLE="Offensive Security"
FOCUS="Red Team | Pentesting"
STATUS="Open to opportunities"
CERT_GOAL="OSCP"

export PATH=$PATH:/skills/web
export PATH=$PATH:/skills/ad
export PATH=$PATH:/skills/privesc`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
