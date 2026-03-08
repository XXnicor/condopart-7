import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  PawPrint, Bell, Search, MapPin, Eye, MessageCircle, ArrowLeft, Share2,
  Plus, Shield, Building2, User, KeyRound, LogOut, ChevronRight,
  CheckCircle2, Activity, Camera, Home, ShieldCheck, Clock,
  ChevronDown, Users, Calendar, BarChart2, Play, Sparkles,
  Heart, X, SlidersHorizontal,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer,
} from "recharts";

// ─── SPRING CONFIG ────────────────────────────────────────────────────────────
const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const springFast = { type: "spring" as const, stiffness: 400, damping: 28 };

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const ALERTS = [
  {
    id: "1", name: "Bolinha", type: "Cachorro", status: "lost",
    location: "Bloco B, portão principal", time: "2h",
    sightings: 3, comments: 2,
    desc: "Labrador amarelo, coleira azul, responde pelo nome. Visto pela última vez próximo ao portão do Bloco B às 14h.",
    reporter: "Maria Silva", reporterInitial: "M",
  },
  {
    id: "2", name: "Mimi", type: "Gato", status: "lost",
    location: "Área de lazer", time: "5h",
    sightings: 1, comments: 4,
    desc: "Gatinha cinza, olhos verdes, usa coleira rosa. Sumiu da área de lazer perto da piscina.",
    reporter: "João Costa", reporterInitial: "J",
  },
  {
    id: "3", name: "Thor", type: "Cachorro", status: "found",
    location: "Portaria", time: "1d",
    sightings: 5, comments: 7,
    desc: "Golden retriever de grande porte, muito dócil. Foi encontrado pelo porteiro às 8h da manhã.",
    reporter: "Ana Lima", reporterInitial: "A",
  },
];

const CHART_DATA = [
  { mes: "Jan", perdidos: 4, encontrados: 3 },
  { mes: "Fev", perdidos: 2, encontrados: 2 },
  { mes: "Mar", perdidos: 6, encontrados: 5 },
  { mes: "Abr", perdidos: 3, encontrados: 3 },
  { mes: "Mai", perdidos: 5, encontrados: 4 },
  { mes: "Jun", perdidos: 3, encontrados: 2 },
];

const COMMENTS = [
  { id: "1", name: "Maria", initial: "M", text: "Vi ele perto do bloco B!", time: "1h" },
  { id: "2", name: "João", initial: "J", text: "Estou procurando também, vou dar uma volta no condomínio agora.", time: "2h" },
];

const SIGHTINGS = [
  { id: "1", notes: "Visto correndo perto da churrasqueira", time: "1h" },
  { id: "2", notes: "Estava no jardim ao lado do Bloco C", time: "3h" },
  { id: "3", notes: "Passando pelo corredor do térreo", time: "5h" },
];

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  if (status === "found") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Encontrado
      </span>
    );
  }
  return (
    <motion.span
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Perdido
    </motion.span>
  );
};

