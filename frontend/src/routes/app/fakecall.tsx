import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Check,
  ChevronRight,
  Clock3,
  Contact2,
  Grid2X2,
  MicOff,
  PhoneIncoming,
  PhoneOff,
  Search,
  Sparkles,
  Star,
  UserRoundPlus,
  Video,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Contact = {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
  favorite?: boolean;
  recent?: boolean;
  initials: string;
  color: string;
};

type PermissionStatus = "pending" | "granted" | "denied" | "loading";

type CallStage = "selection" | "incoming" | "active";

type RingAfterOption = 0 | 5 | 10 | 15 | 30 | 60;

type AutoEndOption = "30s" | "1m" | "5m" | "manual";

type RingtoneOption = "Gentle Chime" | "Pulse" | "Classic";

type VibrationOption = "Standard" | "Soft" | "Off";

export const Route = createFileRoute("/app/fakecall")({
  head: () => ({ meta: [{ title: "Fake Call — SafeHer AI" }] }),
  component: FakeCall,
});

const CONTACTS: Contact[] = Array.from({ length: 50 }, (_, index) => {
  const names = ["Ava", "Noah", "Mia", "Liam", "Sophia", "Ethan", "Olivia", "Lucas", "Emma", "Mason"];
  const surnames = ["Chen", "Patel", "Rivera", "Nguyen", "Garcia", "Wilson", "Kim", "Brown", "Singh", "Lopez"];
  const relationships = ["Family", "Close", "Work", "Favorite", "Home"];
  const colors = ["from-cyan-500 to-blue-500", "from-violet-500 to-fuchsia-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500"];

  const name = `${names[index % names.length]} ${surnames[(index + 2) % surnames.length]}`;
  const phone = `+1 (415) ${520 + index} ${1000 + index}`;

  return {
    id: index + 1,
    name,
    phone,
    relationship: relationships[index % relationships.length],
    favorite: index % 5 === 0,
    recent: index % 7 === 0,
    initials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    color: colors[index % colors.length],
  };
});

function FakeCall() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("pending");
  const [contacts, setContacts] = useState<Contact[]>(CONTACTS.slice(0, 50));
  const [fetchedContacts, setFetchedContacts] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [callStage, setCallStage] = useState<CallStage>("selection");
  const [ringAfter] = useState<RingAfterOption>(0);
  const [vibration] = useState<VibrationOption>("Off");
  const [autoEnd] = useState<AutoEndOption>("manual");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [ringCountdown, setRingCountdown] = useState<number | null>(null);
