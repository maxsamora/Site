import { useState, useEffect } from "react";
import { resourceAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExternalLink, Plus, Trash2, Wrench, BookOpen, Globe, Users } from "lucide-react";

const ResourcesPage = () => {
  const { isAuthenticated } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    category: "tools"
  });

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const fetchResources = async () => {
    try {
      const response = await resourceAPI.getAll(filter || undefined);
      setResources(response.data);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      await resourceAPI.create(newResource);
      toast.success("Resource added!");
      setNewResource({ title: "", description: "", url: "", category: "tools" });
      setDialogOpen(false);
      fetchResources();
    } catch (error) {
      toast.error("Failed to add resource");
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await resourceAPI.delete(id);
      toast.success("Resource deleted");
      fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      tools: <Wrench className="w-5 h-5" />,
      tutorials: <BookOpen className="w-5 h-5" />,
      platforms: <Globe className="w-5 h-5" />,
      communities: <Users className="w-5 h-5" />
    };
    return icons[category] || icons.tools;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      tools: "Tools",
      tutorials: "Tutorials",
      platforms: "Platforms",
      communities: "Communities"
    };
    return labels[category] || category;
  };

  const categories = ["tools", "tutorials", "platforms", "communities"];

  // Default resources to show if database is empty
  const defaultResources = [
    { id: "default-1", title: "Hack The Box", description: "Online platform to test and advance your skills in penetration testing and cyber security.", url: "https://www.hackthebox.com", category: "platforms" },
    { id: "default-2", title: "Offensive Security", description: "Information security training and certification provider.", url: "https://www.offensive-security.com", category: "platforms" },
    { id: "default-3", title: "GTFOBins", description: "Curated list of Unix binaries that can be used to bypass local security restrictions.", url: "https://gtfobins.github.io", category: "tools" },
    { id: "default-4", title: "PayloadsAllTheThings", description: "A list of useful payloads and bypass for Web Application Security and Pentest/CTF.", url: "https://github.com/swisskyrepo/PayloadsAllTheThings", category: "tutorials" },
    { id: "default-5", title: "CyberChef", description: "The Cyber Swiss Army Knife - a web app for encryption, encoding, compression and data analysis.", url: "https://gchq.github.io/CyberChef/", category: "tools" },
    { id: "default-6", title: "HackTricks", description: "Hacking tricks and techniques book.", url: "https://book.hacktricks.xyz", category: "tutorials" },
  ];

  const displayResources = resources.length > 0 ? resources : defaultResources;
  const filteredResources = filter 
    ? displayResources.filter(r => r.category === filter)
    : displayResources;

  return (
    <div className="min-h-screen py-12" data-testid="resources-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
            <span className="text-accent-primary">$</span>
            <span>cat /etc/ctf/resources.conf</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary">
                Resources
              </h1>
              <p className="text-text-muted mt-2">
                Essential tools, tutorials, and platforms for CTF challenges
              </p>
            </div>
            {isAuthenticated && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" data-testid="add-resource-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background-surface border-border">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-text-primary">Add Resource</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateResource} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">Title</Label>
                      <Input
                        value={newResource.title}
                        onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                        className="input-field"
                        required
                        data-testid="resource-title-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">URL</Label>
                      <Input
                        value={newResource.url}
                        onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                        className="input-field"
                        required
                        data-testid="resource-url-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">Description</Label>
                      <Textarea
                        value={newResource.description}
                        onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                        className="input-field"
                        required
                        data-testid="resource-description-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">Category</Label>
                      <Select
                        value={newResource.category}
                        onValueChange={(value) => setNewResource({ ...newResource, category: value })}
                      >
                        <SelectTrigger className="input-field" data-testid="resource-category-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background-surface border-border">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="btn-primary w-full" data-testid="resource-submit-btn">
                      Add Resource
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={filter === "" ? "default" : "ghost"}
            onClick={() => setFilter("")}
            className={filter === "" ? "bg-accent-primary text-black" : "text-text-muted hover:text-accent-primary"}
            data-testid="filter-all"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "ghost"}
              onClick={() => setFilter(cat)}
              className={filter === cat ? "bg-accent-primary text-black" : "text-text-muted hover:text-accent-primary"}
              data-testid={`filter-${cat}`}
            >
              {getCategoryIcon(cat)}
              <span className="ml-2">{getCategoryLabel(cat)}</span>
            </Button>
          ))}
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-background-surface border border-border p-6 animate-pulse">
                <div className="h-6 bg-background-surface-highlight w-1/2 mb-4" />
                <div className="h-4 bg-background-surface-highlight w-full mb-2" />
                <div className="h-4 bg-background-surface-highlight w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="resources-grid">
            {filteredResources.map((resource) => (
              <div 
                key={resource.id} 
                className="bg-background-surface border border-border p-6 hover:border-accent-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary">
                      {getCategoryIcon(resource.category)}
                    </span>
                    <span className="text-text-muted text-xs font-mono uppercase">
                      {getCategoryLabel(resource.category)}
                    </span>
                  </div>
                  {isAuthenticated && !resource.id.startsWith("default") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-muted hover:text-accent-danger opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteResource(resource.id)}
                      data-testid={`delete-resource-${resource.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <h3 className="font-heading font-bold text-lg text-text-primary mb-2">
                  {resource.title}
                </h3>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {resource.description}
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent-primary hover:underline text-sm font-mono"
                  data-testid={`resource-link-${resource.id}`}
                >
                  Visit
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