// ─── SCREEN 1: ALERT DETAIL ────────────────────────────────────────────────────
const ScreenAlertDetail = () => {
  const alert = ALERTS[0];
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const heroY = useTransform(scrollY, [0, 200], [0, 60]);
  const heroScale = useTransform(scrollY, [0, 200], [1, 1.08]);

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Hero */}
      <div className="relative h-[300px] overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <div className="h-full w-full bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400 flex items-center justify-center">
            <PawPrint className="h-32 w-32 text-white/20" />
          </div>
        </motion.div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />

        {/* Top buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <motion.button whileTap={{ scale: 0.9 }} transition={springFast}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white">
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} transition={springFast}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white">
            <Share2 className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Pet name */}
        <div className="absolute bottom-4 left-4 right-16">
          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...spring }}
            className="text-2xl font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]"
          >
            {alert.name}
          </motion.h1>
          <p className="text-sm text-white/80 mt-0.5 font-medium">{alert.type}</p>
        </div>

        {/* Status badge */}
        <div className="absolute bottom-4 right-4">
          <StatusBadge status={alert.status} />
        </div>
      </div>

      {/* Content sheet */}
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, ...spring }}
        className="-mt-8 relative bg-white rounded-t-3xl shadow-2xl pb-28"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-12 rounded-full bg-gray-200" />
        </div>

        <div className="px-4 pt-3 space-y-5">
          {/* Reporter */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm shrink-0">
              {alert.reporterInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{alert.reporter}</p>
              <p className="text-xs text-gray-400">há {alert.time}</p>
            </div>
          </div>
          <div className="h-px bg-gray-100" />

          {/* Description */}
          <div>
            <motion.p
              animate={{ height: expanded ? "auto" : undefined }}
              className={`text-sm text-gray-700 leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}
            >
              {alert.desc}
            </motion.p>
            <motion.button
              whileTap={{ scale: 0.97 }} transition={springFast}
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 text-sm font-semibold text-amber-500 flex items-center gap-0.5"
            >
              {expanded ? "Ver menos" : "Ver mais"} 
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={spring}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </motion.button>
          </div>

          {/* Location pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
            <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-sm text-gray-700 font-medium">{alert.location}</span>
          </div>

          {/* Map */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Ultima localização</p>
            <div className="h-[180px] rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-10">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute border border-amber-400"
                    style={{ left: `${(i % 4) * 25}%`, top: `${Math.floor(i / 4) * 50}%`, width: "25%", height: "50%" }} />
                ))}
              </div>
              <div className="flex flex-col items-center gap-2 text-amber-500">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <MapPin className="h-8 w-8" />
                </motion.div>
                <span className="text-xs font-medium text-amber-700">Bloco B — Portão Principal</span>
              </div>
            </div>
          </div>

          {/* Sightings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Avistamentos</span>
                <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
                  {SIGHTINGS.length}
                </span>
              </div>
              <button className="text-xs font-semibold text-amber-500">Ver todos</button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {SIGHTINGS.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, ...spring }}
                  className="flex-shrink-0 w-[130px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                >
                  <div className="h-[70px] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-gray-700 line-clamp-2 leading-tight">{s.notes}</p>
                    <p className="text-[10px] text-gray-400 mt-1">há {s.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Comentários ({COMMENTS.length})
            </p>
            <div className="space-y-3">
              {COMMENTS.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, ...spring }}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                    {c.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                      <span className="text-[10px] text-gray-400">há {c.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fixed bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3 pb-5">
        <motion.button
          whileTap={{ scale: 0.95 }} transition={springFast}
          className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-200"
        >
          Marcar como Encontrado
        </motion.button>
      </div>
    </div>
  );
};

// ─── SCREEN 2: ALERT FEED ──────────────────────────────────────────────────────
const ScreenFeed = ({ onOpenDetail }: { onOpenDetail: () => void }) => {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const filters = ["Todos", "Cachorros", "Gatos", "Proximos"];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-gray-900 font-display">PetAlert</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} transition={springFast} className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="px-4 pt-3 pb-2">
          {/* Search */}
          <motion.div
            animate={{
              backgroundColor: searchFocused ? "#ffffff" : "#f3f4f6",
              boxShadow: searchFocused ? "0 0 0 2px #fcd34d" : "none",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 rounded-full px-3 py-2.5"
          >
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar pets perdidos..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0 text-base"
            />
          </motion.div>

          {/* Filter chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
            {filters.map(f => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.95 }} transition={springFast}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === f
                    ? "bg-amber-500 text-white"
                    : "border border-gray-200 bg-white text-gray-600"
                }`}
              >
                {f}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3 px-4 pb-24">
          {ALERTS.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ...spring }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDetail}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm cursor-pointer"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-24 shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <PawPrint className="h-10 w-10 text-amber-300" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{alert.name}</p>
                    <StatusBadge status={alert.status} />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{alert.desc}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1 min-w-0 max-w-[130px]">
                      <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="text-[11px] text-gray-400 truncate">{alert.location}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">há {alert.time}</span>
                  </div>
                </div>
              </div>
              {/* Bottom strip */}
              <div className="flex gap-4 bg-amber-50 px-3 py-2 border-t border-amber-100/60">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                  {alert.sightings} avistamentos
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
                  {alert.comments} comentários
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.4, ...spring }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="absolute bottom-[88px] right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 shadow-xl shadow-amber-200"
      >
        <Plus className="h-7 w-7 text-white" />
      </motion.button>
    </div>
  );
};

