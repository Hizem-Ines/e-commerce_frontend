
import { useState } from "react";
import { unsubscribeNewsletter } from "../../services/emailcampaignService";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(null);

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    try {
      const res = await unsubscribeNewsletter(email);
      setStatus("success");
      setMsg(res.data.message);
    } catch (err) {
      setStatus("error");
      setMsg(err.response?.data?.message || "Erreur.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6ec]">
  <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-8 flex flex-col gap-4">
    <h2 className="text-xl font-bold text-[#2c2c2c]">Se désabonner</h2>
    <p className="text-sm text-black/50">
      Entrez votre email pour ne plus recevoir nos offres.
    </p>
    <form onSubmit={handleUnsubscribe} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Votre email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2d5a27] focus:outline-none text-sm transition"
      />
      <button
        type="submit"
        className="bg-[#7a1c1c] hover:bg-[#5e1515] text-white px-4 py-3 rounded-xl text-sm font-bold transition"
      >
        Se désabonner
      </button>
    </form>
    {msg && (
      <p className={`text-sm font-semibold ${status === "success" ? "text-[#2d5a27]" : "text-red-500"}`}>
        {msg}
      </p>
    )}
  </div>
</div>
  );
}