const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    ringtoneRef.current = new Audio("/ringtones/1.mp3");
    ringtoneRef.current.loop = true;
    ringtoneRef.current.preload = "auto";

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isRinging) {
      void ringtoneRef.current?.play();

      if (typeof navigator !== "undefined" && "vibrate" in navigator && vibration !== "Off") {
        const pattern = vibration === "Soft" ? [300, 120, 300] : [500, 180, 500];
        navigator.vibrate(pattern);
      }
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }
  }, [isRinging, vibration]);

  // Fetch emergency contacts for the logged-in user (if any). If not authenticated,
  // fall back to demo contacts already present.
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = window.localStorage.getItem("accessToken");
        if (!token) {
          setFetchedContacts(true);
          return;
        }

        const res = await fetch("/api/v1/contacts", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });

        if (!res.ok) {
          setFetchedContacts(true);
          return;
        }

        const data = await res.json();
        const list = data?.data?.contacts || data?.contacts || [];
        if (Array.isArray(list) && list.length > 0) {
          // Map backend contacts to local Contact shape
          const mapped = list.map((c: any, idx: number) => ({
            id: idx + 1,
            name: c.name || `Contact ${idx + 1}`,
            phone: c.phone || "",
            relationship: c.relationship || "",
            initials: (c.name || "").split(" ").map((p: string) => p[0] || "").join("").slice(0, 2).toUpperCase(),
            color: "from-cyan-500 to-blue-500",
          }));
          setContacts(mapped);
        }
      } catch (err) {
        // keep demo contacts on failure
      } finally {
        setFetchedContacts(true);
        setPermissionStatus("granted");
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    if (callStage !== "active") {
      return;
    }

    const timer = window.setInterval(() => {
      setCallDuration((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [callStage]);

  useEffect(() => {
    if (callStage !== "selection") {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (ringCountdown === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRingCountdown(null);
      setCallStage("incoming");
      setIsRinging(true);
    }, ringCountdown * 1000);

    timeoutRef.current = timer;

    return () => {
      window.clearTimeout(timer);
      timeoutRef.current = null;
    };
  }, [callStage, ringCountdown]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      const haystack = `${contact.name} ${contact.phone} ${contact.relationship ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [contacts, search]);

  const groupedContacts = useMemo(() => {
    const grouped = new Map<string, Contact[]>();

    filteredContacts.forEach((contact) => {
      const key = contact.name.charAt(0).toUpperCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(contact);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts]);

  const favoriteContacts = filteredContacts.filter((contact) => contact.favorite);
  const recentContacts = filteredContacts.filter((contact) => contact.recent);

  const handlePermissionRequest = async () => {
    setPermissionStatus("loading");

    try {
      if (typeof window === "undefined") {
        throw new Error("unsupported");
      }

      const contactsApi = navigator as Navigator & {
        contacts?: {
          select: (properties: string[]) => Promise<Array<{ name?: Array<{ givenName?: string; familyName?: string }>; tel?: Array<{ value?: string }>; photo?: Array<{ value?: string }> }>>;
        };
      };

      const result = await contactsApi.contacts?.select(["name", "tel", "photo"]);
      if (result && result.length > 0) {
        const mapped = result.map((entry, index) => {
          const givenName = entry.name?.[0]?.givenName ?? "Contact";
          const familyName = entry.name?.[0]?.familyName ?? "";
          const fullName = [givenName, familyName].filter(Boolean).join(" ");
          return {
            id: index + 1000,
            name: fullName || `Contact ${index + 1}`,
            phone: entry.tel?.[0]?.value ?? `+1 555 0${index + 100}`,
            initials: fullName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            color: "from-sky-500 to-indigo-500",
            favorite: index % 6 === 0,
            recent: index % 4 === 0,
          } as Contact;
        });

        setContacts(mapped.slice(0, 50));
        setPermissionStatus("granted");
        return;
      }

      throw new Error("unsupported");
    } catch {
      setContacts(CONTACTS.slice(0, 50));
      setPermissionStatus("granted");
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setCallStage("selection");
    setIsRinging(false);
    setCallDuration(0);
    setRingCountdown(null);
  };

  const handleStartFakeCall = () => {
    if (!selectedContact) {
      return;
    }

    setCallStage("selection");
    setIsRinging(false);
    setCallDuration(0);
    if (ringAfter === 0) {
      setRingCountdown(null);
      setCallStage("incoming");
      setIsRinging(true);
      return;
    }

    setRingCountdown(ringAfter);
  };

  const handleDecline = () => {
    setIsRinging(false);
    setCallStage("selection");
    setRingCountdown(null);
    setCallDuration(0);
  };

  const handleAccept = () => {
    setIsRinging(false);
    setCallStage("active");
    setCallDuration(0);
    setRingCountdown(null);
  };

  const handleEndCall = () => {
    setCallStage("selection");
    setIsRinging(false);
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setRingCountdown(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const activeContact = selectedContact ?? contacts[0];

  return (
    <ScreenShell>
      <PageHeader title="Fake Call" subtitle="Premium iPhone-inspired experience" />

      <div className="mb-4 flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-sky-500" />
          <span>Contacts access for a realistic caller picker</span>
        </div>
        <div className="rounded-full bg-slate-950/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-400">
          {permissionStatus === "loading" ? "Checking" : permissionStatus === "granted" ? "Ready" : "Setup"}
        </div>
      </div>

      {permissionStatus !== "granted" ? (
        <GlassCard className="mb-4 overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.15)] backdrop-blur-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg">
            <Contact2 className="h-8 w-8" />
          </motion.div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Access your contacts</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Let SafeHer build a polished contact picker that feels like the Apple Phone app. If your device blocks contacts access, you can still explore the experience with premium demo contacts.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={handlePermissionRequest}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
            >
              {permissionStatus === "loading" ? "Checking…" : "Allow Contacts Access"}
            </button>
            <button
              onClick={() => {
                setContacts(CONTACTS.slice(0, 50));
                setPermissionStatus("granted");
              }}
              className="rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 backdrop-blur"
            >
              Use Demo Contacts
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="mb-4 overflow-hidden rounded-[32px] border border-white/50 bg-white/70 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Contacts</p>
                <p className="mt-1 text-sm text-slate-600">Choose a caller to begin</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-600">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-3 shadow-inner">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search contacts"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="mb-4 space-y-3">
              {favoriteContacts.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Favorites</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {favoriteContacts.slice(0, 4).map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className={`flex items-center justify-between rounded-[20px] border px-3 py-3 text-left transition ${selectedContact?.id === contact.id ? "border-sky-400 bg-sky-500/10" : "border-white/70 bg-white/70"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${contact.color} text-sm font-semibold text-white`}>
                            {contact.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                            <p className="text-xs text-slate-500">{contact.relationship}</p>
                          </div>
                        </div>
                        <Star className="h-4 w-4 text-amber-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {recentContacts.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Recent</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {recentContacts.slice(0, 4).map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className={`flex items-center justify-between rounded-[20px] border px-3 py-3 text-left transition ${selectedContact?.id === contact.id ? "border-sky-400 bg-sky-500/10" : "border-white/70 bg-white/70"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${contact.color} text-sm font-semibold text-white`}>
                            {contact.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                            <p className="text-xs text-slate-500">{contact.phone}</p>
                          </div>
                        </div>
                        <Clock3 className="h-4 w-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="max-h-[360px] overflow-y-auto pr-1">
              {groupedContacts.map(([letter, items]) => (
                <div key={letter} className="mb-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{letter}</p>
                  <div className="space-y-2">
                    {items.map((contact) => (
                      <motion.button
                        key={contact.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectContact(contact)}
                        className={`flex w-full items-center justify-between rounded-[22px] border px-3 py-3 text-left transition ${selectedContact?.id === contact.id ? "border-sky-400 bg-sky-500/10 shadow-[0_8px_24px_rgba(2,132,199,0.16)]" : "border-white/70 bg-white/70"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${contact.color} text-sm font-semibold text-white`}>
                            {contact.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                            <p className="text-xs text-slate-500">{contact.phone}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <AnimatePresence mode="wait">
            {selectedContact ? (
              <motion.div
                key={selectedContact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 rounded-[30px] border border-white/60 bg-white/80 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${selectedContact.color} text-lg font-semibold text-white`}>
                    {selectedContact.initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedContact.name}</p>
                    <p className="text-sm text-slate-600">{selectedContact.phone}</p>
                    {selectedContact.relationship ? <p className="text-xs text-slate-500">{selectedContact.relationship}</p> : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <span>Ready for a premium incoming call experience</span>
                </div>
                <button
                  onClick={handleStartFakeCall}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01]"
                >
                  <PhoneIncoming className="h-4 w-4" />
                  Start Fake Call
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

        </>
      )}

      <AnimatePresence>
        {callStage === "incoming" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),rgba(15,23,42,0.75))] px-3 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              className="relative w-full max-w-md rounded-[40px] border border-white/20 bg-slate-950/90 p-6 text-center text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
            >
              <div className="mb-5 flex justify-end">
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300">
                  Incoming Call
                </div>
              </div>

              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-3xl font-semibold shadow-[0_0_0_16px_rgba(255,255,255,0.12)]"
              >
                {activeContact?.initials}
              </motion.div>

              <h2 className="text-3xl font-semibold">{activeContact?.name}</h2>
              <p className="mt-2 text-sm text-slate-400">{activeContact?.phone}</p>
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-300">
                <BellRing className="h-4 w-4" />
                <span>Ringing...</span>
              </div>

              <div className="mx-auto mt-6 flex max-w-[220px] items-end justify-center gap-1">
                {[18, 26, 34, 24, 30].map((height, index) => (
                  <motion.div
                    key={height}
                    animate={{ height: [8, height, 8] }}
                    transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY, delay: index * 0.08 }}
                    className="w-2 rounded-full bg-gradient-to-t from-sky-400 to-white"
                  />
                ))}
              </div>

              <div className="mt-8 flex justify-center gap-5">
                <button
                  onClick={handleDecline}
                  className="grid h-16 w-16 place-items-center rounded-full bg-red-500 text-white shadow-lg transition hover:scale-105"
                >
                  <PhoneOff className="h-7 w-7" />
                </button>
                <button
                  onClick={handleAccept}
                  className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:scale-105"
                >
                  <PhoneIncoming className="h-7 w-7" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {callStage === "active" ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.92))] px-3 py-6 text-white"
          >
            <div className="w-full max-w-md rounded-[40px] border border-white/15 bg-white/10 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Active Call</p>
                  <p className="mt-1 text-xl font-semibold">{activeContact?.name}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200">
                  {formatDuration(callDuration)}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl font-semibold text-white"
                >
                  {activeContact?.initials}
                </motion.div>
                <p className="text-lg font-semibold">{activeContact?.phone}</p>
                <p className="mt-1 text-sm text-slate-400">{isMuted ? "Muted" : "On call"}</p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: "Mute", icon: <MicOff className="h-5 w-5" />, active: isMuted, onClick: () => setIsMuted((value) => !value) },
                  { label: "Speaker", icon: <Volume2 className="h-5 w-5" />, active: isSpeakerOn, onClick: () => setIsSpeakerOn((value) => !value) },
                  { label: "Keypad", icon: <Grid2X2 className="h-5 w-5" />, active: false, onClick: () => undefined },
                ].map((button) => (
                  <button
                    key={button.label}
                    onClick={button.onClick}
                    className={`rounded-[22px] border px-3 py-4 text-sm ${button.active ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-white/10 bg-white/10 text-slate-200"}`}
                  >
                    <div className="mb-2 flex justify-center">{button.icon}</div>
                    {button.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Add Call", icon: <UserRoundPlus className="h-5 w-5" /> },
                  { label: "FaceTime", icon: <Video className="h-5 w-5" /> },
                  { label: "Contacts", icon: <Contact2 className="h-5 w-5" /> },
                ].map((button) => (
                  <button
                    key={button.label}
                    className="rounded-[22px] border border-white/10 bg-white/10 px-3 py-4 text-sm text-slate-200"
                  >
                    <div className="mb-2 flex justify-center">{button.icon}</div>
                    {button.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleEndCall}
                  className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ScreenShell>
  );
}