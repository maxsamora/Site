import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { writeupAPI } from "@/lib/api";
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
import { toast } from "sonner";
import { Save, Eye, ArrowLeft } from "lucide-react";

const EditWriteupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preview, setPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    difficulty: "easy",
    platform: "htb",
    machine_name: "",
    cover_image: "",
    tags: ""
  });

  useEffect(() => {
    const fetchWriteup = async () => {
      try {
        const response = await writeupAPI.getOne(id);
        const writeup = response.data;
        
        // Check if user is the author
        if (user && writeup.author_id !== user.id) {
          toast.error("Not authorized to edit this writeup");
          navigate("/archive");
          return;
        }

        setFormData({
          title: writeup.title,
          description: writeup.description,
          content: writeup.content,
          difficulty: writeup.difficulty,
          platform: writeup.platform,
          machine_name: writeup.machine_name || "",
          cover_image: writeup.cover_image || "",
          tags: writeup.tags.join(", ")
        });
      } catch (error) {
        toast.error("Failed to load writeup");
        navigate("/archive");
      } finally {
        setFetching(false);
      }
    };

    if (isAuthenticated) {
      fetchWriteup();
    } else {
      navigate("/login");
    }
  }, [id, isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
      
      await writeupAPI.update(id, {
        ...formData,
        tags,
        cover_image: formData.cover_image || null,
        machine_name: formData.machine_name || null
      });

      toast.success("Writeup updated!");
      navigate(`/writeup/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update writeup");
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdownPreview = (content) => {
    let html = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\n/gim, '<br />');

    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

    return html;
  };

  if (fetching) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-background-surface w-1/3 mb-8" />
            <div className="space-y-6">
              <div className="h-12 bg-background-surface" />
              <div className="h-12 bg-background-surface" />
              <div className="h-64 bg-background-surface" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" data-testid="edit-writeup-page">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={`/writeup/${id}`}
            className="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors mb-4 font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Writeup
          </Link>
          <h1 className="font-heading font-bold text-3xl text-text-primary">
            Edit Writeup
          </h1>
          <p className="text-text-muted text-sm font-mono mt-1">
            // Update your documentation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-text-secondary text-sm font-mono">
                Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                required
                data-testid="edit-title-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine_name" className="text-text-secondary text-sm font-mono">
                Machine Name
              </Label>
              <Input
                id="machine_name"
                name="machine_name"
                value={formData.machine_name}
                onChange={handleChange}
                className="input-field"
                data-testid="edit-machine-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-text-secondary text-sm font-mono">
              Description *
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field min-h-20"
              required
              data-testid="edit-description-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">
                Difficulty *
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger className="input-field" data-testid="edit-difficulty-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-surface border-border">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="insane">Insane</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">
                Platform *
              </Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger className="input-field" data-testid="edit-platform-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-surface border-border">
                  <SelectItem value="htb">Hack The Box</SelectItem>
                  <SelectItem value="offsec">OffSec</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-text-secondary text-sm font-mono">
                Tags (comma-separated)
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input-field"
                data-testid="edit-tags-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image" className="text-text-secondary text-sm font-mono">
              Cover Image URL
            </Label>
            <Input
              id="cover_image"
              name="cover_image"
              value={formData.cover_image}
              onChange={handleChange}
              className="input-field"
              data-testid="edit-cover-input"
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-text-secondary text-sm font-mono">
                Content (Markdown) *
              </Label>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreview(!preview)}
                className="text-text-muted hover:text-accent-primary text-sm"
                data-testid="edit-preview-toggle"
              >
                <Eye className="w-4 h-4 mr-2" />
                {preview ? "Edit" : "Preview"}
              </Button>
            </div>

            {preview ? (
              <div 
                className="prose-writeup border border-border bg-background-surface p-6 min-h-96 max-h-[600px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(formData.content) }}
                data-testid="edit-content-preview"
              />
            ) : (
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="input-field min-h-96 font-mono text-sm"
                required
                data-testid="edit-content-input"
              />
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/writeup/${id}`)}
              className="text-text-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
              data-testid="edit-submit-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWriteupPage;
