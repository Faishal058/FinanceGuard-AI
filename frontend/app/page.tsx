'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Shield, Brain, TrendingUp, FileText, Users,
  ChevronRight, ChevronDown, ArrowRight,
  Lock, Eye, Globe, Activity, Check, Star,
  Menu, X, AlertTriangle, Layers,
  Sparkles, Network, Database, Share2,
  PlayCircle, ShieldCheck, LayoutDashboard,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ─── CONSTANTS ────────────────────────────────────────────────

const AGENTS = [
  {
    name: "Document Ingestion",
    icon: FileText,
    description: "Parses PDFs, spreadsheets, and financial reports with advanced OCR and NLP, extracting structured data at scale.",
    status: "active",
    color: "#6366f1",
  },
  {
    name: "Profile Builder",
    icon: Users,
    description: "Constructs deep financial entity profiles by aggregating and reconciling data across multiple sources and time horizons.",
    status: "processing",
    color: "#8b5cf6",
  },
  {
    name: "Risk Analysis",
    icon: AlertTriangle,
    description: "Quantifies exposure, detects anomalies, and flags compliance risks with explainable AI scoring and confidence intervals.",
    status: "active",
    color: "#f59e0b",
  },
  {
    name: "Forecast Engine",
    icon: TrendingUp,
    description: "Projects cash flows, market scenarios, and portfolio outcomes using ensemble ML models with probabilistic outputs.",
    status: "active",
    color: "#06b6d4",
  },
  {
    name: "Financial Advisor",
    icon: Brain,
    description: "Synthesizes all agent insights to deliver strategic recommendations in plain language with full source attribution.",
    status: "ready",
    color: "#10b981",
  },
];

const WORKFLOW_STEPS = [
  { label: "Upload Documents", icon: FileText, desc: "PDF, Excel, CSV" },
  { label: "Mastra Orchestration", icon: Share2, desc: "Multi-agent routing" },
  { label: "Qdrant Memory", icon: Database, desc: "Vector retrieval" },
  { label: "Enkrypt Validation", icon: ShieldCheck, desc: "AI safety checks" },
  { label: "AI Analysis", icon: Brain, desc: "Deep reasoning" },
  { label: "Financial Insights", icon: Sparkles, desc: "Actionable output" },
];

const FEATURES = [
  { name: "AI Financial Analysis", icon: Brain, desc: "Multi-model reasoning across your entire financial corpus with cited sources and transparent methodology." },
  { name: "Persistent Memory", icon: Database, desc: "Qdrant vector store retains context across sessions, building a growing intelligence layer over time." },
  { name: "Multi-Agent Reasoning", icon: Network, desc: "Mastra orchestrates specialized agents working in parallel — faster, deeper, more reliable than any single model." },
  { name: "Risk Detection", icon: AlertTriangle, desc: "Real-time anomaly detection, exposure quantification, and compliance risk flagging across entire portfolios." },
  { name: "AI Forecasting", icon: TrendingUp, desc: "Ensemble ML models generate probabilistic forecasts with confidence intervals across multiple time horizons." },
  { name: "Security & Compliance", icon: Shield, desc: "Enkrypt AI guardrails ensure every response is safe, compliant, unbiased, and fully auditable." },
  { name: "Real-time Insights", icon: Activity, desc: "Streaming responses with live data feeds for time-sensitive decisions and intraday analysis." },
  { name: "Enterprise Architecture", icon: Layers, desc: "Kubernetes-native, horizontally scalable, with full observability via OpenTelemetry and Langfuse." },
];

const TECH_STACK = [
  { name: "Mastra", desc: "Agent orchestration", abbr: "MA", color: "#6366f1" },
  { name: "Qdrant", desc: "Vector memory", abbr: "QD", color: "#06b6d4" },
  { name: "Enkrypt AI", desc: "AI guardrails", abbr: "EK", color: "#8b5cf6" },
  { name: "OpenAI", desc: "Foundation models", abbr: "OA", color: "#10a37f" },
  { name: "Redis", desc: "In-memory cache", abbr: "RD", color: "#dc2626" },
  { name: "LibSQL", desc: "Embedded database", abbr: "LS", color: "#f59e0b" },
  { name: "OpenTelemetry", desc: "Observability", abbr: "OT", color: "#3b82f6" },
  { name: "Langfuse", desc: "LLM monitoring", abbr: "LF", color: "#ec4899" },
  { name: "Docker", desc: "Containerization", abbr: "DK", color: "#0ea5e9" },
  { name: "Kubernetes", desc: "Orchestration", abbr: "K8", color: "#326ce5" },
];

