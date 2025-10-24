import { useMemo, useState, type ReactNode } from "react";
import { Gift, Store, Trophy, Wallet, Trash2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useFocusStore } from "@/state/useFocusStore";
import type { CoinLedgerEntry } from "@/state/types";
import { getTodayKey } from "@/utils/date";

const CoinsView = () => {
  const coinBank = useFocusStore(state => state.coinBank);
  const ledger = useFocusStore(state => state.coinLedger);
  const spendCoins = useFocusStore(state => state.spendCoins);
  const rewards = useFocusStore(state => state.rewards);
  const addReward = useFocusStore(state => state.addReward);
  const deleteReward = useFocusStore(state => state.deleteReward);

  const [newReward, setNewReward] = useState({ title: "", cost: 100, description: "" });
  const [message, setMessage] = useState<string | null>(null);

  const todayKey = getTodayKey();

  const stats = useMemo(() => {
    const today = new Date();
    const earned = ledger.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
    const spent = ledger.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0);
    const todayEntries = ledger.filter(entry => entry.date && isSameDay(new Date(entry.date), today));
    const todayEarn = todayEntries.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
    const todaySpend = todayEntries.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0);
    return {
      earned,
      spent: Math.abs(spent),
      todayEarn,
      todaySpend: Math.abs(todaySpend)
    };
  }, [ledger, todayKey]);

  const redeemReward = async (title: string, cost: number) => {
    const success = await spendCoins(cost, title);
    if (!success) {
      setMessage("Coin yetarli emas. Bir necha vazifani bajaring!");
      return;
    }
    setMessage(`${title} uchun ${cost} coin sarflandi. Enjoy!`);
  };

  const handleAddReward = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newReward.title.trim()) return;
    await addReward({
      title: newReward.title,
      cost: newReward.cost,
      description: newReward.description
    });
    setNewReward({ title: "", cost: 100, description: "" });
    setMessage("Yangi mukofot do'konga qo'shildi!");
  };

  const latestLedger = ledger.slice(0, 12);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Hozirgi balans" value={`${coinBank} coin`} icon={<Wallet className="h-5 w-5" />} accent="bg-primary-500/20" />
        <StatsCard title="Umumiy topilgan" value={`+${stats.earned}`} icon={<Trophy className="h-5 w-5" />} accent="bg-emerald-500/20" />
        <StatsCard title="Umumiy sarf" value={`-${stats.spent}`} icon={<Gift className="h-5 w-5" />} accent="bg-danger/20" />
        <StatsCard
          title="Bugungi balans"
          value={`+${stats.todayEarn} / -${stats.todaySpend}`}
          icon={<Store className="h-5 w-5" />}
          accent="bg-amber-500/20"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Mukofotlar do'koni</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
              {rewards.length} ta variant
            </span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70"
              >
                <div className="flex items-center justify-between text-white">
                  <div className="text-base font-semibold">{reward.title}</div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{reward.cost} coin</div>
                </div>
                <p className="text-xs text-white/50">{reward.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      void redeemReward(reward.title, reward.cost);
                    }}
                    className="flex-1 rounded-2xl bg-primary-500/70 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={coinBank < reward.cost}
                  >
                    Redeem
                  </button>
                  <button
                    onClick={() => {
                      void deleteReward(reward.id);
                    }}
                    className="rounded-2xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger transition hover:bg-danger/20"
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Do'konga mukofot qo'shish</h3>
            <p className="mt-1 text-xs text-white/50">Mukofotni nomlang va coin narxini belgilang. U zudlik bilan ro'yxatga qo'shiladi.</p>
            <form onSubmit={handleAddReward} className="mt-4 space-y-3 text-sm text-white/60">
              <label className="flex flex-col gap-2">
                Nom
                <input
                  value={newReward.title}
                  onChange={event => setNewReward(prev => ({ ...prev, title: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                  placeholder="Masalan, Premium brunch"
                />
              </label>
              <label className="flex flex-col gap-2">
                Coin narxi
                <input
                  type="number"
                  min={10}
                  value={newReward.cost}
                  onChange={event => setNewReward(prev => ({ ...prev, cost: Number(event.target.value) }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                Ta'rif (ixtiyoriy)
                <textarea
                  rows={3}
                  value={newReward.description}
                  onChange={event => setNewReward(prev => ({ ...prev, description: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                  placeholder="Qisqa motivatsion matn"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-primary-500/80 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-500"
              >
                Do'konga qo'shish
              </button>
            </form>
            {message && <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/60">{message}</div>}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Oxirgi 12 harakat</h3>
            <div className="mt-4 space-y-3 text-sm text-white/60">
              {latestLedger.length === 0 && <div className="text-xs text-white/40">Hali tranzaksiyalar yo'q.</div>}
              {latestLedger.map(entry => (
                <LedgerItem key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatsCard = ({
  title,
  value,
  icon,
  accent
}: {
  title: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60 backdrop-blur-xl">
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">{title}</div>
        <div className="text-xl font-semibold text-white">{value}</div>
      </div>
    </div>
  </div>
);

const LedgerItem = ({ entry }: { entry: CoinLedgerEntry }) => {
  const amount = entry.amount;
  const positive = amount >= 0;
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
      <div>
        <div className="text-sm text-white/80">{entry.label}</div>
        <div className="text-xs text-white/40">
          {format(new Date(entry.date), "dd MMM HH:mm")} · {entry.type}
        </div>
      </div>
      <div className={`text-sm font-semibold ${positive ? "text-emerald-300" : "text-danger"}`}>
        {positive ? `+${amount}` : amount}
      </div>
    </div>
  );
};

export default CoinsView;
