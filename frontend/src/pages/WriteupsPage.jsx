import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { writeupAPI, statsAPI } from "@/lib/api";
import WriteupCard from "@/components/WriteupCard";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Terminal, X, Filter, Tag, TrendingUp } from "lucide-react";

const WriteupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [writeups, setWriteups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "");
  const [skill, setSkill] = useState(searchParams.get("skill") || "");
  const [osType, setOsType] = useState(searchParams.get("os_type") || "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get("search")) params.search = searchParams.get("search");
      if (searchParams.get("difficulty")) params.difficulty = searchParams.get("difficulty");
      if (searchParams.get("platform")) params.platform = searchParams.get("platform");
      if (searchParams.get("skill")) params.skill = searchParams.get("skill");
      if (searchParams.get("tag")) params.tag = searchParams.get("tag");
      if (searchParams.get("os_type")) params.os_type = searchParams.get("os_type");

      const [writeupsRes, statsRes] = await Promise.all([
        writeupAPI.getAll(params),
        statsAPI.get()
      ]);
      setWriteups(writeupsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search });
  };

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch("");
    setDifficulty("");
    setPlatform("");
    setSkill("");
    setOsType("");
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = search || difficulty || platform || skill || osType || searchParams.get("tag");

  const difficultyColors = {
    easy: "text-accent-primary border-accent-primary",
    medium: "text-accent-secondary border-accent-secondary",
    hard: "text-orange-500 border-orange-500",
    insane: "text-accent-danger border-accent-danger"
  };

  return (
    <div className="min-h-screen py-12" data-testid="writeups-page">
      <SEO 
        title="Writeups"
        description="CTF writeups and penetration testing walkthroughs. Detailed exploits for Hack The Box, Proving Grounds, and more."
      />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
            <span className="text-accent-primary">$</span>
            <span>find /writeups -type f | grep -i exploit</span>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary">
            Writeup Archive
          </h1>
          <p className="text-text-muted mt-2">
            Detailed walkthroughs of CTF machines and challenges
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Stats & Filters */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-background-surface border border-border p-4">
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm">Total Machines</span>
                  <span className="text-accent-primary font-mono font-bold">
                    {stats?.machines_owned || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm">Total Views</span>
                  <span className="text-text-primary font-mono">
                    {stats?.total_views || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="bg-background-surface border border-border p-4">
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4">
                By Difficulty
              </h3>
              <div className="space-y-2">
                {["easy", "medium", "hard", "insane"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => updateParams({ difficulty: difficulty === diff ? "" : diff })}
                    className={`w-full flex justify-between items-center px-3 py-2 border transition-colors ${
                      difficulty === diff
                        ? difficultyColors[diff] + " bg-white/5"
                        : "border-border text-text-muted hover:border-text-muted"
                    }`}
                    data-testid={`filter-difficulty-${diff}`}
                  >
                    <span className="capitalize text-sm">{diff}</span>
                    <span className="font-mono text-xs">
                      {stats?.difficulty_distribution?.[diff] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Filter */}
            <div className="bg-background-surface border border-border p-4">
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4">
                By Platform
              </h3>
              <div className="space-y-2">
                {[
                  { key: "htb", label: "Hack The Box" },
                  { key: "proving_grounds", label: "Proving Grounds" },
                  { key: "other", label: "Other" }
                ].map((plat) => (
                  <button
                    key={plat.key}
                    onClick={() => updateParams({ platform: platform === plat.key ? "" : plat.key })}
                    className={`w-full flex justify-between items-center px-3 py-2 border transition-colors text-sm ${
                      platform === plat.key
                        ? "border-accent-primary text-accent-primary bg-white/5"
                        : "border-border text-text-muted hover:border-text-muted"
                    }`}
                    data-testid={`filter-platform-${plat.key}`}
                  >
                    <span>{plat.label}</span>
                    <span className="font-mono text-xs">
                      {stats?.platform_distribution?.[plat.key] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* OS Filter */}
            <div className="bg-background-surface border border-border p-4">
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4">
                By OS
              </h3>
              <div className="flex gap-2">
                {["linux", "windows"].map((os) => (
                  <button
                    key={os}
                    onClick={() => updateParams({ os_type: osType === os ? "" : os })}
                    className={`flex-1 px-3 py-2 border transition-colors text-sm capitalize ${
                      osType === os
                        ? "border-accent-primary text-accent-primary bg-white/5"
                        : "border-border text-text-muted hover:border-text-muted"
                    }`}
                    data-testid={`filter-os-${os}`}
                  >
                    {os}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Skills */}
            {stats?.popular_skills?.length > 0 && (
              <div className="bg-background-surface border border-border p-4">
                <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Popular Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.popular_skills.slice(0, 8).map((s) => (
                    <button
                      key={s.skill}
                      onClick={() => updateParams({ skill: skill === s.skill ? "" : s.skill })}
                      className={`text-xs font-mono px-2 py-1 transition-colors ${
                        skill === s.skill
                          ? "bg-accent-primary text-black"
                          : "bg-background border border-border text-text-muted hover:border-accent-primary hover:text-accent-primary"
                      }`}
                    >
                      {s.skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {stats?.popular_tags?.length > 0 && (
              <div className="bg-background-surface border border-border p-4">
                <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.popular_tags.slice(0, 10).map((t) => (
                    <Link
                      key={t.tag}
                      to={`/writeups?tag=${t.tag}`}
                      className={`text-xs font-mono px-2 py-1 transition-colors ${
                        searchParams.get("tag") === t.tag
                          ? "bg-accent-primary text-black"
                          : "bg-background border border-border text-text-muted hover:border-accent-primary hover:text-accent-primary"
                      }`}
                    >
                      #{t.tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full text-text-muted hover:text-accent-danger font-mono text-sm"
                data-testid="clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Search by title, machine name, CVE..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-12 w-full"
                    data-testid="writeups-search-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="btn-primary"
                  data-testid="writeups-search-btn"
                >
                  Search
                </Button>
              </form>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {difficulty && (
                  <span className="text-xs font-mono bg-background-surface border border-border px-3 py-1 text-text-secondary flex items-center gap-2">
                    Difficulty: {difficulty}
                    <button onClick={() => updateParams({ difficulty: "" })} className="text-text-muted hover:text-accent-danger">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {platform && (
                  <span className="text-xs font-mono bg-background-surface border border-border px-3 py-1 text-text-secondary flex items-center gap-2">
                    Platform: {platform}
                    <button onClick={() => updateParams({ platform: "" })} className="text-text-muted hover:text-accent-danger">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {skill && (
                  <span className="text-xs font-mono bg-background-surface border border-border px-3 py-1 text-text-secondary flex items-center gap-2">
                    Skill: {skill}
                    <button onClick={() => updateParams({ skill: "" })} className="text-text-muted hover:text-accent-danger">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Count */}
            <p className="text-text-muted text-sm font-mono mb-4">
              {writeups.length} writeup{writeups.length !== 1 ? "s" : ""} found
            </p>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-writeup animate-pulse">
                    <div className="h-4 bg-background-surface-highlight w-1/3 mb-4" />
                    <div className="h-6 bg-background-surface-highlight w-2/3 mb-2" />
                    <div className="h-4 bg-background-surface-highlight w-full mb-4" />
                    <div className="h-4 bg-background-surface-highlight w-1/2" />
                  </div>
                ))}
              </div>
            ) : writeups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="writeups-list">
                {writeups.map((writeup) => (
                  <WriteupCard key={writeup.id} writeup={writeup} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-border bg-background-surface">
                <Terminal className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted font-mono mb-2">No writeups found</p>
                <p className="text-text-muted text-sm">
                  {hasFilters ? "Try adjusting your filters" : "Check back soon for new content!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteupsPage;
