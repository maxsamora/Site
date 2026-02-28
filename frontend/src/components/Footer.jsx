import { Link } from "react-router-dom";
import { Terminal, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-surface border-t border-border py-16 mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Terminal className="w-6 h-6 text-accent-primary" />
              <span className="font-heading font-bold text-xl text-text-primary">
                ZeroDay<span className="text-accent-primary">.log</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-md mb-6">
              A personal blog for CTF writeups from Hack The Box, Offensive Security, 
              and other platforms. Sharing knowledge and solutions with the infosec community.
            </p>
            {/* ASCII Art */}
            <pre className="text-accent-primary/30 text-xs font-mono hidden md:block">
{`   _____ _______ ______ 
  / ____|__   __|  ____|
 | |       | |  | |__   
 | |       | |  |  __|  
 | |____   | |  | |     
  \\_____|  |_|  |_|     `}
            </pre>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-text-primary mb-4 text-sm uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/archive" 
                  className="text-text-muted hover:text-accent-primary transition-colors duration-300 text-sm"
                >
                  Archive
                </Link>
              </li>
              <li>
                <Link 
                  to="/resources" 
                  className="text-text-muted hover:text-accent-primary transition-colors duration-300 text-sm"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-text-muted hover:text-accent-primary transition-colors duration-300 text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading font-bold text-text-primary mb-4 text-sm uppercase tracking-wider">
              Connect
            </h4>
            <div className="flex gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent-primary transition-colors duration-300"
                data-testid="footer-github"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent-primary transition-colors duration-300"
                data-testid="footer-twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent-primary transition-colors duration-300"
                data-testid="footer-linkedin"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-xs font-mono">
            &copy; {currentYear} ZeroDay.log // All rights reserved
          </p>
          <p className="text-text-muted text-xs font-mono">
            <span className="text-accent-primary">root@zerodaylog</span>:~# hack_the_planet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
