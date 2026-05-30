import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../provider/AuthProvider";
import apiClient from "../../lib/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, UserPlus, Trash2, MessageSquare, Mail, 
  Linkedin, Phone, Clock, Activity, Search, Plus, 
  X, Check, Loader2, AlertCircle, Sparkles, ChevronRight, Zap, Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const catalysts = [
  {
    type: "LinkedIn Outreach",
    title: "LinkedIn Startup Warm Outreach",
    challenge: "Identify a tech lead at a mid-sized US/EU startup hiring remote React/Node developers on LinkedIn. Send them a connection request with a warm pitch.",
    template: "Hi [Name], I'm a full-stack developer based in Dhaka. I really enjoyed your team's open-source blog post on scaling React states. I'm building similar modular planners in my spare time and wanted to connect to follow your work!",
    url: "https://www.linkedin.com",
    urlText: "Go to LinkedIn"
  },
  {
    type: "Cold Email",
    title: "Cold Mail for Tech Referral & Mentorship",
    challenge: "Find a Bangladeshi developer currently working remotely or at a top global firm (Vercel, Gitlab, Shopify). Send them a short email asking for a quick review of your projects.",
    template: "Subject: Dev check-in from Dhaka / Portfolio feedback?\n\nDear [Name],\n\nHope you're having a productive week! I'm a developer based in Dhaka, working full-time while shipping side-projects.\n\nI highly admire how you made the jump to global remote work. If your schedule allows, would you be open to a quick 5-minute review of my life-manager project portfolio? Your feedback would be invaluable.\n\nThank you,\n[Your Name]",
    url: "mailto:",
    urlText: "Compose Email"
  },
  {
    type: "Hobby Connection",
    title: "Dhaka Tech Community Pulse Check",
    challenge: "Look up upcoming meetups by React Dhaka, JS Bangladesh, or GDG Dhaka. RSVP for the next physical event and ping a connection in your network to go together.",
    template: "Hey [Name], are you planning to attend the next Dhaka Tech Meetup this Saturday? I'm registering today, let me know if you want to join and go together!",
    url: "https://www.facebook.com/groups/jsbangladesh",
    urlText: "Check JS Bangladesh"
  },
  {
    type: "Hobby Connection",
    title: "Weekend Physical Active Networking",
    challenge: "Join the BDCyclists weekend morning ride or go for a run around Dhanmondi / Gulshan Lake. Offline sports circles are high-yield spaces for unexpected career referrals.",
    template: "Hey [Name], are you doing any cycling rides or running this weekend? Let me know if you want to team up for a morning session!",
    url: "https://www.facebook.com/groups/bdcyclists",
    urlText: "Check BDCyclists Group"
  },
  {
    type: "LinkedIn Outreach",
    title: "LinkedIn Project Spotlight Pitch",
    challenge: "Feature your modular Buffer Task Manager on your LinkedIn profile. Post a 3-sentence summary of your technical architecture (React, Express, read-time computed vitality decay).",
    template: "I just shipped my new modular 'Task Buffer' & Vector Social CRM built with React, Tailwind, and Express. It dynamically computes connection decay timers on read to eliminate cron sync drift. Code link in bio!",
    url: "https://www.linkedin.com",
    urlText: "Spotlight on LinkedIn"
  }
];

// Helper to get today's catalyst (changes daily)
const getTodayCatalyst = () => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return catalysts[day % catalysts.length];
};