// ─── SCREEN 3: USER PROFILE ────────────────────────────────────────────────────
const ScreenProfile = () => {
  const [name, setName] = useState("Carlos Oliveira");
  const [phone, setPhone] = useState("(11) 99999-0000");
  const [showLogout, setShowLogout] = useState(false);

  const PETS = [
    { name: "Rex", initial: "R" },
    { name: "Mia", initial: "M" },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-b-[32px] px-4 pt-8 pb-10">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, ...spring }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-200 text-amber-700 text-3xl font-bold ring-4 ring-white ring-offset-2 shadow-xl"
          >
            C
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...spring }}
            className="flex flex-col items-center gap-2"
          >
            <h1 className="text-xl font-bold text-white">Carlos Oliveira</h1>
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              <span className="text-sm font-medium text-white">Sindico</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70">Residencial Golden Park I</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-32">
        {/* Pets card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ...spring }}
          className="-mt-6 bg-white rounded-2xl shadow-md px-4 py-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <PawPrint className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-gray-900 text-sm">Meus Pets</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {PETS.map((pet, i) => (
              <motion.div
                key={pet.name}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.08, ...spring }}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold ring-2 ring-amber-200/60">
                  {pet.initial}
                </div>
                <span className="text-xs text-gray-600 truncate w-14 text-center">{pet.name}</span>
              </motion.div>
            ))}
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + PETS.length * 0.08, ...spring }}
              whileTap={{ scale: 0.95 }} transition2={springFast}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-amber-300 hover:border-amber-400 transition-colors">
                <Plus className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs text-amber-400 font-medium">Adicionar</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Activity card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, ...spring }}
          className="bg-white rounded-2xl shadow-md px-4 py-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-gray-900 text-sm">Minha Atividade</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ALERTS.slice(0, 3).map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.08, ...spring }}
                className="flex items-center gap-3 py-2.5"
              >
                <PawPrint className="h-5 w-5 text-amber-400 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">{alert.name}</span>
                <StatusBadge status={alert.status} />
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Account card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, ...spring }}
          className="bg-white rounded-2xl shadow-md px-4 py-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-gray-900 text-sm">Conta</span>
          </div>
          <div className="space-y-4">
            {[
              { label: "Nome", value: name, onChange: setName, type: "text" },
              { label: "Telefone", value: phone, onChange: setPhone, type: "tel" },
            ].map(({ label, value, onChange, type }) => (
              <div key={label}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-full border-b border-gray-200 pb-2 text-base text-gray-900 outline-none focus:border-amber-400 transition-colors bg-transparent"
                />
              </div>
            ))}
            <motion.button
              whileTap={{ scale: 0.97 }} transition={springFast}
              className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white mt-2"
            >
              Salvar alteracoes
            </motion.button>
          </div>
        </motion.div>

        {/* Actions card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, ...spring }}
          className="bg-white rounded-2xl shadow-md overflow-hidden"
        >
          {[
            { icon: KeyRound, label: "Redefinir senha", color: "text-gray-700", bg: "" },
          ].map(({ icon: Icon, label, color }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.98, backgroundColor: "#f9fafb" }} transition={springFast}
              className="flex w-full min-h-[52px] items-center gap-3 px-4 text-left"
            >
              <Icon className={`h-5 w-5 shrink-0 text-gray-500`} />
              <span className={`flex-1 text-sm font-medium ${color}`}>{label}</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </motion.button>
          ))}
          <div className="h-px bg-gray-100 mx-4" />
          <motion.button
            whileTap={{ scale: 0.98 }} transition={springFast}
            onClick={() => setShowLogout(!showLogout)}
            className="flex w-full min-h-[52px] items-center gap-3 px-4 text-left"
          >
            <LogOut className="h-5 w-5 text-red-500 shrink-0" />
            <span className="flex-1 text-sm font-medium text-red-500">Sair da conta</span>
            <ChevronRight className="h-4 w-4 text-red-300" />
          </motion.button>
          <AnimatePresence>
            {showLogout && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 space-y-2">
                  <p className="text-sm text-gray-600 text-center">Tem certeza que deseja sair?</p>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} transition={springFast}
                      onClick={() => setShowLogout(false)}
                      className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600">
                      Cancelar
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} transition={springFast}
                      className="flex-1 rounded-2xl bg-red-500 py-2.5 text-sm font-semibold text-white">
                      Sair
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// ─── SCREEN 4: SYNDIC DASHBOARD ────────────────────────────────────────────────
const ScreenSyndic = () => {
  const STATS = [
    { icon: Bell, label: "alertas ativos", value: "3", color: "bg-amber-100", iconColor: "text-amber-600", border: "border-l-amber-500" },
    { icon: CheckCircle2, label: "encontrados", value: "12", color: "bg-green-100", iconColor: "text-green-600", border: "border-l-green-500" },
    { icon: Users, label: "moradores", value: "47", color: "bg-blue-100", iconColor: "text-blue-600", border: "border-l-blue-500" },
    { icon: Calendar, label: "este mes", value: "5", color: "bg-purple-100", iconColor: "text-purple-600", border: "border-l-purple-500" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl bg-white shadow-md p-2 text-xs">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-b-[32px] px-4 pt-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...spring }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-white" />
            <h1 className="text-xl font-bold text-white font-display">Painel do Sindico</h1>
          </div>
          <p className="text-sm text-white/80 mt-1">Residencial Golden Park I</p>
        </motion.div>
      </div>

      <div className="space-y-3 px-4 pb-28">
        {/* Stats grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, ...spring }}
          className="-mt-6 grid grid-cols-2 gap-3"
        >
          {STATS.map(({ icon: Icon, label, value, color, iconColor, border }, i) => (
            <motion.div
              key={label}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06, ...spring }}
              className={`bg-white rounded-2xl shadow-md p-4 border-l-4 ${border}`}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Avg resolution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, ...spring }}
          className="rounded-xl bg-gray-50 px-4 py-3 flex items-center gap-2"
        >
          <Clock className="h-4 w-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-600">Tempo medio de resolucao: <span className="font-semibold text-gray-900">4.2h</span></p>
        </motion.div>

        {/* Chart card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, ...spring }}
          className="bg-white rounded-2xl shadow-md p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900 text-sm">Ultimos 6 meses</span>
            <motion.button whileTap={{ scale: 0.95 }} transition={springFast}
              className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600">
              Exportar
            </motion.button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CHART_DATA} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <RechartTooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="perdidos" name="Perdidos" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              <Bar dataKey="encontrados" name="Encontrados" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Perdidos
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />Encontrados
            </div>
          </div>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, ...spring }}
          className="bg-white rounded-2xl shadow-md p-4"
        >
          <p className="font-semibold text-gray-900 text-sm mb-3">Historico de alertas</p>
          <div className="divide-y divide-gray-50">
            {ALERTS.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.07, ...spring }}
                className="flex items-center gap-3 py-2.5"
              >
                <PawPrint className="h-5 w-5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{alert.name}</p>
                  <p className="text-[11px] text-gray-400">{alert.reporter}</p>
                </div>
                <StatusBadge status={alert.status} />
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─── SCREEN 5: LANDING PAGE ────────────────────────────────────────────────────
const ScreenLanding = ({ onEnter }: { onEnter: () => void }) => {
  const HOW = [
    { step: "1", title: "Crie um alerta", desc: "Foto, nome e local do seu pet em segundos." },
    { step: "2", title: "Moradores são notificados", desc: "Todos do condominio recebem o alerta instantaneamente." },
    { step: "3", title: "Pet encontrado!", desc: "Avistamentos em tempo real ate o reencontro." },
  ];
  const BENEFITS = [
    "Gratuito para moradores",
    "Exclusivo para o Golden Park I",
    "Alertas em tempo real",
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Hero */}
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-6 text-center relative">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0, ...spring }}
        >
          <PawPrint className="h-14 w-14 text-amber-500 drop-shadow-lg mx-auto" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...spring }}
          className="text-3xl font-bold text-gray-900 mt-4 leading-tight"
        >
          Seu pet perdido,{"\n"}o condominio unido
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...spring }}
          className="text-base text-gray-500 mt-3 max-w-xs leading-relaxed"
        >
          O PetAlert conecta moradores do Residencial Golden Park I para encontrar pets perdidos mais rapido.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...spring }}
          className="w-full max-w-xs space-y-3 mt-8"
        >
          <motion.button
            whileTap={{ scale: 0.97 }} transition={springFast}
            onClick={onEnter}
            className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-xl shadow-amber-200 min-h-[52px]"
          >
            Criar minha conta gratis
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }} transition={springFast}
            onClick={onEnter}
            className="w-full rounded-2xl border border-gray-300 bg-white py-3.5 text-sm font-semibold text-gray-600 min-h-[52px]"
          >
            Ja tenho conta — entrar
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-8"
        >
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="h-5 w-5 text-amber-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* How it works */}
      <div className="px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-5">Como funciona</h2>
        <div className="space-y-4">
          {HOW.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, ...spring }}
              className="relative bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold z-10">
                {item.step}
              </div>
              <div className="h-[140px] bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <PawPrint className="h-8 w-8 text-amber-300" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
                      <Play className="h-4 w-4 text-amber-500 ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="px-4 pb-6">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 space-y-3">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, ...spring }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm text-gray-700">{b}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-8">
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 p-6">
          <p className="text-xl font-bold text-white leading-snug">
            Pronto para proteger os pets?
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }} transition={springFast}
            onClick={onEnter}
            className="mt-4 w-full rounded-2xl bg-white py-3 text-sm font-bold text-amber-600"
          >
            Comecar agora
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center pb-10">
        PetAlert Condo © 2026 · Residencial Golden Park I
      </p>
    </div>
  );
};

