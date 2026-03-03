import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { writeupAPI, resourceAPI } from "@/lib/api";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  FileText, 
  Wrench, 
  Search, 
  Tag, 
  Shield,
  Clock,
  ExternalLink
} from "lucide-react";

const SearchCommand = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [writeups, setWriteups] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  // Debounced search
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setWriteups([]);
        setResources([]);
        return;
      }

      setLoading(true);
      try {
        const [writeupsRes, resourcesRes] = await Promise.all([
          writeupAPI.getAll({ search: query, limit: 5 }),
          resourceAPI.getAll(),
        ]);

        setWriteups(writeupsRes.data || []);
        
        // Filter resources client-side
        const filteredResources = (resourcesRes.data || []).filter(
          (r) =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.description.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setResources(filteredResources);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = useCallback(
    (type, item) => {
      setOpen(false);
      setQuery("");
      if (type === "writeup") {
        navigate(`/writeup/${item.id}`);
      } else if (type === "resource" && item.url) {
        window.open(item.url, "_blank");
      }
    },
    [navigate, setOpen]
  );

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: "text-green-400",
      Medium: "text-yellow-400",
      Hard: "text-red-400",
      Insane: "text-purple-400",
    };
    return colors[difficulty] || "text-text-muted";
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="bg-background-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-accent-primary" />
          <input
            className="flex h-12 w-full bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted font-mono"
            placeholder="Search writeups, resources, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-text-muted font-mono">
              <span className="text-accent-primary">$</span> searching...
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-text-muted">
              <p className="font-mono mb-2">
                <span className="text-accent-primary">$</span> Type to search
              </p>
              <p className="text-xs">
                Search through writeups, resources, skills, and tags
              </p>
            </div>
          )}

          {!loading && query.length >= 2 && writeups.length === 0 && resources.length === 0 && (
            <div className="py-6 text-center text-sm text-text-muted font-mono">
              <span className="text-accent-primary">$</span> No results found for "{query}"
            </div>
          )}

          {/* Writeups Results */}
          {writeups.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1.5 text-xs font-mono text-text-muted flex items-center gap-2">
                <FileText className="w-3 h-3" />
                WRITEUPS
              </div>
              {writeups.map((writeup) => (
                <button
                  key={writeup.id}
                  className="w-full px-2 py-3 rounded-md hover:bg-white/5 text-left transition-colors group"
                  onClick={() => handleSelect("writeup", writeup)}
                  data-testid={`search-result-writeup-${writeup.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors truncate">
                          {writeup.title}
                        </span>
                        <span className={`text-xs font-mono ${getDifficultyColor(writeup.difficulty)}`}>
                          {writeup.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {writeup.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-text-muted font-mono flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {writeup.platform}
                        </span>
                        {writeup.tags && writeup.tags.length > 0 && (
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {writeup.tags.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Resources Results */}
          {resources.length > 0 && (
            <div>
              {writeups.length > 0 && <div className="border-t border-border my-2" />}
              <div className="px-2 py-1.5 text-xs font-mono text-text-muted flex items-center gap-2">
                <Wrench className="w-3 h-3" />
                RESOURCES
              </div>
              {resources.map((resource) => (
                <button
                  key={resource.id}
                  className="w-full px-2 py-3 rounded-md hover:bg-white/5 text-left transition-colors group"
                  onClick={() => handleSelect("resource", resource)}
                  data-testid={`search-result-resource-${resource.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors truncate">
                          {resource.title}
                        </span>
                        {resource.url && (
                          <ExternalLink className="w-3 h-3 text-text-muted" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {resource.description}
                      </p>
                    </div>
                    <span className="text-xs text-accent-primary font-mono capitalize">
                      {resource.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between text-xs text-text-muted">
          <span className="font-mono">
            <kbd className="px-1 py-0.5 rounded bg-background border border-border mr-1">↵</kbd>
            to select
          </span>
          <span className="font-mono">
            <kbd className="px-1 py-0.5 rounded bg-background border border-border mr-1">↑↓</kbd>
            to navigate
          </span>
        </div>
      </div>
    </CommandDialog>
  );
};

export default SearchCommand;
