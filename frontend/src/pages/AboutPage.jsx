import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { 
  Terminal, 
  Shield, 
  Server, 
  Award, 
  Target,
  ExternalLink,
  Code2,
  Database,
  Globe,
  ChevronRight,
  Github,
  Linkedin
} from "lucide-react";

const AboutPage = () => {
  const skills = [
    {
      category: "Web Exploitation",
      items: ["SQL Injection", "XSS", "SSTI", "SSRF", "LFI/RFI", "Authentication Bypass", "Deserialization"]
    },
    {
      category: "Active Directory",
      items: ["Kerberoasting", "AS-REP Roasting", "DCSync", "Pass-the-Hash", "Golden Ticket", "Bloodhound"]
    },
    {
      category: "Linux Privilege Escalation",
      items: ["SUID/SGID", "Capabilities", "Kernel Exploits", "Cron Jobs", "PATH Hijacking", "Container Escape"]
    },
    {
      category: "Windows Privilege Escalation",
      items: ["Token Impersonation", "Service Exploits", "UAC Bypass", "DLL Hijacking", "PrintSpoofer", "Potato Attacks"]
    },
    {
      category: "Tools & Frameworks",
      items: ["Nmap", "Burp Suite", "Metasploit", "Bloodhound", "Impacket", "Hashcat", "Ghidra", "GDB"]
    },
    {
      category: "Programming & Scripting",
      items: ["Python", "Bash", "PowerShell", "SQL", "JavaScript", "C"]
    }
  ];

  const certifications = [
    {
      category: "Offensive Security",
      items: [
        { name: "OSCP+", desc: "Offensive Security Certified Professional Plus", org: "Offensive Security" },
        { name: "CRTO", desc: "Certified Red Team Operator", org: "ZeroPoint Security" },
        { name: "Pentest+", desc: "CompTIA Pentest+", org: "CompTIA" },
        { name: "eWPTXv2", desc: "Web Application Penetration Tester eXtreme", org: "eLearnSecurity" },
        { name: "eJPT", desc: "Junior Penetration Tester", org: "eLearnSecurity" },
        { name: "DCPT", desc: "Desec Certified Penetration Tester", org: "Desec Security" }
      ]
    },
    {
      category: "Cloud & Governance",
      items: [
        { name: "AZ-900", desc: "Microsoft Azure Fundamentals", org: "Microsoft" },
        { name: "ITIL v3", desc: "ITIL v3 Foundation", org: "AXELOS" },
        { name: "COBIT 4.1", desc: "COBIT 4.1 Foundation", org: "ISACA" }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-12" data-testid="about-page">
      <SEO 
        title="About"
        description="Maxwell Ferreira - Offensive security professional specializing in penetration testing, red team operations, and CTF challenges."
      />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
            <span className="text-accent-primary">$</span>
            <span>cat /home/maxwell/about.md</span>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary">
            About Me
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Bio Section */}
            <section>
              <h2 className="font-heading font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-accent-primary" />
                About Me
              </h2>
              <div className="prose-writeup space-y-4">
                <p className="text-text-secondary leading-relaxed">
                  I'm <span className="text-accent-primary font-bold">Maxwell Ferreira</span>, 
                  a cybersecurity professional focused on offensive security and hands-on learning through CTF platforms.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  I regularly solve machines on Hack The Box and Proving Grounds, documenting exploitation paths 
                  and lessons learned along the way.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  This site reflects my continuous growth in security and my commitment to sharing practical 
                  knowledge with the community.
                </p>
              </div>
            </section>

            {/* Technical Skills */}
            <section>
              <h2 className="font-heading font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-accent-primary" />
                Technical Skills
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skills.map((skillGroup) => (
                  <div 
                    key={skillGroup.category} 
                    className="bg-background-surface border border-border p-6"
                  >
                    <h3 className="font-mono text-accent-primary text-sm uppercase tracking-wider mb-4">
                      {skillGroup.category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.items.map((skill) => (
                        <span 
                          key={skill}
                          className="text-xs font-mono bg-background border border-border px-2 py-1 text-text-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Methodology */}
            <section>
              <h2 className="font-heading font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-primary" />
                Methodology
              </h2>
              <div className="bg-background-surface border border-border p-6">
                <p className="text-text-muted text-sm mb-4">
                  My approach to penetration testing follows a structured methodology:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { step: "01", name: "Reconnaissance", desc: "Information gathering" },
                    { step: "02", name: "Enumeration", desc: "Service discovery" },
                    { step: "03", name: "Exploitation", desc: "Initial access" },
                    { step: "04", name: "Post-Exploitation", desc: "Privilege escalation" },
                    { step: "05", name: "Reporting", desc: "Documentation" }
                  ].map((phase) => (
                    <div key={phase.step} className="text-center">
                      <span className="text-accent-primary font-mono text-2xl font-bold">{phase.step}</span>
                      <p className="text-text-primary text-sm font-bold mt-1">{phase.name}</p>
                      <p className="text-text-muted text-xs">{phase.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Profile Card */}
            <div className="bg-background-surface border border-border p-6 text-center">
              <div className="w-24 h-24 border-2 border-accent-primary mx-auto mb-4 flex items-center justify-center">
                <Terminal className="w-12 h-12 text-accent-primary" />
              </div>
              <h3 className="font-heading font-bold text-xl text-text-primary">Maxwell Ferreira</h3>
              <p className="text-accent-primary font-mono text-sm mt-1">Offensive Security</p>
              <p className="text-text-muted text-sm mt-2">
                Penetration Testing | Red Team
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center gap-4 mt-6">
                <a 
                  href="https://linkedin.com/in/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-border flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors"
                  data-testid="about-linkedin"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://github.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-border flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors"
                  data-testid="about-github"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-background-surface border border-border p-6">
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent-primary" />
                Certifications
              </h3>
              <div className="space-y-6">
                {certifications.map((group) => (
                  <div key={group.category}>
                    <p className="text-accent-primary text-xs font-mono mb-3">{group.category}</p>
                    <ul className="space-y-2">
                      {group.items.map((cert) => (
                        <li key={cert.name} className="group">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-text-primary text-sm font-medium">{cert.name}</span>
                              <p className="text-text-muted text-xs">{cert.org}</p>
                            </div>
                            <span className="text-xs font-mono px-2 py-0.5 bg-accent-primary/20 text-accent-primary">
                              Earned
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-background-surface border border-border p-6">
              <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4">
                Quick Facts
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-text-muted">Focus</span>
                  <span className="text-text-primary font-mono">Offensive Sec</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-text-muted">Learning</span>
                  <span className="text-text-primary font-mono">HTB / PG</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-text-muted">Location</span>
                  <span className="text-text-primary font-mono">Remote</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-background-surface border border-accent-primary p-6">
              <h3 className="font-heading font-bold text-text-primary mb-2">
                Let's Connect
              </h3>
              <p className="text-text-muted text-sm mb-4">
                Interested in my work or have an opportunity? I'd love to hear from you.
              </p>
              <Link to="/contact">
                <Button className="btn-primary w-full" data-testid="about-contact-btn">
                  Get In Touch
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