function SocialCRM() {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [copiedCatalyst, setCopiedCatalyst] = useState(false);
  
  // Decaying contacts state (Autopilot loop)
  const [decayingContacts, setDecayingContacts] = useState([]);
  const [loadingDecaying, setLoadingDecaying] = useState(true);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [copiedScript, setCopiedScript] = useState(false);
  
  // Autonomous email outreach states
  const [isSendingMail, setIsSendingMail] = useState({}); // { [contactId]: boolean }
  const [sandboxLink, setSandboxLink] = useState(null); // sandbox preview link (if using Ethereal sandbox fallback)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [cadenceDays, setCadenceDays] = useState(30);
  const [referredBy, setReferredBy] = useState("");
  const [interests, setInterests] = useState("");
  const [notes, setNotes] = useState("");
  const [group, setGroup] = useState("Professional");

  useEffect(() => {
    if (user?.uid) {
      fetchContacts();
      fetchDecayingContacts();
    }
    // Auto-request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  // Spawn local browser notifications with system action buttons support
  const sendLocalNotification = (title, body, data = {}) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      // Check if service worker is active and controlling the page
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/logo.svg",
            badge: "/logo-maskable.svg",
            tag: data.contactId ? `decay-${data.contactId}` : 'general-uplink',
            data: {
              userId: user?.uid,
              apiUrl: apiClient.baseUrl || 'http://localhost:5000',
              ...data
            },
            actions: data.contactId ? [
              { action: 'quick-ping', title: '⚡ Quick Log' }
            ] : []
          });
        }).catch((err) => {
          console.error("Service Worker notification failed, falling back to standard:", err);
          new Notification(title, { body, icon: "/logo.svg", badge: "/logo-maskable.svg" });
        });
      } else {
        // Fallback for dev mode where Service Worker is not active/registered
        try {
          new Notification(title, {
            body,
            icon: "/logo.svg",
            badge: "/logo-maskable.svg",
            tag: data.contactId ? `decay-${data.contactId}` : 'general-uplink'
          });
        } catch (err) {
          console.error("Standard notification constructor failed:", err);
        }
      }
    }
  };

  // Adjust default cadence when relationship group changes
  const handleGroupChange = (selectedGroup) => {
    setGroup(selectedGroup);
    if (selectedGroup === "Romantic") {
      setCadenceDays(3);
    } else if (selectedGroup === "Family") {
      setCadenceDays(7);
    } else if (selectedGroup === "Friend") {
      setCadenceDays(14);
    } else {
      setCadenceDays(30);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/contacts/${user.uid}`);
      setContacts(data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("Failed to sync connection matrices.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDecayingContacts = async () => {
    setLoadingDecaying(true);
    try {
      const data = await apiClient.get(`/contacts/${user.uid}/decaying`);
      setDecayingContacts(data);
      // Clamp currentDeckIndex in case the array size shrunk below our index
      setCurrentDeckIndex(prev => Math.min(prev, Math.max(0, data.length - 1)));
    } catch (err) {
      console.error("Error fetching decaying connection nodes:", err);
    } finally {
      setLoadingDecaying(false);
    }
  };

  const handleDeckNext = () => {
    if (decayingContacts.length === 0) return;
    setCurrentDeckIndex(prev => (prev + 1) % decayingContacts.length);
  };

  const handleDeckPrev = () => {
    if (decayingContacts.length === 0) return;
    setCurrentDeckIndex(prev => (prev - 1 + decayingContacts.length) % decayingContacts.length);
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (contacts.length >= 15) {
      setError("Active Roster Cap Reached! You have mapped 15 active contacts. To keep networking sustainable and prevent overhead, we cap active relationships at 15. Please prune an existing node before registering a new one.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const interestArray = interests
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        cadenceDays: Number(cadenceDays),
        group,
        referredBy: referredBy || undefined,
        interests: interestArray,
        notes: notes.trim()
      };

      await apiClient.post(`/contacts/${user.uid}`, payload);
      setSuccessMsg("New connection vector registered!");
      
      // Fire local notification
      sendLocalNotification(
        `Node Synced // ${name.trim()}`,
        `Connection registered in ${group}. Cadence set to ${cadenceDays} days.`
      );
      
      // Reset form fields
      setName("");
      setEmail("");
      setPhone("");
      setLinkedin("");
      setCadenceDays(30);
      setReferredBy("");
      setInterests("");
      setNotes("");
      setGroup("Professional");
      setShowAddForm(false);

      fetchContacts();
      fetchDecayingContacts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Error creating contact:", err);
      setError(err.message || "Failed to catalog connection node.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to prune this connection vector?")) return;
    try {
      await apiClient.delete(`/contacts/${user.uid}/${contactId}`);
      setSuccessMsg("Connection vector successfully pruned.");
      fetchContacts();
      fetchDecayingContacts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Error deleting contact:", err);
      setError("Failed to delete contact node.");
    }
  };

  // Resets contact's dynamic vitality by logging an interaction ping
  const handlePingContact = async (contact, type = "manual", summary = "Pinged contact") => {
    try {
      await apiClient.post(`/contacts/${user.uid}/${contact._id}/ping`, { summary });
      setSuccessMsg(`Vitality battery re-charged for ${contact.name}!`);
      
      // Fire local notification
      sendLocalNotification(
        `Vitality Restored // ${contact.name}`,
        `Battery recharged to 100%. Touchpoint logged successfully.`
      );
      fetchContacts();
      fetchDecayingContacts();
      setTimeout(() => setSuccessMsg(null), 4000);

      // Perform outreach action redirects
      if (type === "whatsapp" && contact.phone) {
        const outreachMsg = contact.aiMessage || generateTemplate(contact);
        const text = encodeURIComponent(outreachMsg);
        window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
      } else if (type === "email" && contact.email) {
        const outreachMsg = contact.aiMessage || generateTemplate(contact);
        const subject = encodeURIComponent("Friendly check-in!");
        const body = encodeURIComponent(outreachMsg);
        window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_blank");
      }
    } catch (err) {
      console.error("Error pinging contact:", err);
      setError("Failed to transmit ping vector.");
    }
  };

  // Triggers server-side autonomous mailing dispatch
  const handleAutonomousEmailSend = async (contact) => {
    if (!contact.email) {
      setError("This contact has no email address registered.");
      return;
    }

    setIsSendingMail(prev => ({ ...prev, [contact._id]: true }));
    setError(null);
    setSandboxLink(null);

    const outreachMsg = contact.aiMessage || generateTemplate(contact);
    const subject = `Catching up! // ${contact.name}`;

    try {
      const response = await apiClient.post(`/contacts/${user.uid}/${contact._id}/auto-email`, {
        outreachMessage: outreachMsg,
        subject
      });

      setSuccessMsg(`Autonomous email dispatched successfully to ${contact.name}!`);
      
      // Fire local system notification
      sendLocalNotification(
        `Email Dispatched // ${contact.name}`,
        `Autonomous outreach sent. Vitality recharged successfully.`
      );

      // If developer Ethereal sandbox link was returned, save it
      if (response.previewUrl) {
        setSandboxLink(response.previewUrl);
        console.log('[Dev Sandbox URL]:', response.previewUrl);
      }

      fetchContacts();
      fetchDecayingContacts();
      setTimeout(() => setSuccessMsg(null), 10000); // Leave it slightly longer for copy-pasting the dev link
    } catch (err) {
      console.error("Error sending autonomous email:", err);
      setError(err.message || "Failed to dispatch autonomous email.");
    } finally {
      setIsSendingMail(prev => ({ ...prev, [contact._id]: false }));
    }
  };

  // Generate localized outreach templates
  const generateTemplate = (contact) => {
    const isBD = contact.phone?.startsWith("+88") || contact.phone?.startsWith("01") || contact.name.match(/(M(d|d\.)|Mohammad|Rahman|Islam|Hasan|Akter|Sultana)/i);
    
    // Group-based warm custom templates
    if (contact.group === "Family") {
      const salutation = isBD ? "Assalamu Alaikum " : "Hey ";
      return `${salutation}${contact.name}, had a moment to think of you today! How is your health and everything going? Let's catch up on a call tonight bhaiya/apu/ammu/abbu!`;
    }
    
    if (contact.group === "Romantic") {
      return `Hey ${contact.name}, hope your day isn't too tiring. Had a thought about you today—have you had lunch yet? Let me know how your schedule is looking later!`;
    }
    
    if (contact.group === "Friend") {
      const friendPing = isBD ? "grab some tea (cha) this weekend" : "hang out or grab a coffee this week";
      return `Hey ${contact.name}, what's up buddy! We haven't caught up in a while. How have things been? Let's ${friendPing} and sync up!`;
    }
    
    // Professional check-ins
    const salutation = isBD ? "Assalamu Alaikum " : "Hey ";
    if (contact.interests?.length > 0) {
      const topInterest = contact.interests[0];
      return `${salutation}${contact.name}, hope you're doing well! Was just thinking about our last discussion regarding #${topInterest}. How has your work been treating you lately? Let's catch up sometime soon!`;
    }
    
    return `${salutation}${contact.name}, hope you're having a productive week! Long time no talk—let's grab a coffee or jump on a quick call sometime soon. How's everything going on your end?`;
  };

  // Filters logic
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (contact.notes && contact.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          contact.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterStatus === "All" || contact.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate high-level stats
  const decayingCount = contacts.filter(c => c.status === "Critical" || c.status === "Degrading").length;
  const healthPercent = contacts.length > 0 
    ? Math.round(((contacts.length - decayingCount) / contacts.length) * 100) 
    : 100;

  // Custom UI colors mapping based on relationship category
  const getGroupStyles = (grp) => {
    switch (grp) {
      case "Romantic":
        return {
          card: "border-rose-500/20 hover:border-rose-500/50 bg-rose-500/[0.01]",
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/35",
          btn: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/25"
        };
      case "Family":
        return {
          card: "border-sky-500/20 hover:border-sky-500/50 bg-sky-500/[0.01]",
          badge: "bg-sky-500/10 text-sky-400 border-sky-500/35",
          btn: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/25"
        };
      case "Friend":
        return {
          card: "border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/[0.01]",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/35",
          btn: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25"
        };
      default: // Professional
        return {
          card: "border-violet-500/20 hover:border-violet-500/50 bg-violet-500/[0.01]",
          badge: "bg-violet-500/10 text-violet-400 border-violet-500/35",
          btn: "bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border-violet-500/25"
        };
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background text-foreground py-4 sm:py-6 px-3 sm:px-6">
      <main className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header Grid */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/60 pb-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter uppercase leading-none">Vector Social Graph</h1>
              <Badge variant="outline" className="px-1.5 py-0 h-4 text-[8px] font-black uppercase tracking-widest border-violet-500/30 text-violet-400 bg-violet-500/5">CRM.v2</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-violet-400 animate-pulse animate-duration-1000 shrink-0" />
              Relationship Decay & Referral Tree Diagnostics
            </p>
          </div>

          {/* Quick Metrics & Test Uplink */}
          <div className="flex items-center gap-3 sm:gap-4 bg-secondary/5 border border-border/40 py-1.5 px-3 rounded-xl text-[10px] font-mono w-fit">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground uppercase text-[8px] font-black">Vitality:</span>
              <span className={`font-bold ${healthPercent > 70 ? "text-emerald-500" : healthPercent > 40 ? "text-amber-500" : "text-rose-500"}`}>
                {healthPercent}%
              </span>
            </div>
            
            <Separator orientation="vertical" className="h-4 bg-border/40" />

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground uppercase text-[8px] font-black">Decaying:</span>
              <span className={`font-bold ${decayingCount > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}>
                {decayingCount}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4 bg-border/40" />

            <button
              type="button"
              onClick={() => {
                if ("Notification" in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                      const firstDecaying = contacts.find(c => c.vitality < 100);
                      if (firstDecaying) {
                        sendLocalNotification(
                          `Decay Alert // ${firstDecaying.name}`,
                          `Vitality battery at ${firstDecaying.vitality}%. Tap Quick Log to recharge from your lock screen!`,
                          { contactId: firstDecaying._id }
                        );
                      } else {
                        sendLocalNotification(
                          "Buffer System Uplink Active",
                          `Operational relationship matrix online. ${contacts.length} nodes cataloged.`
                        );
                      }
                    } else {
                      alert("Please enable browser notifications in your settings to test the uplink!");
                    }
                  });
                } else {
                  alert("This browser does not support native desktop notifications.");
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-[8px] font-black uppercase tracking-widest border border-violet-500/25 rounded-lg active:scale-95 transition-all cursor-pointer"
              title="Test Lock Screen Notifications"
            >
              <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Test Uplink</span>
            </button>
          </div>
        </header>

        {/* Global Warnings / Success Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-500/5 border border-rose-500/30 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-500">Anomaly Detected</h4>
                <p className="text-xs text-muted-foreground/80 font-mono mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-500/5 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Operational Success</h4>
                <p className="text-xs text-muted-foreground/80 font-mono mt-0.5">{successMsg}</p>
              </div>
            </motion.div>
          )}

          {sandboxLink && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-violet-500/5 border border-violet-500/35 rounded-2xl flex items-center justify-between gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-violet-400">Sandbox Uplink Mail Dispatched</h4>
                  <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">Email sent via Developer Ethereal sandbox account. You can preview the rich HTML email layout instantly!</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => window.open(sandboxLink, "_blank")}
                className="w-full sm:w-auto bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 font-black uppercase tracking-widest text-[9px] py-1.5 px-3 rounded-xl border border-violet-500/25 shrink-0 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Preview Sent Mail</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Toolbar */}
        <section className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-secondary/10 border border-border/60 rounded-xl text-[11px] focus:outline-none focus:border-violet-500/50 transition-all font-mono text-foreground"
              />
            </div>

            {/* Compact Register Node button next to search in mobile */}
            <Button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-widest text-[9px] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 shrink-0 active:scale-95 transition-all border border-violet-500/20"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{showAddForm ? "Cancel" : "Add Node"}</span>
            </Button>
          </div>

          {/* Filter buttons on a single row below */}
          <div className="flex bg-secondary/20 p-0.5 rounded-xl border border-border/40 w-full overflow-x-auto justify-between sm:justify-start gap-1 select-none scrollbar-none">
            {["All", "Stable", "Degrading", "Critical"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`flex-1 sm:flex-none text-center px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === status
                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* Create Node Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleCreateContact} className="p-6 bg-secondary/5 rounded-3xl border border-border/50 space-y-6">
                <div className="border-b border-border/40 pb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Insert New Connection Vector</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tasnim Rahman"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>

                  {/* Group field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Relationship Circle</label>
                    <select
                      value={group}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    >
                      <option value="Professional">💼 Professional (30d Cadence)</option>
                      <option value="Friend">☕ Friend (14d Cadence)</option>
                      <option value="Family">🏡 Family (7d Cadence)</option>
                      <option value="Romantic">💖 Romantic (3d Cadence)</option>
                    </select>
                  </div>

                  {/* Phone field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Phone (WhatsApp Sync)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +8801700000000"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>

                  {/* LinkedIn field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">LinkedIn Username or URL</label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="e.g. linkedin.com/in/username"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>

                  {/* Cadence field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Interaction Cadence (Days)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={cadenceDays}
                      onChange={(e) => setCadenceDays(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>

                  {/* ReferredBy field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Referred By (Graph Connector)</label>
                    <select
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground select-none"
                    >
                      <option value="">-- No Direct Referral --</option>
                      {contacts.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Interests */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Interests & Tech Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="e.g. React, Remote Work, Go, Cycling"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Context Notes & Background</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Met at JS Dhaka, lead developer looking to hire a remote freelancer."
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-violet-500/50 font-mono text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border/30 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-[9px] py-2 px-6 rounded-xl flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Catalog Vector</span>
                  </Button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* AI Sequence Autopilot Loop Deck */}
        <section className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-rose-500/10 border border-violet-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 relative overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
            <Sparkles className="w-40 h-40 text-violet-400" />
          </div>

          {loadingDecaying ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest animate-pulse">
                Preloading AI Outreach...
              </span>
            </div>
          ) : decayingContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2 text-center z-10 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center mb-1.5 shrink-0">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-mono text-[8px] font-black tracking-widest uppercase mb-0.5">
                AUTOPILOT SUSTAINABLE
              </Badge>
              <h3 className="text-xs font-black uppercase tracking-tight text-foreground">
                All Roster Nodes Stable 🌟
              </h3>
              <p className="text-[9px] leading-relaxed text-muted-foreground font-mono font-medium max-w-md mt-0.5 text-center">
                Zero relationship decay. Your 15-contact active roster is fully calibrated. Check back tomorrow!
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Card slider content */}
              <div className="space-y-3 max-w-2xl text-left w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-500/10 border border-rose-500/35 text-rose-400 font-mono text-[9px] font-black tracking-widest uppercase animate-pulse">
                      AUTOPILOT SEQUENCE DECK
                    </Badge>
                    <Badge className="bg-secondary/40 text-muted-foreground border border-border/40 font-mono text-[9px] font-black tracking-widest uppercase">
                      NODE {currentDeckIndex + 1} OF {decayingContacts.length}
                    </Badge>
                  </div>
                  {decayingContacts.length > 1 && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handleDeckPrev}
                        className="px-2.5 py-1 rounded-xl bg-secondary/50 border border-border/60 text-muted-foreground hover:text-foreground text-[8px] font-mono font-black active:scale-95 transition-all"
                      >
                        PREV
                      </button>
                      <button
                        type="button"
                        onClick={handleDeckNext}
                        className="px-2.5 py-1 rounded-xl bg-secondary/50 border border-border/60 text-muted-foreground hover:text-foreground text-[8px] font-mono font-black active:scale-95 transition-all"
                      >
                        NEXT
                      </button>
                    </div>
                  )}
                </div>

                {/* Animated active card */}
                <AnimatePresence mode="wait">
                  {decayingContacts[currentDeckIndex] && (
                    <motion.div
                      key={decayingContacts[currentDeckIndex]._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-border/20 pb-2">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                            {decayingContacts[currentDeckIndex].name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-mono text-muted-foreground">Circle:</span>
                            <span className="text-[8px] font-mono font-bold text-violet-400 bg-violet-500/10 px-1 py-0.2 rounded border border-violet-500/20">
                              {decayingContacts[currentDeckIndex].group.toUpperCase()}
                            </span>
                            <span className="text-[8px] font-mono text-muted-foreground ml-2">Decayed:</span>
                            <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                              {100 - decayingContacts[currentDeckIndex].vitality}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-muted-foreground block uppercase">Node Vitality</span>
                          <span className="text-lg font-mono font-bold text-rose-400">
                            {decayingContacts[currentDeckIndex].vitality}%
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground font-mono italic">
                        Dossier: "{decayingContacts[currentDeckIndex].notes || 'No historical background logged.'}"
                      </p>

                      {/* AI message script pre-drafted */}
                      <div className="bg-background/40 border border-border/40 p-3 rounded-2xl space-y-1 text-left relative group/box">
                        <span className="text-[8px] font-black uppercase tracking-widest text-violet-400/80 block flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
                          AI Outreach Template (Gemini 2.5-Flash)
                        </span>
                        <p className="text-[10px] text-foreground font-medium leading-relaxed font-mono whitespace-pre-line pr-8">
                          {decayingContacts[currentDeckIndex].aiMessage}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(decayingContacts[currentDeckIndex].aiMessage);
                            setCopiedScript(true);
                            setTimeout(() => setCopiedScript(false), 2000);
                          }}
                          className="absolute right-3.5 top-3.5 p-1.5 rounded-lg bg-background border border-border/60 hover:border-violet-500/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Copy AI outreach script"
                        >
                          {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Outreach triggers for the active card */}
              {decayingContacts[currentDeckIndex] && (
                <div className="flex flex-col gap-3 shrink-0 w-full lg:w-52">
                  <Button
                    onClick={() => handlePingContact(decayingContacts[currentDeckIndex], "whatsapp", `WhatsApp Autopilot check-in`)}
                    disabled={!decayingContacts[currentDeckIndex].phone}
                    className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-black uppercase tracking-widest text-[9px] py-3 rounded-xl border border-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Ping</span>
                  </Button>

                  <Button
                    onClick={() => handleAutonomousEmailSend(decayingContacts[currentDeckIndex])}
                    disabled={!decayingContacts[currentDeckIndex].email || isSendingMail[decayingContacts[currentDeckIndex]._id]}
                    className="w-full bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-black uppercase tracking-widest text-[9px] py-3 rounded-xl border border-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSendingMail[decayingContacts[currentDeckIndex]._id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>{isSendingMail[decayingContacts[currentDeckIndex]._id] ? "Mailing Uplink..." : "⚡ Auto Send Mail"}</span>
                  </Button>

                  <Button
                    onClick={() => handlePingContact(decayingContacts[currentDeckIndex], "manual", `Logged quick-ping via Autopilot Deck`)}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-widest text-[9px] py-3 rounded-xl border border-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/10 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Quick Log Ping</span>
                  </Button>

                  <div className="text-[8px] font-mono text-muted-foreground/45 text-center uppercase tracking-wider font-bold">
                    Autopilot mode completes in 60s
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Daily Networking Catalyst Tip Widget */}
        <section className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-rose-500/10 border border-violet-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
            <Sparkles className="w-40 h-40 text-violet-400" />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-2xl text-left">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="bg-violet-500/10 border border-violet-500/35 text-violet-400 font-mono text-[8px] font-black tracking-widest uppercase">
                  DAILY NETWORKING CATALYST (MEET NEW PEOPLE)
                </Badge>
                <Badge className="bg-secondary/40 text-muted-foreground border border-border/40 font-mono text-[8px] font-black tracking-widest uppercase">
                  {getTodayCatalyst().type.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                {getTodayCatalyst().title}
              </h3>
              <p className="text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground font-mono font-medium">
                {getTodayCatalyst().challenge}
              </p>
              
              <div className="bg-background/40 border border-border/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl space-y-0.5 text-left relative group/box">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 block">Catalyst Pitch Template</span>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium leading-relaxed font-mono whitespace-pre-line pr-8">
                  {getTodayCatalyst().template}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getTodayCatalyst().template);
                    setCopiedCatalyst(true);
                    setTimeout(() => setCopiedCatalyst(false), 2000);
                  }}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-background border border-border/60 hover:border-violet-500/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Copy Pitch Template"
                >
                  {copiedCatalyst ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
              <Button
                onClick={() => window.open(getTodayCatalyst().url, "_blank")}
                className="w-full lg:w-44 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-widest text-[9px] py-2 sm:py-3 rounded-xl border border-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/10 cursor-pointer"
              >
                <span>{getTodayCatalyst().urlText}</span>
                <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
              </Button>
              <div className="text-[8px] font-mono text-muted-foreground/45 text-center uppercase tracking-wider font-bold">
                Resets dynamically every 24 hours
              </div>
            </div>
          </div>
        </section>

        {/* CRM Connection Grid */}
        <section className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest animate-pulse">Syncing Vector Matrices...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-secondary/5">
              <Network className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Zero Nodes Detected</h3>
              <p className="text-[10px] text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Your connection matrices are unpopulated. Click the "Register Node" button above to map your first contact.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredContacts.map((contact) => {
                  const grpStyle = getGroupStyles(contact.group);
                  return (
                    <motion.div
                      key={contact._id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-6 bg-secondary/5 border rounded-3xl transition-all duration-300 relative group flex flex-col justify-between h-[360px] ${
                        contact.status === "Critical" 
                          ? "border-rose-500/20 hover:border-rose-500/50 bg-rose-500/[0.01]" 
                          : contact.status === "Degrading"
                          ? "border-amber-500/20 hover:border-amber-500/50 bg-amber-500/[0.01]"
                          : grpStyle.card
                      }`}
                    >
                      
                      {/* Top Section */}
                      <div>
                        {/* Badge / Status / Group row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1.5">
                            <Badge 
                              variant="outline" 
                              className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold leading-none ${
                                contact.status === "Critical" 
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/35"
                                  : contact.status === "Degrading"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/35"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/35"
                              }`}
                            >
                              {contact.status.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold leading-none ${grpStyle.badge}`}
                            >
                              {contact.group.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteContact(contact._id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                              title="Prune Node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Info & Referral Lineage */}
                        <div className="space-y-1">
                          <h3 className="text-md font-black uppercase tracking-tight text-foreground line-clamp-1">{contact.name}</h3>
                          {contact.referredBy && (
                            <div className="flex items-center gap-1 text-[8px] text-violet-400 uppercase font-black tracking-widest pt-0.5">
                              <Activity className="w-3 h-3 flex-shrink-0" />
                              <span className="opacity-60">Referred By:</span>
                              <span className="bg-violet-500/10 border border-violet-500/25 px-1 py-0.5 rounded font-mono">
                                {contact.referredBy.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Vitality Gauge */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Battery Power
                            </span>
                            <span className="font-mono text-foreground">{contact.vitality}%</span>
                          </div>
                          {/* Gauge container */}
                          <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden border border-border/30">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                contact.status === "Critical" 
                                  ? "bg-gradient-to-r from-rose-600 to-rose-400" 
                                  : contact.status === "Degrading"
                                  ? "bg-gradient-to-r from-amber-600 to-amber-400"
                                  : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                              }`}
                              style={{ width: `${contact.vitality}%` }}
                            />
                          </div>
                          <div className="text-[8px] font-mono text-muted-foreground/50 text-right uppercase">
                            Last touchpoint: {contact.daysSinceLastInteraction}d ago (Cadence: {contact.cadenceDays}d)
                          </div>
                        </div>

                        {/* Notes Summary */}
                        <div className="mt-4 space-y-1 bg-secondary/10 p-3 rounded-2xl border border-border/30 h-16 overflow-y-auto scrollbar-thin">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 block">Dossier Context</span>
                          <p className="text-[10px] text-muted-foreground font-medium leading-relaxed font-mono">
                            {contact.notes || "No context noted. Sync a new touchpoint to record history."}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Section - Active Buttons / Pings */}
                      <div className="space-y-3 pt-3 border-t border-border/20">
                        
                        {/* Interest Tags */}
                        <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto scrollbar-none">
                          {contact.interests.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="px-1.5 py-0.5 rounded text-[8px] font-mono text-muted-foreground border-border/60 bg-secondary/20">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Low Friction Outreach Triggers */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* WhatsApp trigger */}
                          <button
                            onClick={() => handlePingContact(contact, "whatsapp", `WhatsApp ${contact.group} outreach ping`)}
                            disabled={!contact.phone}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-colors border ${
                              contact.phone 
                                ? grpStyle.btn
                                : "bg-secondary/40 text-muted-foreground/30 border-border/30 cursor-not-allowed"
                            }`}
                            title={contact.phone ? "Send WhatsApp & Log Reset" : "No Phone Recorded"}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Email Trigger */}
                          <button
                            onClick={() => handleAutonomousEmailSend(contact)}
                            disabled={!contact.email || isSendingMail[contact._id]}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-colors border ${
                              contact.email 
                                ? "bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border-violet-500/25" 
                                : "bg-secondary/40 text-muted-foreground/30 border-border/30 cursor-not-allowed"
                            }`}
                            title={contact.email ? "Send Email & Log Reset" : "No Email Recorded"}
                          >
                            {isSendingMail[contact._id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                            <span>{isSendingMail[contact._id] ? "Mailing..." : "⚡ Auto Mail"}</span>
                          </button>

                          {/* Fast Reset without redirect */}
                          <button
                            onClick={() => handlePingContact(contact, "manual", "Manual Quick ping logged")}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-colors bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                            title="Instant re-charge timer inside app"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Quick Log</span>
                          </button>
                        </div>

                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default SocialCRM;