// ─── PREVIEW NAVIGATOR ────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "landing", icon: Sparkles, label: "Inicio" },
  { id: "feed", icon: Home, label: "Feed" },
  { id: "detail", icon: Bell, label: "Alerta" },
  { id: "profile", icon: User, label: "Perfil" },
  { id: "syndic", icon: Shield, label: "Sindico" },
] as const;
type TabId = (typeof NAV_TABS)[number]["id"];

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function DesignPreview() {
  const [activeTab, setActiveTab] = useState<TabId>("landing");
  const [prevTab, setPrevTab] = useState<TabId>("landing");

  const handleTab = (id: TabId) => {
    setPrevTab(activeTab);
    setActiveTab(id);
  };

  const screenMap: Record<TabId, React.ReactNode> = {
    landing: <ScreenLanding onEnter={() => handleTab("feed")} />,
    feed: <ScreenFeed onOpenDetail={() => handleTab("detail")} />,
    detail: <ScreenAlertDetail />,
    profile: <ScreenProfile />,
    syndic: <ScreenSyndic />,
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-start justify-center py-0 sm:py-8">
      {/* Phone frame */}
      <div
        className="relative w-full max-w-[480px] bg-white overflow-hidden shadow-2xl"
        style={{ height: "100svh", maxHeight: "900px", borderRadius: "0 0 0 0" }}
      >
        {/* Safe area top */}
        <div className="absolute top-0 left-0 right-0 h-[env(safe-area-inset-top,0px)] bg-white z-50" />

        {/* Screen area */}
        <div className="absolute inset-0 bottom-[64px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ...spring }}
              className="h-full"
            >
              {screenMap[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom navigator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[64px] bg-white border-t border-gray-100 flex items-center"
          style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}
        >
          {NAV_TABS.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.88 }}
                transition={springFast}
                onClick={() => handleTab(id)}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={spring}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${isActive ? "text-amber-500" : "text-gray-400"}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>
                <motion.span
                  animate={{ color: isActive ? "#f59e0b" : "#9ca3af" }}
                  transition={{ duration: 0.15 }}
                  className="text-[10px] font-semibold"
                >
                  {label}
                </motion.span>
                {isActive && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
