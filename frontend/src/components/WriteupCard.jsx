import { Link } from "react-router-dom";
import { Eye, ThumbsUp, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WriteupCard = ({ writeup, featured = false }) => {
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
      month: "short",
      day: "numeric"
    });
  };

  return (
    <Link 
      to={`/writeup/${writeup.id}`}
      className={`card-writeup group ${featured ? "md:col-span-2 md:row-span-2" : ""}`}
      data-testid={`writeup-card-${writeup.id}`}
    >
      {/* Cover Image */}
      {writeup.cover_image && (
        <div className="relative h-40 mb-4 overflow-hidden -mx-6 -mt-6">
          <img 
            src={writeup.cover_image} 
            alt={writeup.title}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-surface to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* Title */}
      <h3 className="font-heading font-bold text-lg text-text-primary group-hover:text-accent-primary transition-colors duration-300 mb-2">
        {writeup.title}
      </h3>

      {/* Machine Name */}
      {writeup.machine_name && (
        <p className="text-accent-primary font-mono text-sm mb-2">
          // {writeup.machine_name}
        </p>
      )}

      {/* Description */}
      <p className="text-text-secondary text-sm line-clamp-2 mb-4 flex-grow">
        {writeup.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {writeup.tags.slice(0, 3).map((tag) => (
          <span 
            key={tag} 
            className="text-xs font-mono text-text-muted flex items-center gap-1"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
        {writeup.tags.length > 3 && (
          <span className="text-xs font-mono text-text-muted">
            +{writeup.tags.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-text-muted text-xs font-mono mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {writeup.views}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {writeup.upvotes}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(writeup.created_at)}
        </span>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-500" />
    </Link>
  );
};

export default WriteupCard;
