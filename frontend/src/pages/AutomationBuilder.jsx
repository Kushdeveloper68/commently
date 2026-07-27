import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Instagram, Lock } from "lucide-react";
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
      trigger: { type: form.triggerType, mediaId: form.triggerType === "specific_post" ? form.mediaId : undefined },
      keywordMatch: {
        mode: form.keywordMode,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      },
      publicReply: { enabled: form.publicReplyEnabled, message: form.publicReplyMessage },
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
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          {isEditing ? "Edit automation" : "New automation"}
        </h1>
        <p className="text-muted mt-1">Set up your comment-to-DM flow step by step.</p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          {/* Name + account */}
          <div className="card">
            <label className="label-sm">Automation name</label>
            <input
              className="input-field mb-4"
              placeholder="e.g. Website link automation"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <label className="label-sm">Instagram account</label>
            <select
              className="input-field"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  @{acc.username}
                </option>
              ))}
            </select>
          </div>

          {/* When someone comments on */}
          <div className="card">
            <h3 className="font-semibold mb-4">When someone comments on</h3>
            <div className="space-y-2">
              <RadioRow
                checked={form.triggerType === "any_post"}
                onClick={() => update({ triggerType: "any_post" })}
                label="Any post or Reel"
              />
              <RadioRow
                checked={form.triggerType === "specific_post"}
                onClick={() => update({ triggerType: "specific_post" })}
                label="A specific post or Reel"
              />
            </div>
            {form.triggerType === "specific_post" && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {media.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => update({ mediaId: m.id })}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      form.mediaId === m.id ? "border-gold" : "border-transparent"
                    }`}
                  >
                    <img src={m.thumbnail_url || m.media_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* And this comment has */}
          <div className="card">
            <h3 className="font-semibold mb-4">And this comment has</h3>
            <div className="space-y-2 mb-4">
              <RadioRow
                checked={form.keywordMode === "specific_words"}
                onClick={() => update({ keywordMode: "specific_words" })}
                label="A specific word or words"
              />
              <RadioRow
                checked={form.keywordMode === "any_word"}
                onClick={() => update({ keywordMode: "any_word" })}
                label="Any word"
              />
            </div>
            {form.keywordMode === "specific_words" && (
              <div>
                <input
                  className="input-field"
                  placeholder="e.g. website, price, info"
                  value={form.keywords}
                  onChange={(e) => update({ keywords: e.target.value })}
                />
                <p className="text-xs text-muted mt-1.5">Separate multiple keywords with commas</p>
              </div>
            )}

            <label className="flex items-center justify-between mt-5 pt-4 border-t border-border">
              <span className="text-sm">Reply to their comment publicly too</span>
              <FeatureToggle
                checked={form.publicReplyEnabled}
                locked={isFree}
                onClick={() => update({ publicReplyEnabled: !form.publicReplyEnabled })}
              />
            </label>
            {form.publicReplyEnabled && (
              <input
                className="input-field mt-3"
                placeholder="Thanks for your comment! Check your DMs 🙌"
                value={form.publicReplyMessage}
                onChange={(e) => update({ publicReplyMessage: e.target.value })}
              />
            )}
          </div>

          {/* They will get */}
          <div className="card">
            <h3 className="font-semibold mb-4">They will get</h3>

            <label className="flex items-center justify-between mb-3">
              <span className="text-sm">Ask them to follow you first</span>
              <FeatureToggle
                checked={form.followGateEnabled}
                locked={isFree}
                onClick={() => update({ followGateEnabled: !form.followGateEnabled })}
              />
            </label>
            {form.followGateEnabled && (
              <input
                className="input-field mb-4"
                value={form.followGateMessage}
                onChange={(e) => update({ followGateMessage: e.target.value })}
              />
            )}

            <label className="label-sm">DM message</label>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="Hey! Thanks for the comment 🙌 Here's what you asked for..."
              value={form.dmMessage}
              onChange={(e) => update({ dmMessage: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="label-sm">Button text (optional)</label>
                <input
                  className="input-field"
                  placeholder="Visit our site"
                  value={form.buttonText}
                  onChange={(e) => update({ buttonText: e.target.value })}
                />
              </div>
              <div>
                <label className="label-sm">Button link (optional)</label>
                <input
                  className="input-field"
                  placeholder="https://..."
                  value={form.buttonUrl}
                  onChange={(e) => update({ buttonUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
            {saving ? "Saving..." : isEditing ? "Save changes" : "Create automation"}
          </button>
        </div>

        {/* Live phone preview */}
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
    </AppLayout>
  );
}

function RadioRow({ checked, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-panel2 transition-colors"
    >
      <span
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          checked ? "border-gold" : "border-border"
        }`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-gold" />}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function FeatureToggle({ checked, locked, onClick }) {
  if (locked) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gold-bright bg-gold/10 px-2.5 py-1 rounded-full">
        <Lock size={11} /> Upgrade
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-gold" : "bg-panel2"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