const SECURITY_FEATURES = [
  { name: "End-to-End Encryption", icon: Lock, desc: "AES-256 encryption at rest and TLS 1.3 in transit. Your data is unreadable to anyone but you." },
  { name: "AI Guardrails", icon: Shield, desc: "Enkrypt AI validates every model response for harmful content, bias, and factual accuracy before delivery." },
  { name: "GDPR Compliance", icon: Globe, desc: "Full GDPR, SOC 2 Type II, and ISO 27001 compliance with automated data residency controls per tenant." },
  { name: "Zero Trust", icon: Eye, desc: "Every request is individually authenticated and authorized. No implicit trust, even within the network perimeter." },
  { name: "Audit Logs", icon: Activity, desc: "Immutable, tamper-proof logs of every AI query, data access, and system event — queryable and exportable." },
  { name: "Privacy First", icon: ShieldCheck, desc: "Your financial data is never used to train any models. Strict data isolation is enforced per tenant." },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    title: "CFO, Meridian Capital",
    text: "FinanceGuard AI transformed our quarterly risk assessment. What took 3 days now completes in under 4 hours — with greater accuracy than our entire analyst team combined.",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Webb",
    title: "Head of Risk, Goldman Partners",
    text: "The multi-agent reasoning is exceptional. It identified a portfolio correlation risk our analysts had overlooked for two consecutive quarters. The ROI was immediate.",
    rating: 5,
    avatar: "MW",
  },
  {
    name: "Priya Nair",
    title: "VP Finance, TechCore Inc",
    text: "Enterprise-grade security with consumer-grade ease of use. The GDPR compliance features alone justified the investment. Our legal and compliance teams were impressed.",
    rating: 5,
    avatar: "PN",
  },
];

const FAQ_ITEMS = [
  {
    q: "What AI models power FinanceGuard AI?",
    a: "FinanceGuard AI uses a multi-model architecture with OpenAI GPT-4o as the foundation, augmented by domain-specific fine-tuned models for financial analysis. Every model response is validated by Enkrypt AI guardrails before being delivered to users.",
  },
  {
    q: "How does the Qdrant vector memory work?",
    a: "Every document you upload is chunked, embedded, and stored in Qdrant's high-performance vector database. When you query the system, the most semantically relevant chunks are retrieved and passed to the AI agents as grounded context — enabling precise, citation-backed answers.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. All data is encrypted with AES-256 at rest and TLS 1.3 in transit. We are SOC 2 Type II certified, GDPR compliant, and ISO 27001 certified. Your data is completely isolated per tenant and is never used to train any models.",
  },
  {
    q: "What document formats are supported?",
    a: "FinanceGuard AI supports PDF, Excel (XLSX/XLS), CSV, Word (DOCX), PowerPoint (PPTX), JSON, XML, and plain text. Advanced OCR processing handles scanned documents and image-based PDFs with high accuracy.",
  },
  {
    q: "How does the multi-agent workflow operate?",
    a: "Mastra orchestrates five specialized agents that work in parallel or sequentially based on task complexity. The Document Ingestion agent extracts data, Profile Builder builds context, Risk Analysis and Forecast agents process concurrently, and the Financial Advisor synthesizes the final response.",
  },
  {
    q: "Can I integrate FinanceGuard AI with existing systems?",
    a: "Yes. FinanceGuard AI provides REST APIs, webhooks, and native integrations with Salesforce, SAP, Bloomberg Terminal, and major accounting platforms. Enterprise customers can deploy on-premises or in a private cloud via Docker and Kubernetes.",
  },
];

const FORECAST_DATA = [
  { month: "Jan", revenue: 4.2, forecast: 4.5 },
  { month: "Feb", revenue: 4.8, forecast: 5.1 },
  { month: "Mar", revenue: 4.5, forecast: 4.8 },
  { month: "Apr", revenue: 5.2, forecast: 5.6 },
  { month: "May", revenue: 5.8, forecast: 6.2 },
  { month: "Jun", revenue: 6.1, forecast: 6.8 },
  { month: "Jul", revenue: 6.9, forecast: 7.4 },
];

