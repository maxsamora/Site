import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { writeupAPI, commentAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Copy,
  ArrowLeft,
  MessageSquare,
  Send,
  Tag
} from "lucide-react";

const WriteupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [writeup, setWriteup] = useState(null);
  const [comments, setComments] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchWriteup = useCallback(async () => {
    try {
      const response = await writeupAPI.getOne(id);
      setWriteup(response.data);
    } catch (error) {
      console.error("Failed to fetch writeup:", error);
      navigate("/archive");
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

  const fetchUserVote = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await writeupAPI.getUserVote(id);
      setUserVote(response.data.vote);
    } catch (error) {
      console.error("Failed to fetch user vote:", error);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWriteup(), fetchComments(), fetchUserVote()]);
      setLoading(false);
    };
    loadData();
  }, [fetchWriteup, fetchComments, fetchUserVote]);

  const handleVote = async (vote) => {
    if (!isAuthenticated) {
      toast.error("Please login to vote");
      return;
    }

    try {
      await writeupAPI.vote(id, vote);
      await fetchWriteup();
      await fetchUserVote();
      toast.success(userVote === vote ? "Vote removed" : "Vote recorded");
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }

    setSubmittingComment(true);
    try {
      await commentAPI.create({ content: newComment, writeup_id: id });
      setNewComment("");
      await fetchComments();
      toast.success("Comment posted");
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentAPI.delete(commentId);
      await fetchComments();
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleDeleteWriteup = async () => {
    if (!window.confirm("Are you sure you want to delete this writeup?")) return;

    try {
      await writeupAPI.delete(id);
      toast.success("Writeup deleted");
      navigate("/archive");
    } catch (error) {
      toast.error("Failed to delete writeup");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const renderMarkdown = (content) => {
    // Simple markdown renderer
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr />')
      // Line breaks
      .replace(/\n/gim, '<br />');

    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/gim, (match, lang, code) => {
      return `<div class="code-block-wrapper"><pre><code>${code.trim()}</code></pre><button class="copy-btn btn-secondary px-2 py-1 text-xs" onclick="navigator.clipboard.writeText(\`${code.trim().replace(/`/g, '\\`')}\`)">Copy</button></div>`;
    });

    return html;
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
      offsec: "platform-offsec",
      other: "platform-other"
    };
    return classes[platform] || classes.other;
  };

  const getPlatformLabel = (platform) => {
    const labels = {
      htb: "Hack The Box",
      offsec: "OffSec",
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
      <article className="max-w-3xl mx-auto px-6">
        {/* Back Button */}
        <Link 
          to="/archive" 
          className="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors mb-8 font-mono text-sm"
          data-testid="writeup-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Archive
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

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {writeup.tags.map((tag) => (
              <Link
                key={tag}
                to={`/archive?tag=${tag}`}
                className="text-xs font-mono bg-background-surface border border-border px-3 py-1 text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
            ))}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-text-muted text-sm font-mono border-t border-b border-border py-4">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {writeup.author_name}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(writeup.created_at)}
            </span>
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {writeup.views} views
            </span>
          </div>

          {/* Actions */}
          {isAuthenticated && user?.id === writeup.author_id && (
            <div className="flex gap-4 mt-4">
              <Link to={`/edit/${writeup.id}`}>
                <Button variant="ghost" className="text-text-secondary hover:text-accent-primary" data-testid="writeup-edit-btn">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-text-secondary hover:text-accent-danger"
                onClick={handleDeleteWriteup}
                data-testid="writeup-delete-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
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

        {/* Voting */}
        <div className="flex items-center gap-4 p-6 bg-background-surface border border-border mb-12">
          <p className="text-text-secondary text-sm font-mono mr-4">Was this helpful?</p>
          <Button
            variant="ghost"
            className={`${userVote === "up" ? "text-accent-primary" : "text-text-muted"} hover:text-accent-primary`}
            onClick={() => handleVote("up")}
            data-testid="writeup-upvote-btn"
          >
            <ThumbsUp className="w-5 h-5 mr-2" />
            {writeup.upvotes}
          </Button>
          <Button
            variant="ghost"
            className={`${userVote === "down" ? "text-accent-danger" : "text-text-muted"} hover:text-accent-danger`}
            onClick={() => handleVote("down")}
            data-testid="writeup-downvote-btn"
          >
            <ThumbsDown className="w-5 h-5 mr-2" />
            {writeup.downvotes}
          </Button>
        </div>

        {/* Comments */}
        <section className="border-t border-border pt-8">
          <h2 className="font-heading font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? "Share your thoughts or tips..." : "Login to comment"}
              className="input-field min-h-24 mb-4"
              disabled={!isAuthenticated}
              data-testid="comment-input"
            />
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={!isAuthenticated || submittingComment || !newComment.trim()}
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-accent-primary text-sm">
                      @{comment.author_name}
                    </span>
                    <span className="text-text-muted text-xs font-mono">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {isAuthenticated && user?.id === comment.author_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-muted hover:text-accent-danger"
                      onClick={() => handleDeleteComment(comment.id)}
                      data-testid={`delete-comment-${comment.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
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
