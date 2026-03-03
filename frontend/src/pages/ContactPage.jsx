import { useState } from "react";
import { contactAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { Send, Mail, MessageSquare, Github, Linkedin } from "lucide-react";

const ContactPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await contactAPI.submit(formData);
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12" data-testid="contact-page">
      <SEO 
        title="Ping Me"
        description="Get in touch with Maxwell Ferreira for cybersecurity consulting, collaboration, or questions about offensive security."
      />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Left Column - Info */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
              <span className="text-accent-primary">$</span>
              <span>ping maxwell@zerodaylog</span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-4">
              Ping Me
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              Have a question, suggestion, or just want to say hi? 
              Feel free to reach out through the form or connect via social media.
            </p>

            {/* Contact Info */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-border flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-text-muted text-xs font-mono uppercase mb-1">Email</p>
                  <p className="text-text-primary">contact@zerodaylog.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-border flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-text-muted text-xs font-mono uppercase mb-1">Response Time</p>
                  <p className="text-text-primary">Usually within 24-48 hours</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-text-muted text-xs font-mono uppercase mb-4">Connect</p>
              <div className="flex gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border border-border flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors"
                  data-testid="contact-github"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border border-border flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors"
                  data-testid="contact-linkedin"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-background-surface border border-border p-8">
            <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
              Send a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-secondary text-sm font-mono">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="input-field"
                    required
                    data-testid="contact-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-text-secondary text-sm font-mono">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="input-field"
                    required
                    data-testid="contact-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-text-secondary text-sm font-mono">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="input-field"
                  required
                  data-testid="contact-subject-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-text-secondary text-sm font-mono">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  className="input-field min-h-32"
                  required
                  data-testid="contact-message-input"
                />
              </div>

              <Button 
                type="submit" 
                className="btn-primary w-full"
                disabled={loading}
                data-testid="contact-submit-btn"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
