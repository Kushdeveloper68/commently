import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock, MessageSquare, CircleDot, Send, Zap, SlidersHorizontal, Filter, MessageCircle, ChevronRight, Rocket } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout.jsx";
import PhonePreview from "../components/PhonePreview.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function AutomationBuilder() {
  const { id } = useParams();
  const isEditing = id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    channel: "comment",
    triggerType: "any_post",
    mediaId: "",
    keywordMode: "specific_words",
    keywords: "",
    publicReplyEnabled: false,
    publicReplyMessage: "",
    followGateEnabled: false,
    followGateMessage: "Follow us to get the link! Tap below once you have 👇",
    dmMessage: "",
    buttonText: "",
    buttonUrl: "",
  });

  const isFree = user?.plan === "free";

  useEffect(() => {
    api.get("/instagram/accounts").then((res) => {
      setAccounts(res.data.accounts);
      if (res.data.accounts.length > 0) setSelectedAccount(res.data.accounts[0]._id);
    });

    if (isEditing) {
      api.get(`/automations/${id}`).then((res) => {
        const a = res.data.automation;
        setSelectedAccount(a.instagramAccount);
        setForm({
          name: a.name,
          channel: a.channel || "comment",
          triggerType: a.trigger.type,
          mediaId: a.trigger.mediaId || "",
          keywordMode: a.keywordMatch.mode,
          keywords: a.keywordMatch.keywords.join(", "),
          publicReplyEnabled: a.publicReply?.enabled || false,
          publicReplyMessage: a.publicReply?.message || "",
          followGateEnabled: a.followGate?.enabled || false,
          followGateMessage: a.followGate?.promptMessage || "",
          dmMessage: a.dmReply.message,
          buttonText: a.dmReply.buttonText || "",
          buttonUrl: a.dmReply.buttonUrl || "",
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (selectedAccount && form.triggerType === "specific_post") {
      api.get(`/instagram/accounts/${selectedAccount}/media`).then((res) => setMedia(res.data.media));
    }
  }, [selectedAccount, form.triggerType]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Give your automation a name");
    if (!form.dmMessage.trim()) return toast.error("Write the DM message");
    if (form.keywordMode === "specific_words" && !form.keywords.trim())
      return toast.error("Add at least one keyword");

    setSaving(true);
    const payload = {
      instagramAccountId: selectedAccount,
      name: form.name,
      channel: form.channel,
      trigger:
        form.channel === "dm"
          ? { type: "any_post" }
          : { type: form.triggerType, mediaId: form.triggerType === "specific_post" ? form.mediaId : undefined },
      keywordMatch: {
        mode: form.keywordMode,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      },
      publicReply:
        form.channel === "comment"
          ? { enabled: form.publicReplyEnabled, message: form.publicReplyMessage }
          : { enabled: false, message: "" },
      followGate: { enabled: form.followGateEnabled, promptMessage: form.followGateMessage },
      dmReply: { message: form.dmMessage, buttonText: form.buttonText, buttonUrl: form.buttonUrl },
    };

    try {
      if (isEditing) {
        await api.put(`/automations/${id}`, payload);
        toast.success("Automation updated");
      } else {
        await api.post("/automations", payload);
        toast.success("Automation created — go live from the Automations list");
      }
      navigate("/automations");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save automation");
    } finally {
      setSaving(false);
    }
  };

  const currentAccountUsername = accounts.find((a) => a._id === selectedAccount)?.username;

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-on-surface-variant mb-2">
          <Link to="/automations" className="hover:text-primary transition-colors text-sm">Automations</Link>
          <ChevronRight size={14} />
          <span className="text-sm font-medium text-on-surface">{isEditing ? "Edit automation" : "New automation"}</span>
        </div>
        <h1 className="text-h1 text-on-surface mb-1">{isEditing ? "Edit automation" : "New automation"}</h1>
        <p className="text-body-md text-on-surface-variant mb-8">Set up your comment-to-DM flow step by step.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6 max-w-3xl">
          {/* Basic info */}
          <div className="bg-surface-container p-padding-card rounded-xl border border-outline-variant">
            <label className="label-sm">Automation Name</label>
            <input
              className="input-field mb-5"
              placeholder="e.g. Website link automation"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <label className="label-sm">Instagram Account</label>
            <select className="input-field" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>@{acc.username}</option>
              ))}
            </select>
          </div>

          {/* Trigger source */}
          <StepCard icon={Zap} title="Trigger source">
            <div className="grid grid-cols-3 gap-3">
              <ChannelOption icon={MessageSquare} label="Comment" sub="On posts & Reels" active={form.channel === "comment"} onClick={() => update({ channel: "comment" })} />
              <ChannelOption icon={CircleDot} label="Story reply" sub="Someone replies to Story" active={form.channel === "story_reply"} onClick={() => update({ channel: "story_reply", triggerType: "any_post" })} />
              <ChannelOption icon={Send} label="Direct message" sub="Any DM to your account" active={form.channel === "dm"} onClick={() => update({ channel: "dm" })} />
            </div>
          </StepCard>

          {/* Trigger conditions */}
          {form.channel !== "dm" && (
            <StepCard icon={SlidersHorizontal} title={form.channel === "story_reply" ? "When someone replies to" : "When someone comments on"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RadioRow checked={form.triggerType === "any_post"} onClick={() => update({ triggerType: "any_post" })} label={form.channel === "story_reply" ? "Any Story" : "Any post or Reel"} />
                {form.channel === "comment" && (
                  <RadioRow checked={form.triggerType === "specific_post"} onClick={() => update({ triggerType: "specific_post" })} label="A specific post or Reel" />
                )}
              </div>
              {form.channel === "comment" && form.triggerType === "specific_post" && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {media.map((m) => (
                    <button key={m.id} onClick={() => update({ mediaId: m.id })} className={`aspect-square rounded-lg overflow-hidden border-2 ${form.mediaId === m.id ? "border-primary" : "border-transparent"}`}>
                      <img src={m.thumbnail_url || m.media_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </StepCard>
          )}

          {/* Keyword filtering */}
          <StepCard icon={Filter} title={`And this ${form.channel === "comment" ? "comment" : form.channel === "story_reply" ? "reply" : "message"} has`}>
            <div className="flex flex-wrap gap-4 mb-6">
              <RadioRow checked={form.keywordMode === "specific_words"} onClick={() => update({ keywordMode: "specific_words" })} label="A specific word or words" inline />
              <RadioRow checked={form.keywordMode === "any_word"} onClick={() => update({ keywordMode: "any_word" })} label="Any word" inline />
            </div>
            {form.keywordMode === "specific_words" && (
              <div>
                <label className="label-sm">Keywords</label>
                <input className="input-field" placeholder="e.g. website, price, info" value={form.keywords} onChange={(e) => update({ keywords: e.target.value })} />
                <p className="text-xs text-on-surface-variant mt-2 opacity-60">Separate multiple keywords with commas</p>
              </div>
            )}

            {form.channel === "comment" && (
              <div className="pt-6 mt-6 border-t border-outline-variant flex items-center justify-between">
                <div>
                  <span className="text-body-md font-semibold text-on-surface block">Reply to comment publicly</span>
                  <span className="text-sm text-on-surface-variant opacity-70">Add a public reply to boost engagement</span>
                </div>
                <FeatureToggle checked={form.publicReplyEnabled} locked={isFree} onClick={() => update({ publicReplyEnabled: !form.publicReplyEnabled })} />
              </div>
            )}
            {form.publicReplyEnabled && (
              <input className="input-field mt-3" placeholder="Thanks for your comment! Check your DMs 🙌" value={form.publicReplyMessage} onChange={(e) => update({ publicReplyMessage: e.target.value })} />
            )}
          </StepCard>

          {/* Response message */}
          <div className="bg-surface-container p-padding-card rounded-xl border border-primary shadow-lg shadow-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <MessageCircle size={18} />
              </div>
              <h2 className="text-h2 text-on-surface">They will get</h2>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant mb-6">
              <div>
                <span className="text-body-md font-semibold text-on-surface block">Follow to receive DM</span>
                <span className="text-xs text-on-surface-variant opacity-70">Requires the user to follow your account first</span>
              </div>
              <FeatureToggle checked={form.followGateEnabled} locked={isFree} onClick={() => update({ followGateEnabled: !form.followGateEnabled })} />
            </div>
            {form.followGateEnabled && (
              <input className="input-field mb-6" value={form.followGateMessage} onChange={(e) => update({ followGateMessage: e.target.value })} />
            )}

            <label className="label-sm">DM Message Content</label>
            <textarea
              className="input-field h-32 resize-none"
              placeholder="Hey! Thanks for the comment 🙌 Here's what you asked for..."
              value={form.dmMessage}
              onChange={(e) => update({ dmMessage: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label-sm text-xs">Button Text</label>
                <input className="input-field text-sm" placeholder="Visit our site" value={form.buttonText} onChange={(e) => update({ buttonText: e.target.value })} />
              </div>
              <div>
                <label className="label-sm text-xs">Button Link</label>
                <input className="input-field text-sm" placeholder="https://..." value={form.buttonUrl} onChange={(e) => update({ buttonUrl: e.target.value })} />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary/20 text-primary py-4 rounded-2xl font-bold text-h2 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Rocket size={20} />
            {saving ? "Saving..." : isEditing ? "Save changes" : "Create automation"}
          </button>
          <p className="text-center text-on-surface-variant text-sm opacity-50 -mt-2">You can edit this automation anytime later</p>
        </div>

        <div className="hidden lg:block">
          <PhonePreview
            username={currentAccountUsername}
            keyword={form.keywords.split(",")[0]}
            dmMessage={form.dmMessage}
            followGateEnabled={form.followGateEnabled}
            followGateMessage={form.followGateMessage}
            buttonText={form.buttonText}
            buttonUrl={form.buttonUrl}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function StepCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-surface-container p-padding-card rounded-xl border border-outline-variant">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          <Icon size={17} />
        </div>
        <h2 className="text-h2 text-on-surface">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ChannelOption({ icon: Icon, label, sub, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-4 rounded-xl text-left transition-all active:scale-95 border-2 ${
        active ? "bg-secondary-container border-primary text-on-secondary-container" : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-variant/30"
      }`}
    >
      <Icon size={22} className="mb-2" />
      <span className="font-bold block text-body-md">{label}</span>
      <span className="text-xs opacity-70">{sub}</span>
    </button>
  );
}

function RadioRow({ checked, onClick, label, inline }) {
  return (
    <label
      onClick={onClick}
      className={`relative flex items-center gap-3 cursor-pointer transition-all ${
        inline ? "" : `p-4 rounded-xl border ${checked ? "border-primary bg-surface-variant/20" : "border-outline-variant hover:bg-surface-variant/20"}`
      }`}
    >
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? "border-primary" : "border-outline-variant"}`}>
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </span>
      <span className={`font-medium ${checked ? "text-on-surface" : "text-on-surface-variant"}`}>{label}</span>
    </label>
  );
}

function FeatureToggle({ checked, locked, onClick }) {
  if (locked) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
        <Lock size={11} /> Upgrade
      </span>
    );
  }
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onClick} className="sr-only peer" />
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-surface-container-highest"}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
    </label>
  );
}
