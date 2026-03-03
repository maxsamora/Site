import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { adminAPI, writeupAPI, SKILLS, TECHNIQUES } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon,
  X,
  Shield
} from "lucide-react";
import DOMPurify from "dompurify";

const AdminWriteupEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, checkSession, getAuthHeader } = useAdmin();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    difficulty: "easy",
    platform: "htb",
    machine_name: "",
    cover_image: "",
    os_type: "linux",
    tags: "",
    skills: [],
    techniques: [],
    cves: "",
    tools_used: "",
    published: true
  });

  useEffect(() => {
    const init = async () => {
      const authenticated = await checkSession();
      if (!authenticated) {
        navigate("/admin");
        return;
      }
      
      if (id) {
        await fetchWriteup();
      }
      setLoading(false);
    };
    init();
  }, [id, checkSession, navigate]);

  const fetchWriteup = async () => {
    try {
      // Use public API to get writeup data
      const response = await writeupAPI.getOne(id);
      const writeup = response.data;
      
      setFormData({
        title: writeup.title || "",
        description: writeup.description || "",
        content: writeup.content || "",
        difficulty: writeup.difficulty || "easy",
        platform: writeup.platform || "htb",
        machine_name: writeup.machine_name || "",
        cover_image: writeup.cover_image || "",
        os_type: writeup.os_type || "linux",
        tags: (writeup.tags || []).join(", "),
        skills: writeup.skills || [],
        techniques: writeup.techniques || [],
        cves: (writeup.cves || []).join(", "),
        tools_used: (writeup.tools_used || []).join(", "),
        published: writeup.published !== false
      });
    } catch (error) {
      toast.error("Failed to load writeup");
      navigate("/admin");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleTechnique = (technique) => {
    setFormData(prev => ({
      ...prev,
      techniques: prev.techniques.includes(technique)
        ? prev.techniques.filter(t => t !== technique)
        : [...prev.techniques, technique]
    }));
  };

  // Image upload handler
  const uploadImage = async (file) => {
    if (!file) return;
    
    // Client-side validation
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PNG, JPG, and WebP allowed.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max size is 5MB.");
      return;
    }
    
    setUploading(true);
    try {
      const response = await adminAPI.uploadImage(file, getAuthHeader());
      const { markdown } = response.data;
      
      // Insert markdown at cursor position
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const newContent = text.substring(0, start) + "\n" + markdown + "\n" + text.substring(end);
        setFormData({ ...formData, content: newContent });
        
        // Set cursor after inserted text
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + markdown.length + 2;
          textarea.focus();
        }, 0);
      }
      
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadImage(files[0]);
    }
  };

  // Paste handler
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadImage(file);
        }
        return;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        difficulty: formData.difficulty,
        platform: formData.platform,
        machine_name: formData.machine_name || null,
        cover_image: formData.cover_image || null,
        os_type: formData.os_type || null,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        skills: formData.skills,
        techniques: formData.techniques,
        cves: formData.cves.split(",").map(c => c.trim()).filter(Boolean),
        tools_used: formData.tools_used.split(",").map(t => t.trim()).filter(Boolean),
        published: formData.published
      };

      if (id) {
        await adminAPI.updateWriteup(id, payload, getAuthHeader());
        toast.success("Writeup updated");
      } else {
        const response = await adminAPI.createWriteup(payload, getAuthHeader());
        toast.success("Writeup created");
        navigate(`/admin/writeup/${response.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save writeup");
    } finally {
      setSaving(false);
    }
  };

  const renderMarkdownPreview = (content) => {
    // Sanitize HTML to prevent XSS
    let html = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\n/gim, '<br />');

    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

    // Sanitize output
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'strong', 'em', 'a', 'code', 'pre', 'blockquote', 'img', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt']
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted font-mono">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen py-12" data-testid="admin-editor">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors mb-4 font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          <h1 className="font-heading font-bold text-3xl text-text-primary flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent-primary" />
            {id ? "Edit Writeup" : "New Writeup"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">Title *</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., HTB - Lame Walkthrough"
                className="input-field"
                required
                data-testid="editor-title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">Machine Name</Label>
              <Input
                name="machine_name"
                value={formData.machine_name}
                onChange={handleChange}
                placeholder="e.g., Lame"
                className="input-field"
                data-testid="editor-machine"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-text-secondary text-sm font-mono">Description *</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief overview of the challenge..."
              className="input-field min-h-20"
              required
              data-testid="editor-description"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
              >
                <SelectTrigger className="input-field" data-testid="editor-difficulty">
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
              <Label className="text-text-secondary text-sm font-mono">Platform *</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData({ ...formData, platform: v })}
              >
                <SelectTrigger className="input-field" data-testid="editor-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-surface border-border">
                  <SelectItem value="htb">Hack The Box</SelectItem>
                  <SelectItem value="proving_grounds">Proving Grounds</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">OS Type</Label>
              <Select
                value={formData.os_type}
                onValueChange={(v) => setFormData({ ...formData, os_type: v })}
              >
                <SelectTrigger className="input-field" data-testid="editor-os">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-surface border-border">
                  <SelectItem value="linux">Linux</SelectItem>
                  <SelectItem value="windows">Windows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">Published</Label>
              <div className="flex items-center h-12 px-4 bg-black/50 border border-border">
                <Switch
                  checked={formData.published}
                  onCheckedChange={(v) => setFormData({ ...formData, published: v })}
                  data-testid="editor-published"
                />
                <span className="ml-3 text-text-secondary text-sm">
                  {formData.published ? "Public" : "Draft"}
                </span>
              </div>
            </div>
          </div>

          {/* Skills Selection */}
          <div className="space-y-2">
            <Label className="text-text-secondary text-sm font-mono">Skills Used</Label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs font-mono px-3 py-1.5 transition-colors ${
                    formData.skills.includes(skill)
                      ? "bg-accent-primary text-black"
                      : "bg-background border border-border text-text-muted hover:border-accent-primary"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Techniques Selection */}
          <div className="space-y-2">
            <Label className="text-text-secondary text-sm font-mono">Techniques</Label>
            <div className="flex flex-wrap gap-2">
              {TECHNIQUES.map((technique) => (
                <button
                  key={technique}
                  type="button"
                  onClick={() => toggleTechnique(technique)}
                  className={`text-xs font-mono px-3 py-1.5 transition-colors ${
                    formData.techniques.includes(technique)
                      ? "bg-accent-primary text-black"
                      : "bg-background border border-border text-text-muted hover:border-accent-primary"
                  }`}
                >
                  {technique}
                </button>
              ))}
            </div>
          </div>

          {/* Tags, CVEs, Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">Tags (comma-separated)</Label>
              <Input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="web, linux, retired"
                className="input-field"
                data-testid="editor-tags"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">CVEs (comma-separated)</Label>
              <Input
                name="cves"
                value={formData.cves}
                onChange={handleChange}
                placeholder="CVE-2021-1234"
                className="input-field"
                data-testid="editor-cves"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm font-mono">Tools Used (comma-separated)</Label>
              <Input
                name="tools_used"
                value={formData.tools_used}
                onChange={handleChange}
                placeholder="nmap, burp, linpeas"
                className="input-field"
                data-testid="editor-tools"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label className="text-text-secondary text-sm font-mono">Cover Image URL</Label>
            <Input
              name="cover_image"
              value={formData.cover_image}
              onChange={handleChange}
              placeholder="https://... or paste/drop image below"
              className="input-field"
              data-testid="editor-cover"
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-text-secondary text-sm font-mono">Content (Markdown) *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-text-muted hover:text-accent-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPreview(!preview)}
                  className="text-text-muted hover:text-accent-primary text-sm"
                  data-testid="editor-preview-toggle"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>

            {preview ? (
              <div 
                className="prose-writeup border border-border bg-background-surface p-6 min-h-96 max-h-[600px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(formData.content) }}
                data-testid="editor-preview"
              />
            ) : (
              <div
                className={`relative ${isDragging ? "ring-2 ring-accent-primary" : ""}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isDragging && (
                  <div className="absolute inset-0 bg-accent-primary/10 border-2 border-dashed border-accent-primary flex items-center justify-center z-10">
                    <div className="text-accent-primary font-mono text-sm flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Drop image here
                    </div>
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  onPaste={handlePaste}
                  placeholder={`# Overview

Write your writeup using Markdown. Paste or drag images directly!

## Reconnaissance
\`\`\`bash
nmap -sC -sV 10.10.10.1
\`\`\`

## Initial Access
...

## Privilege Escalation
...

## Lessons Learned
...`}
                  className="input-field min-h-96 font-mono text-sm"
                  required
                  data-testid="editor-content"
                />
              </div>
            )}
            <p className="text-text-muted text-xs font-mono">
              Tip: Paste images from clipboard (Ctrl+V) or drag & drop image files
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-text-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={saving}
              data-testid="editor-submit"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : id ? "Update Writeup" : "Publish Writeup"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminWriteupEditor;
