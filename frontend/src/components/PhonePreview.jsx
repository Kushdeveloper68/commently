import { Instagram, Check } from "lucide-react";

/**
 * Renders a live mock Instagram DM thread reflecting the automation being built.
 * Re-renders instantly as the parent form state changes — this is the "wow" moment
 * that makes abstract config feel real, same trick ManyChat's builder uses.
 */
export default function PhonePreview({ username = "your_account", keyword, dmMessage, followGateEnabled, followGateMessage, buttonText, buttonUrl }) {
  const showKeyword = keyword?.trim() || "WEBSITE";

  return (
    <div className="sticky top-8">
      <div className="text-xs text-muted uppercase tracking-wide mb-3 text-center">Live Preview</div>
      <div className="w-[300px] mx-auto bg-black rounded-[36px] border-[6px] border-[#222] shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-white text-[11px]">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
        </div>

        {/* DM header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-gold-bright flex items-center justify-center">
            <Instagram size={14} className="text-black" />
          </div>
          <span className="text-white text-sm font-medium">{username}</span>
        </div>

        {/* Chat body */}
        <div className="bg-black min-h-[380px] px-4 py-4 flex flex-col gap-3">
          {/* Simulated incoming comment trigger */}
          <div className="self-end max-w-[75%]">
            <div className="bg-[#3797f0] text-white text-sm rounded-2xl rounded-br-sm px-3.5 py-2">
              Commented: <span className="font-semibold">"{showKeyword}"</span>
            </div>
          </div>

          {/* Follow-gate step, if enabled */}
          {followGateEnabled && (
            <div className="self-start max-w-[80%] space-y-1.5 animate-in fade-in">
              <div className="bg-[#262626] text-white text-sm rounded-2xl rounded-bl-sm px-3.5 py-2 whitespace-pre-wrap">
                {followGateMessage || "Follow us to get the link! Tap below once you have 👇"}
              </div>
              <button className="bg-[#262626] text-[#3797f0] text-sm font-medium rounded-2xl px-3.5 py-2 flex items-center gap-1.5 border border-white/10">
                <Check size={14} /> I followed
              </button>
            </div>
          )}

          {/* Main DM reply */}
          <div className="self-start max-w-[80%] space-y-1.5">
            <div className="bg-[#262626] text-white text-sm rounded-2xl rounded-bl-sm px-3.5 py-2 whitespace-pre-wrap">
              {dmMessage || "Hey! Thanks for the comment 🙌 Here's what you asked for:"}
            </div>
            {buttonText && (
              <button className="bg-[#262626] text-[#3797f0] text-sm font-medium rounded-2xl px-3.5 py-2 border border-white/10 block">
                {buttonText}
              </button>
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
          <div className="flex-1 bg-[#1a1a1a] rounded-full px-4 py-2 text-white/30 text-sm">
            Message...
          </div>
        </div>
      </div>
    </div>
  );
}
