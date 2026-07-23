import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Phone, MessageCircle, Mail, Pencil, Trash2, Plus } from "lucide-react";
import { GradientButton } from "@/components/safeher/gradient-button";

export const Route = createFileRoute("/app/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — SafeHer AI" }] }),
  component: Contacts,
});

interface Contact {
  _id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  sosMessage?: string;
}

const gradients = [
  "from-pink-500 to-rose-400",
  "from-indigo-500 to-purple-500",
  "from-fuchsia-500 to-pink-500",
  "from-violet-500 to-purple-500",
];

const getToken = () => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("accessToken");
  }
  return null;
};

const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api/v1${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", relationship: "", phone: "", email: "", sosMessage: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await apiCall("/contacts");
      setContacts(data.data?.contacts || data.contacts || []);
      setError("");
    } catch (err) {
      setError("Failed to load contacts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Delete this contact?")) return;

    try {
      await apiCall(`/contacts/${contactId}`, { method: "DELETE" });
      setContacts(contacts.filter((c) => c._id !== contactId));
    } catch (err) {
      alert("Failed to delete contact");
      console.error(err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship || !formData.phone || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const newContact = await apiCall("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          relationship: formData.relationship,
          phone: formData.phone,
          email: formData.email,
          sosMessage: formData.sosMessage || undefined,
        }),
      });
      setContacts([...contacts, newContact.data?.contact || newContact.contact]);
      setFormData({ name: "", relationship: "", phone: "", email: "", sosMessage: "" });
      setShowForm(false);
    } catch (err) {
      alert("Failed to add contact");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSMS = (phone: string) => {
    window.location.href = `sms:${phone}`;
  };

  const handleEmail = (email: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };
  return (
    <ScreenShell>
      <PageHeader
        title="Emergency Contacts"
        subtitle="Your trusted circle"
        right={
          <GradientButton className="px-4 py-2 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </GradientButton>
        }
      />

      {showForm && (
        <GlassCard className="mb-5 p-5">
          <h3 className="text-lg font-semibold mb-4">Add Emergency Contact</h3>
          <form onSubmit={handleAddContact} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name *</label>
              <input
                type="text"
                placeholder="Contact name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Relationship *</label>
              <input
                type="text"
                placeholder="e.g., Mother, Best Friend, Spouse"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Phone Number *</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email *</label>
              <input
                required
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">SOS Message (Optional)</label>
              <textarea
                placeholder="Custom message for SOS alerts"
                value={formData.sosMessage}
                onChange={(e) => setFormData({ ...formData, sosMessage: e.target.value })}
                rows={2}
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Contact"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl bg-muted py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {loading && <div className="text-center text-sm text-muted-foreground">Loading contacts...</div>}
      {error && <div className="text-center text-sm text-destructive">{error}</div>}

      {!loading && contacts.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">No emergency contacts added yet</div>
      )}

      <div className="space-y-3">
        {contacts.map((c, idx) => (
          <GlassCard key={c._id}>
            <div className="flex items-center gap-3">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${gradients[idx % gradients.length]} text-white text-lg font-bold shadow-glow`}
              >
                {c.name[0].toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {c.name} <span className="ml-1 text-xs text-muted-foreground">· {c.relationship}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{c.phone}</div>
              </div>
              <div className="flex gap-1">
                <IconBtn onClick={() => handleCall(c.phone)}>
                  <Phone className="h-4 w-4" />
                </IconBtn>
                <IconBtn onClick={() => handleSMS(c.phone)}>
                  <MessageCircle className="h-4 w-4" />
                </IconBtn>
                <IconBtn onClick={() => handleEmail(c.email)}>
                  <Mail className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">SOS message preview:</span>
              <div className="flex gap-1">
                <IconBtn>
                  <Pencil className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn onClick={() => handleDelete(c._id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </IconBtn>
              </div>
            </div>
            <div className="mt-2 rounded-2xl bg-muted/40 p-3 text-xs italic">
              "{c.sosMessage || 'I need help. Live location: maps.safeher.ai/t/abc — sent by SafeHer AI.'}"
            </div>
          </GlassCard>
        ))}
      </div>
    </ScreenShell>
  );
}
function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="grid h-9 w-9 place-items-center rounded-full glass shadow-soft hover:bg-accent/20 transition-colors">
      {children}
    </button>
  );
}