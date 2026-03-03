import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { writeupAPI, commentAPI, challengeAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import SEO from "@/components/SEO";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Calendar, 
  ArrowLeft,
  MessageSquare,
  Send,
  Tag,
  Monitor,
  Cpu,
  Wrench,
  Coffee,
  Linkedin,
  Share2
} from "lucide-react";

const WriteupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [writeup, setWriteup] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState({ content: "", author_name: "" });
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchWriteup = useCallback(async () => {
    try {
      const response = await writeupAPI.getOne(id);
      setWriteup(response.data);
    } catch (error) {
      console.error("Failed to fetch writeup:", error);
      navigate("/writeups");
    }
  }, [id, navigate]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await commentAPI.getByWriteup(id);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWriteup(), fetchComments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchWriteup, fetchComments]);

  const handleVote = async (vote) => {
    try {
      await writeupAPI.vote(id, vote);
      await fetchWriteup();
      toast.success("Vote recorded");
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error("Too many votes. Please slow down.");
      } else {
        toast.error("Failed to vote");
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.content.trim() || !newComment.author_name.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmittingComment(true);
    try {
      // Get challenge token first (bot protection)
      const tokenResponse = await challengeAPI.getToken();
      const challengeToken = tokenResponse.data.token;
      
      await commentAPI.create(id, {
        content: newComment.content,
        author_name: newComment.author_name,
        challenge_token: challengeToken
      });
      setNewComment({ content: "", author_name: "" });
      await fetchComments();
      toast.success("Comment posted");
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error("Too many comments. Please wait a minute.");
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to post comment");
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderMarkdown = (content) => {
    // Basic markdown to HTML
    // IMPORTANT: Process images BEFORE links to avoid regex conflicts
    let html = content
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="writeup-image" loading="lazy" />')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^---$/gim, '<hr />')
      .replace(/\n/gim, '<br />');

    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

    // Sanitize to prevent XSS
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'hr', 'strong', 'em', 'a', 'code', 'pre', 'blockquote', 'img', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class']
    });
  };

  const getDifficultyClass = (difficulty) => {
    const classes = {
      easy: "difficulty-easy",
      medium: "difficulty-medium",
      hard: "difficulty-hard",
      insane: "difficulty-insane"
    };
    return classes[difficulty] || classes.easy;
  };

  const getPlatformClass = (platform) => {
    const classes = {
      htb: "platform-htb",
      proving_grounds: "platform-pg",
      other: "platform-other"
    };
    return classes[platform] || classes.other;
  };

  const getPlatformLabel = (platform) => {
    const labels = {
      htb: "Hack The Box",
      proving_grounds: "Proving Grounds",
      other: "Other"
    };
    return labels[platform] || platform;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-background-surface w-1/2 mb-4" />
            <div className="h-4 bg-background-surface w-1/4 mb-8" />
            <div className="h-64 bg-background-surface" />
          </div>
        </div>
      </div>
    );
  }

  if (!writeup) return null;

  return (
    <div className="min-h-screen py-12" data-testid="writeup-page">
      <SEO 
        title={writeup.title}
        description={writeup.description || `${writeup.title} - ${writeup.difficulty} ${writeup.platform} writeup`}
        image={writeup.cover_image}
        type="article"
      />
      <article className="max-w-3xl mx-auto px-6">
        {/* Back Button */}
        <Link 
          to="/writeups" 
          className="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors mb-8 font-mono text-sm"
          data-testid="writeup-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Writeups
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge 
              variant="outline" 
              className={`text-xs uppercase font-mono ${getDifficultyClass(writeup.difficulty)}`}
            >
              {writeup.difficulty}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs uppercase font-mono border ${getPlatformClass(writeup.platform)}`}
            >
              {getPlatformLabel(writeup.platform)}
            </Badge>
            {writeup.os_type && (
              <Badge variant="outline" className="text-xs font-mono border-text-muted text-text-muted">
                {writeup.os_type === "windows" ? <Monitor className="w-3 h-3 mr-1" /> : <Cpu className="w-3 h-3 mr-1" />}
                {writeup.os_type}
              </Badge>
            )}
          </div>

          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-4" data-testid="writeup-title">
            {writeup.title}
          </h1>

          {writeup.machine_name && (
            <p className="text-accent-primary font-mono text-lg mb-4">
              // {writeup.machine_name}
            </p>
          )}

          <p className="text-text-secondary text-lg mb-6">
            {writeup.description}
          </p>

          {/* Skills & CVEs */}
          {(writeup.skills?.length > 0 || writeup.cves?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {writeup.skills?.map((skill) => (
                <span 
                  key={skill} 
                  className="text-xs font-mono bg-accent-primary/10 text-accent-primary px-2 py-1"
                >
                  {skill}
                </span>
              ))}
              {writeup.cves?.map((cve) => (
                <span 
                  key={cve} 
                  className="text-xs font-mono bg-accent-danger/10 text-accent-danger px-2 py-1"
                >
                  {cve}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {writeup.tags?.map((tag) => (
              <Link
                key={tag}
                to={`/writeups?tag=${tag}`}
                className="text-xs font-mono bg-background-surface border border-border px-3 py-1 text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
            ))}
          </div>

          {/* Tools Used */}
          {writeup.tools_used?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Wrench className="w-4 h-4 text-text-muted" />
              <span className="text-text-muted text-xs font-mono">Tools:</span>
              {writeup.tools_used.map((tool) => (
                <span 
                  key={tool} 
                  className="text-xs font-mono text-text-muted"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-text-muted text-sm font-mono border-t border-b border-border py-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(writeup.created_at)}
            </span>
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {writeup.views} views
            </span>
          </div>
        </header>

        {/* Cover Image */}
        {writeup.cover_image && (
          <div className="mb-8 border border-border overflow-hidden">
            <img 
              src={writeup.cover_image} 
              alt={writeup.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose-writeup mb-12"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(writeup.content) }}
          data-testid="writeup-content"
        />

        {/* Voting & Share */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-background-surface border border-border mb-12">
          <div className="flex items-center gap-4">
            <p className="text-text-secondary text-sm font-mono mr-4">Was this helpful?</p>
            <Button
              variant="ghost"
              className="text-text-muted hover:text-accent-primary"
              onClick={() => handleVote("up")}
              data-testid="writeup-upvote-btn"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              {writeup.upvotes}
            </Button>
            <Button
              variant="ghost"
              className="text-text-muted hover:text-accent-danger"
              onClick={() => handleVote("down")}
              data-testid="writeup-downvote-btn"
            >
              <ThumbsDown className="w-5 h-5 mr-2" />
              {writeup.downvotes}
            </Button>
          </div>
          
          {/* Share Button */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#0A66C2]/50 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all duration-300 font-mono text-sm group"
            data-testid="linkedin-share-btn"
          >
            <Linkedin className="w-4 h-4" />
            <span className="hidden sm:inline">Share on LinkedIn</span>
          </a>
        </div>

        {/* Support Section */}
        <div className="mb-12" data-testid="support-section">
          <div className="border-t border-border/50 my-8" />
          <div className="text-center py-6">
            <p className="text-text-muted text-sm mb-4 font-mono">
              If this writeup helped you, consider supporting my work.
            </p>
            <a
              href="https://buymeacoffee.com/maxwellferreira"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded border border-accent-primary/50 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-black transition-all duration-300 font-mono text-sm group"
              data-testid="support-coffee-btn"
            >
              <Coffee className="w-5 h-5 group-hover:animate-bounce" />
              Buy Me a Coffee
            </a>
          </div>
        </div>

        {/* Comments */}
        <section className="border-t border-border pt-8">
          <h2 className="font-heading font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form - Public, no auth required */}
          <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                value={newComment.author_name}
                onChange={(e) => setNewComment({ ...newComment, author_name: e.target.value })}
                placeholder="Your name"
                className="input-field"
                maxLength={50}
                data-testid="comment-name"
              />
              {/* Honeypot field */}
              <input 
                type="text" 
                name="website" 
                style={{ display: "none" }} 
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <Textarea
              value={newComment.content}
              onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
              placeholder="Share your thoughts or ask a question..."
              className="input-field min-h-24"
              maxLength={1000}
              data-testid="comment-content"
            />
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={submittingComment || !newComment.content.trim() || !newComment.author_name.trim()}
              data-testid="comment-submit-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </form>

          {/* Comment List */}
          <div className="space-y-6" data-testid="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-background-surface border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-accent-primary text-sm">
                    {comment.author_name}
                  </span>
                  <span className="text-text-muted text-xs font-mono">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-text-secondary">{comment.content}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-text-muted text-center py-8 font-mono text-sm">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
};

export default WriteupPage;