const EXTENDED_FORECAST = [
  ...FORECAST_DATA,
  { month: "Aug", revenue: undefined, forecast: 7.9 },
  { month: "Sep", revenue: undefined, forecast: 8.4 },
  { month: "Oct", revenue: undefined, forecast: 8.9 },
  { month: "Nov", revenue: undefined, forecast: 9.3 },
  { month: "Dec", revenue: undefined, forecast: 9.8 },
];

// ─── SHARED UTILITIES ─────────────────────────────────────────

function FadeIn({
  children, delay = 0, y = 28, className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 45%, #67e8f9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/55 mb-6">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse block" />
      {children}
    </div>
  );
}

function SectionHeader({
  pill, title, subtitle,
}: {
  pill: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <SectionHeaderWrapper pill={pill} title={title} subtitle={subtitle} />
  );
}

function SectionHeaderWrapper({
  pill, title, subtitle,
}: {
  pill: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <FadeIn className="text-center mb-16">
      <Pill>{pill}</Pill>
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
        {title}
      </h2>
      <p className="text-lg text-white/45 max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </FadeIn>
  );
}

// ─── BACKGROUND ORBS ──────────────────────────────────────────

function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 25, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[12%] left-[8%] w-[700px] h-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)" }}
      />
      <motion.div
        animate={{ x: [0, -45, 35, 0], y: [0, 35, -25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-[30%] right-[5%] w-[550px] h-[550px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)" }}
      />
      <motion.div
        animate={{ x: [0, 25, -40, 0], y: [0, -20, 40, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 9 }}
        className="absolute bottom-[8%] left-[25%] w-[450px] h-[450px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}

// ─── DASHBOARD MOCKUP ─────────────────────────────────────────

function DashboardMockup() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: "linear-gradient(180deg, #0d0d22 0%, #080810 100%)",
        boxShadow: "0 0 100px rgba(99,102,241,0.18), 0 50px 100px rgba(0,0,0,0.6)",
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/55" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/55" />
          <div className="w-3 h-3 rounded-full bg-green-400/55" />
        </div>
        <div className="flex-1 mx-6">
          <div className="bg-white/[0.05] border border-white/[0.07] rounded-md px-3 py-1 text-[11px] text-white/25 font-mono text-center select-none">
            app.financeguard.ai/dashboard
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 animate-pulse" />
          <span className="text-[10px] text-white/25">Live</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-44 border-r border-white/[0.06] p-3 bg-white/[0.015] hidden sm:block flex-shrink-0">
          <div className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-3 px-2">Navigation</div>
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: AlertTriangle, label: "Risk", active: false },
            { icon: TrendingUp, label: "Forecast", active: false },
            { icon: Brain, label: "AI Agents", active: false },
            { icon: FileText, label: "Documents", active: false },
            { icon: Shield, label: "Security", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-xs cursor-default transition-colors ${
                item.active
                  ? "bg-indigo-500/12 text-indigo-300 border border-indigo-500/20"
                  : "text-white/25"
              }`}
            >
              <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Portfolio AUM", value: "$2.47B", delta: "+8.3%", color: "#10b981" },
              { label: "Risk Score", value: "18/100", delta: "-12%", color: "#f59e0b" },
              { label: "AI Accuracy", value: "99.1%", delta: "+0.4%", color: "#6366f1" },
              { label: "Documents", value: "1,847", delta: "+34 today", color: "#8b5cf6" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3">
                <div className="text-[10px] text-white/35 mb-1.5">{s.label}</div>
                <div className="text-base font-bold text-white mb-0.5">{s.value}</div>
                <div className="text-[10px] font-medium" style={{ color: s.color }}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-3">
            <div className="text-xs font-medium text-white/50 mb-3">Revenue vs AI Forecast</div>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={FORECAST_DATA}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 2" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "AI Agents", id: "ai-agents" },
    { label: "Workflow", id: "workflow" },
    { label: "Security", id: "security" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#05050a]/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">
              FinanceGuard <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.id && scrollTo(link.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white/50 hover:text-white/90 transition-colors duration-150 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Auth CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/login">
              <button
                className="px-4 py-1.5 text-[13px] text-white/55 hover:text-white transition-colors cursor-pointer"
              >
                Login
              </button>
            </Link>
            <Link href="/login?mode=signup">
              <button
                className="px-4 py-1.5 text-[13px] text-white/70 border border-white/12 rounded-lg hover:bg-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                Sign Up
              </button>
            </Link>
            <Link href="/login?mode=signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] text-white font-medium rounded-lg cursor-pointer"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                Get Started <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white/50 hover:text-white transition-colors p-1"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden border-t border-white/[0.06] py-4 bg-[#05050a]/95 backdrop-blur-2xl"
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.id && scrollTo(link.id)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left"
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-2 px-4 pt-3 border-t border-white/[0.06] mt-2">
              <Link href="/login" className="flex-1">
                <button
                  className="w-full py-2.5 text-sm text-white/60 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-center cursor-pointer"
                >
                  Login
                </button>
              </Link>
              <Link href="/login?mode=signup" className="flex-1">
                <button
                  className="w-full py-2.5 text-sm text-white font-medium rounded-xl text-center cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  Sign Up
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-16 px-4 overflow-hidden">
      <BackgroundOrbs />

      <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Pill>Enterprise AI · Financial Intelligence Platform · Powered by Mastra & Qdrant</Pill>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-white tracking-[-0.02em] leading-[1.04] mb-7"
        >
          The AI Brain Behind<br />
          <GradientText>Every Financial</GradientText>
          <br />Decision.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Five specialized AI agents orchestrated by Mastra to ingest documents, build entity profiles,
          detect risk, forecast outcomes, and deliver strategic intelligence — all in real time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/login?mode=signup">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-8 py-4 text-white font-semibold rounded-xl text-base shadow-xl shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-8 py-4 text-white/75 font-medium rounded-xl text-base border border-white/10 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all duration-200 cursor-pointer"
            >
              <PlayCircle className="w-4.5 h-4.5" />
              Watch Demo
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mb-20 text-xs text-white/30"
        >
          {["SOC 2 Type II", "GDPR Compliant", "ISO 27001", "99.9% Uptime SLA", "AES-256 Encryption"].map((b) => (
            <span key={b} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-green-400/80" />
              {b}
            </span>
          ))}
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

// ─── AI AGENTS ────────────────────────────────────────────────

function AgentCard({ agent, index }: { agent: (typeof AGENTS)[0]; index: number }) {
  return (
    <FadeIn delay={index * 0.08}>
      <motion.div
        whileHover={{ y: -7 }}
        className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm h-full overflow-hidden cursor-default"
        style={{ transition: "box-shadow 0.35s ease, transform 0.35s ease" }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${agent.color}1a 0%, transparent 55%)` }}
        />
        <div className="relative">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: `${agent.color}1a`, border: `1px solid ${agent.color}2a` }}
          >
            <agent.icon className="w-6 h-6" style={{ color: agent.color }} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2 h-2 rounded-full animate-pulse block"
              style={{ backgroundColor: agent.status === "processing" ? "#f59e0b" : agent.color }}
            />
            <span
              className="text-xs font-medium capitalize"
              style={{ color: agent.status === "processing" ? "#f59e0b" : agent.color }}
            >
              {agent.status}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white mb-2 leading-snug">{agent.name}</h3>
          <p className="text-sm text-white/45 leading-relaxed">{agent.description}</p>
        </div>
      </motion.div>
    </FadeIn>
  );
}

