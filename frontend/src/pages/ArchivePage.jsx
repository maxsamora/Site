import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { writeupAPI } from "@/lib/api";
import WriteupCard from "@/components/WriteupCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Terminal, X, Filter } from "lucide-react";

const ArchivePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "");
  const [tag, setTag] = useState(searchParams.get("tag") || "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchWriteups();
  }, [searchParams]);

  const fetchWriteups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get("search")) params.search = searchParams.get("search");
      if (searchParams.get("difficulty")) params.difficulty = searchParams.get("difficulty");
      if (searchParams.get("platform")) params.platform = searchParams.get("platform");
      if (searchParams.get("tag")) params.tag = searchParams.get("tag");

      const response = await writeupAPI.getAll(params);
      setWriteups(response.data);
    } catch (error) {
      console.error("Failed to fetch writeups:", error);
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
    setTag("");
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = search || difficulty || platform || tag;

  return (
    <div className="min-h-screen py-12" data-testid="archive-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
            <span className="text-accent-primary">$</span>
            <span>find /writeups -type f</span>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary">
            Writeup Archive
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="text"
                placeholder="Search writeups by title, machine name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12 w-full"
                data-testid="archive-search-input"
              />
            </div>
            <Button 
              type="submit" 
              className="btn-primary"
              data-testid="archive-search-btn"
            >
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-secondary md:hidden"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="archive-filter-toggle"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Filters */}
        <div className={`mb-8 ${showFilters ? "block" : "hidden md:block"}`}>
          <div className="flex flex-wrap gap-4 items-center">
            <Select
              value={difficulty}
              onValueChange={(value) => {
                setDifficulty(value);
                updateParams({ difficulty: value });
              }}
            >
              <SelectTrigger 
                className="w-40 input-field"
                data-testid="archive-difficulty-select"
              >
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-background-surface border-border">
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="insane">Insane</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={platform}
              onValueChange={(value) => {
                setPlatform(value);
                updateParams({ platform: value });
              }}
            >
              <SelectTrigger 
                className="w-40 input-field"
                data-testid="archive-platform-select"
              >
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="bg-background-surface border-border">
                <SelectItem value="htb">Hack The Box</SelectItem>
                <SelectItem value="offsec">OffSec</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Filter by tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onBlur={() => updateParams({ tag })}
              onKeyDown={(e) => e.key === "Enter" && updateParams({ tag })}
              className="input-field w-40"
              data-testid="archive-tag-input"
            />

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-text-muted hover:text-accent-danger font-mono text-sm"
                data-testid="archive-clear-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
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
        ) : writeups.length > 0 ? (
          <>
            <p className="text-text-muted text-sm font-mono mb-4">
              {writeups.length} writeup{writeups.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="archive-writeups">
              {writeups.map((writeup) => (
                <WriteupCard key={writeup.id} writeup={writeup} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 border border-border bg-background-surface">
            <Terminal className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted font-mono mb-2">No writeups found</p>
            <p className="text-text-muted text-sm">
              {hasFilters ? "Try adjusting your filters" : "Be the first to post a writeup!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
