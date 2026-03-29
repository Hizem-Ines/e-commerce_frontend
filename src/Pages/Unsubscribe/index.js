
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-800">Se désabonner</h2>
        <p className="text-sm text-gray-500">
          Entrez votre email pour ne plus recevoir nos offres.
        </p>
        <form onSubmit={handleUnsubscribe} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Se désabonner
          </button>
        </form>
        {msg && (
          <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-500"}`}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}