function AgentsSection() {
  return (
    <section id="ai-agents" className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          pill="Five Specialized Agents"
          title={<>Agents Built for <GradientText>Financial Intelligence</GradientText></>}
          subtitle="Each agent is a domain expert. Together they form an orchestrated intelligence layer handling the complete lifecycle of financial analysis — from raw documents to strategic decisions."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {AGENTS.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── WORKFLOW ─────────────────────────────────────────────────

function WorkflowSection() {
  return (
    <section id="workflow" className="relative py-32 px-4 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.055) 0%, transparent 65%)" }}
      />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          pill="How It Works"
          title={<>From Raw Data to <GradientText>Financial Intelligence</GradientText></>}
          subtitle="Six stages of AI-powered processing transform your documents into strategic insights in minutes, not days."
        />

        <div className="relative">
          {/* Connector */}
          <div className="absolute top-[46px] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent hidden lg:block" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-2">
            {WORKFLOW_STEPS.map((step, i) => (
              <FadeIn key={step.label} delay={i * 0.09}>
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}
                    className="relative w-[92px] h-[92px] rounded-2xl flex flex-col items-center justify-center mb-4 bg-white/[0.05] border border-white/[0.09] backdrop-blur-sm transition-all duration-300"
                  >
                    {(i === 0 || i === WORKFLOW_STEPS.length - 1) && (
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{ boxShadow: "0 0 25px rgba(99,102,241,0.18) inset" }}
                      />
                    )}
                    <step.icon className="w-7 h-7 text-indigo-400 mb-1.5" />
                    <span className="text-[10px] text-indigo-400/60 font-semibold">0{i + 1}</span>
                  </motion.div>
                  <div className="text-sm font-semibold text-white mb-1 leading-snug">{step.label}</div>
                  <div className="text-xs text-white/35">{step.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          pill="Platform Capabilities"
          title={<>Everything You Need for <GradientText>Enterprise Finance AI</GradientText></>}
          subtitle="A complete, production-ready platform for AI-powered financial intelligence — from document ingestion to strategic decision support."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.name} delay={(i % 4) * 0.08}>
              <motion.div
                whileHover={{ y: -5, borderColor: "rgba(99,102,241,0.28)" }}
                className="bg-white/[0.035] border border-white/[0.07] rounded-2xl p-6 h-full transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/12 border border-indigo-500/18 flex items-center justify-center mb-4 group-hover:bg-indigo-500/18 transition-colors">
                  <f.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{f.name}</h3>
                <p className="text-sm text-white/42 leading-relaxed">{f.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ARCHITECTURE ─────────────────────────────────────────────

function ArchitectureSection() {
  return (
    <section id="architecture" className="relative py-32 px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.05) 0%, transparent 55%)" }}
      />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          pill="Technology Stack"
          title={<>Powered by <GradientText>Best-in-Class</GradientText> Infrastructure</>}
          subtitle="A battle-tested technology stack purpose-built for AI reliability, vector memory, multi-agent orchestration, and enterprise-grade scale."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {TECH_STACK.map((tech, i) => (
            <FadeIn key={tech.name} delay={(i % 5) * 0.07}>
              <motion.div
                whileHover={{ y: -5, borderColor: tech.color + "55" }}
                className="group bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300 group-hover:scale-105"
                  style={{ background: tech.color + "1a", border: `1px solid ${tech.color}28`, color: tech.color }}
                >
                  {tech.abbr}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{tech.name}</div>
                <div className="text-[11px] text-white/32">{tech.desc}</div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECURITY ─────────────────────────────────────────────────

function SecuritySection() {
  return (
    <section id="security" className="relative py-32 px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse at 25% 50%, rgba(99,102,241,0.055) 0%, transparent 50%)",
            "radial-gradient(ellipse at 75% 50%, rgba(139,92,246,0.05) 0%, transparent 50%)",
          ].join(", "),
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <Pill>Enterprise Security</Pill>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-[-0.02em] leading-[1.08]">
              Built on a Foundation of <GradientText>Trust & Security</GradientText>
            </h2>
            <p className="text-lg text-white/45 mb-8 leading-relaxed">
              Financial data demands uncompromising security. FinanceGuard AI is engineered with
              security-first architecture, AI safety guardrails, and comprehensive compliance
              certifications that enterprise teams require.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-8">
              {["SOC 2 Type II", "GDPR", "ISO 27001", "HIPAA Ready", "PCI-DSS"].map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 text-sm text-green-400 select-none"
                >
                  <Check className="w-3 h-3" /> {cert}
                </div>
              ))}
            </div>
            <div
              className="flex items-center gap-4 p-4 rounded-xl border border-indigo-500/20"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">Enkrypt AI Guardrails</div>
                <div className="text-xs text-white/40">Every AI response is validated for safety, accuracy, and compliance before delivery.</div>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECURITY_FEATURES.map((feat, i) => (
              <FadeIn key={feat.name} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -4, borderColor: "rgba(99,102,241,0.3)" }}
                  className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 h-full transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/12 border border-indigo-500/18 flex items-center justify-center mb-3">
                    <feat.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-semibold text-white mb-1.5">{feat.name}</div>
                  <div className="text-xs text-white/38 leading-relaxed">{feat.desc}</div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PRODUCT PREVIEW ──────────────────────────────────────────

function ProductPreviewSection() {
  const [tab, setTab] = useState(0);
  const tabs = ["Dashboard", "Risk Analysis", "Forecasting", "AI Workspace"];

  return (
    <section id="product" className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          pill="Product Preview"
          title={<>See <GradientText>FinanceGuard AI</GradientText> in Action</>}
          subtitle="Explore the platform — from real-time dashboards to AI-powered analysis and conversational financial advisory."
        />

        <FadeIn className="flex justify-center mb-8">
          <div className="flex gap-1 p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  tab === i
                    ? "bg-indigo-500/18 text-indigo-300 border border-indigo-500/28 shadow-sm"
                    : "text-white/38 hover:text-white/65"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </FadeIn>

        <FadeIn>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #0d0d22 0%, #080810 100%)",
              boxShadow: "0 0 70px rgba(99,102,241,0.12), 0 50px 100px rgba(0,0,0,0.45)",
            }}
          >
            {/* Chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.025]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/55" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/55" />
                <div className="w-3 h-3 rounded-full bg-green-400/55" />
              </div>
              <div className="ml-4 text-xs text-white/22 font-mono select-none">
                app.financeguard.ai/{tabs[tab].toLowerCase().replace(" ", "-")}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {tab === 0 && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Total AUM", value: "$847.2M", delta: "+8.3% MoM", c: "#10b981" },
                      { label: "Risk Score", value: "23/100", delta: "−12% vs last Q", c: "#f59e0b" },
                      { label: "Documents", value: "1,847", delta: "+34 today", c: "#6366f1" },
                      { label: "AI Queries", value: "12,490", delta: "+847 this week", c: "#8b5cf6" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                        <div className="text-xs text-white/38 mb-2">{s.label}</div>
                        <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
                        <div className="text-xs font-medium" style={{ color: s.c }}>{s.delta}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <div className="text-sm font-semibold text-white mb-4">Portfolio Performance vs AI Forecast</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={FORECAST_DATA}>
                        <defs>
                          <linearGradient id="pc1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#0d0d22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 12 }} />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#pc1)" name="Actual Revenue ($M)" />
                        <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3" fill="none" name="AI Forecast ($M)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {tab === 1 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-white mb-4">Risk Score Breakdown</div>
                    <div className="space-y-3">
                      {[
                        { label: "Market Risk", score: 23, color: "#10b981" },
                        { label: "Credit Risk", score: 47, color: "#f59e0b" },
                        { label: "Liquidity Risk", score: 18, color: "#10b981" },
                        { label: "Operational Risk", score: 31, color: "#6366f1" },
                        { label: "Concentration Risk", score: 38, color: "#f59e0b" },
                      ].map((r) => (
                        <div key={r.label}>
                          <div className="flex justify-between text-xs text-white/45 mb-1.5">
                            <span>{r.label}</span>
                            <span style={{ color: r.color }} className="font-semibold">{r.score}/100</span>
                          </div>
                          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${r.score}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                    <div className="text-sm font-semibold text-white mb-4">AI Risk Summary</div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="text-green-400 font-semibold">Overall Risk: Low (23/100)</span>
                      </div>
                      <p className="text-white/45 text-xs leading-relaxed">
                        Portfolio exhibits healthy diversification with primary exposure in technology (34%) and healthcare (22%). Credit risk elevated due to three high-yield positions maturing Q4.
                      </p>
                      <div className="flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/20 rounded-lg p-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-300/80 leading-relaxed">
                          Correlation spike detected between NASDAQ positions during high-volatility windows. Consider rebalancing by October.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 2 && (
                <div>
                  <div className="text-sm font-semibold text-white mb-5">12-Month Revenue Forecast with Confidence Bands</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={EXTENDED_FORECAST}>
                      <defs>
                        <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fc2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip contentStyle={{ background: "#0d0d22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 12 }} formatter={(v: any) => v !== undefined ? `$${v}M` : "—"} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev2)" name="Actual" />
                      <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3" fill="url(#fc2)" name="AI Forecast" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-4 mt-5">
                    {[
                      { label: "Q3 2025", value: "$22.2M", conf: "94% confidence" },
                      { label: "Q4 2025", value: "$28.0M", conf: "87% confidence" },
                      { label: "FY 2025", value: "$91.4M", conf: "91% confidence" },
                    ].map((f) => (
                      <div key={f.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-center">
                        <div className="text-xs text-white/38 mb-1.5">{f.label}</div>
                        <div className="text-xl font-bold text-white mb-1">{f.value}</div>
                        <div className="text-xs text-indigo-400">{f.conf}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 3 && (
                <div className="grid md:grid-cols-3 gap-5">
                  <div>
                    <div className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">Active Agents</div>
                    <div className="space-y-2">
                      {AGENTS.map((a) => (
                        <div
                          key={a.name}
                          className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.05]"
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: a.color }} />
                          <span className="text-xs text-white/55 flex-1">{a.name}</span>
                          <span className="text-[10px] capitalize" style={{ color: a.color }}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                    <div className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">AI Conversation</div>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/25 flex-shrink-0 flex items-center justify-center text-[10px] text-indigo-400 font-bold">U</div>
                        <div className="bg-white/[0.05] border border-white/[0.07] rounded-xl p-3 text-xs text-white/60 flex-1">
                          Analyze liquidity risk in our Q3 portfolio and provide a Q4 forecast with recommendations.
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/25 flex-shrink-0 flex items-center justify-center text-[10px] text-violet-400 font-bold">AI</div>
                        <div className="flex-1">
                          <div className="bg-indigo-500/[0.09] border border-indigo-500/20 rounded-xl p-3 text-xs">
                            <p className="text-indigo-300 font-semibold mb-1.5">Analysis complete — 5 agents synthesized.</p>
                            <p className="text-white/55 leading-relaxed">Q3 liquidity ratio is <span className="text-green-400">2.34×</span> — healthy. Key concern: <span className="text-yellow-400">$12M in 90-day paper</span> maturing in October. Q4 forecast shows 94% probability of maintaining above 2.0× threshold, but recommend diversifying maturity schedule before September month-end.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-32 px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 60%)" }}
      />
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          pill="Trusted by Finance Leaders"
          title={<>What <GradientText>Finance Professionals</GradientText> Say</>}
          subtitle="Hear from the CFOs, risk managers, and finance executives who rely on FinanceGuard AI every day to make better decisions faster."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 h-full flex flex-col transition-all duration-300"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-7 italic flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/38">{t.title}</div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-32 px-4">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          pill="FAQ"
          title={<>Common <GradientText>Questions</GradientText></>}
          subtitle="Everything you need to know about FinanceGuard AI before getting started."
        />
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.025]">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-medium text-white">{item.q}</span>
                  <motion.div
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-white/35" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-6 pb-5 text-sm text-white/45 leading-relaxed border-t border-white/[0.06] pt-4">
                    {item.a}
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div
            className="relative rounded-3xl p-12 md:p-20 overflow-hidden border border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.10) 50%, rgba(6,182,212,0.07) 100%)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.28) 0%, transparent 60%)" }}
            />
            <div className="relative text-center">
              <Pill>Ready to transform your financial operations?</Pill>
              <h2 className="text-4xl md:text-[3.5rem] font-bold text-white tracking-[-0.02em] mb-5 leading-[1.08]">
                Start Analyzing with <GradientText>AI Today</GradientText>
              </h2>
              <p className="text-lg text-white/45 mb-10 max-w-xl mx-auto leading-relaxed">
                Join 500+ finance teams using FinanceGuard AI. Set up in minutes, results in hours. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login?mode=signup">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 0 55px rgba(99,102,241,0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 px-9 py-4 text-white font-semibold rounded-xl text-base shadow-2xl shadow-indigo-500/25 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/login">
                  <button
                    className="px-8 py-4 text-white/55 font-medium text-base hover:text-white transition-colors cursor-pointer"
                  >
                    Already have an account? Sign in →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-white/[0.06] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/22">© 2026 FinanceGuard AI, Inc. All rights reserved.</p>
          <p className="text-xs text-white/18">
            Powered by Mastra · Qdrant · Enkrypt AI · OpenAI · Redis · Kubernetes
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#05050a", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />
      <HeroSection />
      <AgentsSection />
      <WorkflowSection />
      <FeaturesSection />
      <ArchitectureSection />
      <SecuritySection />
      <ProductPreviewSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
