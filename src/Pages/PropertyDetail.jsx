import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import {
  getPropertyById,
  getPropertyHiddenCosts,
  getPropertyScore,
  getRecommendations,
} from "../api/PropertyApi";
import PropertyCard from "../Components/PropertyCard";

import {
  Heart,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Building2,
  BedDouble,
  Bath,
  Car,
  Zap,
  Droplets,
  Shield,
  ArrowUpDown,
  UserCheck,
  Wind,
  Flame,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  MessageSquare,
  Send,
  Scale,
  CheckCircle2,
  Layers,
  Loader2,
  AlertTriangle,
  Star,
  TrendingUp,
  Wallet,
  Home,
  Ruler,
  Calendar,
  FileCheck,
  Banknote,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format XAF currency */
const formatXaf = (n) => {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  });
};

/** Format number with commas */
const fmtNum = (n) => (n == null ? "—" : n.toLocaleString("en-US"));

/** Map PropertyType enum to human label */
const propertyTypeLabel = (type) => {
  const map = {
    APARTMENT: "Apartment",
    STUDIO: "Studio",
    DUPLEX: "Duplex",
    VILLA: "Villa",
    BANGALOW: "Bungalow",
    SHOP: "Shop / Store",
    OFFICE: "Office",
    WAREHOUSE: "Warehouse",
    LAND: "Land",
  };
  return map[type] || type || "Property";
};

/** Map TitleType enum to human label */
const titleTypeLabel = (type) => {
  const map = {
    NONE: "No title deed",
    OCCUPATION: "Occupation permit",
    FONCIER: "Foncier / Land title",
  };
  return map[type] || type || "Unknown";
};

/** Map InfraZone enum to human label */
const infraZoneLabel = (zone) => {
  const map = {
    I: "Zone I — Urban core",
    II: "Zone II — Urban periphery",
    III: "Zone III — Semi-urban",
    IV: "Zone IV — Rural",
    V: "Zone V — Remote",
  };
  return map[zone] || zone || "Unknown zone";
};

/** Grade color mapping for AI score */
const gradeColor = (grade) => {
  const map = {
    A: "text-emerald-600 bg-emerald-50 border-emerald-200",
    B: "text-teal-600 bg-teal-50 border-teal-200",
    C: "text-amber-600 bg-amber-50 border-amber-200",
    D: "text-orange-600 bg-orange-50 border-orange-200",
    E: "text-red-600 bg-red-50 border-red-200",
  };
  return map[grade?.[0]] || "text-slate-600 bg-slate-50 border-slate-200";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // -- Core data states --
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -- ML-derived states --
  const [hiddenCosts, setHiddenCosts] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);

  // -- UI states --
  const [activeTab, setActiveTab] = useState("Overview");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "I would like to schedule a tour.",
  });
  const [sent, setSent] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch property on mount / id change
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setProperty(null);
      setHiddenCosts(null);
      setScoreData(null);
      setRecommendations([]);

      try {
        const data = await getPropertyById(id);
        if (!cancelled) {
          setProperty(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load property");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // -------------------------------------------------------------------------
  // Fetch ML data once property is loaded and user is authenticated
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!property || !user) return;
    let cancelled = false;

    async function loadMl() {
      setMlLoading(true);
      setMlError(null);

      try {
        // Fire all three ML calls in parallel
        const [costs, score, recs] = await Promise.allSettled([
          calculateHiddenCosts(id),
          scoreProperty(id),
          getRecommendations({ city: property.city, topN: 4 }),
        ]);

        if (cancelled) return;

        if (costs.status === "fulfilled") setHiddenCosts(costs.value);
        else console.warn("Hidden costs failed:", costs.reason);

        if (score.status === "fulfilled") setScoreData(score.value);
        else console.warn("Score failed:", score.reason);

        if (recs.status === "fulfilled") setRecommendations(recs.value?.recommendations?.slice(0, 4) || []);
        else console.warn("Recommendations failed:", recs.reason);
      } catch (err) {
        if (!cancelled) setMlError(err.message);
      } finally {
        if (!cancelled) setMlLoading(false);
      }
    }

    loadMl();
    return () => {
      cancelled = true;
    };
  }, [property, user, id]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const updateField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    setSent(true);
    // TODO: wire to backend contact endpoint when available
  };

  const nextImg = () =>
    setGalleryIndex((i) =>
      (i + 1) % (property?.images?.length || 1)
    );
  const prevImg = () =>
    setGalleryIndex(
      (i) =>
        (i - 1 + (property?.images?.length || 1)) %
        (property?.images?.length || 1)
    );

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-[#A8763E]" size={32} />
          <p className="text-[#5C6B78] text-sm">Loading property…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={40} />
          <h2 className="font-display text-xl mb-2 text-[#1F2D3A]">Could not load property</h2>
          <p className="text-[#5C6B78] text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1F2D3A] text-white px-4 py-2 text-sm hover:bg-[#16212C] transition-colors"
          >
            <ChevronLeft size={16} /> Go back
          </button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  // Derive gallery from property images or fallback placeholders
  const galleryImages =
    property.images?.length > 0
      ? property.images.map((img, idx) => ({
          url: img.imageUrl,
          label: img.isPrimary ? "Primary" : `Image ${idx + 1}`,
          tone: null,
        }))
      : [{ label: "No images available", tone: "from-[#5C6B78] to-[#1F2D3A]" }];

  const currentImage = galleryImages[galleryIndex];

  // Build badges from property data
  const badges = [
    { icon: Building2, label: propertyTypeLabel(property.propertyType) },
    {
      icon: BedDouble,
      label: `${property.numBedrooms || 0} bed${property.numBedrooms !== 1 ? "s" : ""} · ${property.numBathrooms || 0} bath${property.numBathrooms !== 1 ? "s" : ""}`,
    },
    ...(property.hasParking
      ? [{ icon: Car, label: "Parking available" }]
      : []),
    ...(property.hasGenerator
      ? [{ icon: Zap, label: "Generator backup" }]
      : []),
    ...(property.hasWaterMeter
      ? [{ icon: Droplets, label: "Water meter" }]
      : []),
  ];

  const TABS = [
    "Overview",
    "Features & policies",
    "AI Score",
    "Cost calculator",
    "Neighborhood",
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      className="min-h-screen bg-[#FAF7F0] text-[#1F2D3A]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .ledger-lines {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 27px,
            #E3DCC8 27px,
            #E3DCC8 28px
          );
        }
      `}</style>

      {/* ================================================================ */}
      {/* Top utility bar                                                  */}
      {/* ================================================================ */}
      <header className="border-b border-[#E3DCC8] bg-[#FAF7F0] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13.5px] text-[#5C6B78] hover:text-[#1F2D3A] transition-colors"
          >
            <ChevronLeft size={16} />
            Back to search
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved((s) => !s)}
              className="flex items-center gap-1.5 rounded-full border border-[#E3DCC8] bg-white px-3.5 py-1.5 text-[13px] text-[#1F2D3A] hover:border-[#A8763E] transition-colors"
            >
              <Heart
                size={14}
                className={saved ? "fill-[#A8763E] text-[#A8763E]" : ""}
              />
              {saved ? "Saved" : "Save"}
            </button>
            <button className="flex items-center gap-1.5 rounded-full border border-[#E3DCC8] bg-white px-3.5 py-1.5 text-[13px] text-[#1F2D3A] hover:border-[#A8763E] transition-colors">
              <Share2 size={14} />
              Share
            </button>
            <button className="rounded-full border border-[#E3DCC8] bg-white p-1.5 text-[#5C6B78] hover:border-[#A8763E] transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* Gallery                                                          */}
      {/* ================================================================ */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
        <div
          className={`relative h-[320px] sm:h-[420px] rounded-lg overflow-hidden ${
            currentImage.tone
              ? `bg-gradient-to-br ${currentImage.tone}`
              : "bg-[#1F2D3A]"
          }`}
        >
          {currentImage.url ? (
            <img
              src={currentImage.url}
              alt={currentImage.label}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Layers
                  size={34}
                  className="text-white/40 mx-auto mb-2"
                  strokeWidth={1.25}
                />
                <p className="font-display text-white/70 text-lg italic">
                  {currentImage.label}
                </p>
              </div>
            </div>
          )}

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {galleryImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === galleryIndex
                        ? "w-5 bg-white"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
              <span className="absolute top-3 right-3 bg-black/55 text-white text-[11px] font-mono px-2 py-1 rounded">
                {galleryIndex + 1} / {galleryImages.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Title block                                                      */}
      {/* ================================================================ */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-7">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#A8763E] mb-2">
          {property.status} · Listed {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : "recently"}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-[2.35rem] leading-tight">
              {property.title}
            </h1>
            <p className="flex items-center gap-1.5 text-[14.5px] text-[#5C6B78] mt-1.5">
              <MapPin size={15} />
              {property.neighbourhood}, {property.city}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl text-[#A8763E] font-medium">
              {formatXaf(property.rentXaf)}/mo
            </p>
            <p className="text-[12px] text-[#5C6B78] mt-0.5">
              {property.advanceMonths || 3} months advance ·{" "}
              {property.cautionMonths || 1} month caution
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2.5 rounded-md border border-[#E3DCC8] bg-white px-3.5 py-2.5"
            >
              <b.icon
                size={17}
                className="text-[#5C6B78] shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-[13.5px] text-[#1F2D3A]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Tabs                                                             */}
      {/* ================================================================ */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-7 sticky top-[57px] bg-[#FAF7F0] z-20">
        <div className="flex gap-6 overflow-x-auto border-b border-[#E3DCC8]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-3 text-[14px] transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[#A8763E] text-[#1F2D3A] font-medium"
                  : "border-transparent text-[#5C6B78] hover:text-[#1F2D3A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Body grid                                                        */}
      {/* ================================================================ */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        {/* ---------------- Left / main column ---------------- */}
        <div className="space-y-10 min-w-0">
          {/* ---------- Overview ---------- */}
          {activeTab === "Overview" && (
            <section className="space-y-8">
              {/* Description */}
              <div>
                <h2 className="font-display text-xl mb-3">About this property</h2>
                <p className="text-[14px] text-[#1F2D3A] leading-relaxed whitespace-pre-line">
                  {property.description || "No description provided."}
                </p>
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <DetailCard
                  icon={Ruler}
                  label="Area"
                  value={property.areaM2 ? `${fmtNum(property.areaM2)} m²` : "—"}
                />
                <DetailCard
                  icon={BedDouble}
                  label="Bedrooms"
                  value={property.numBedrooms ?? "—"}
                />
                <DetailCard
                  icon={Bath}
                  label="Bathrooms"
                  value={property.numBathrooms ?? "—"}
                />
                <DetailCard
                  icon={Calendar}
                  label="Built"
                  value={property.buildYear ?? "—"}
                />
                <DetailCard
                  icon={FileCheck}
                  label="Title"
                  value={titleTypeLabel(property.titleType)}
                />
                <DetailCard
                  icon={Home}
                  label="Unit type"
                  value={property.unitType || "—"}
                />
              </div>

              {/* Host info */}
              <div className="rounded-lg border border-[#E3DCC8] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] text-[#5C6B78] mb-0.5">Listed by</p>
                    <p className="flex items-center gap-1.5 text-[13px] text-[#3F5C4C] font-medium mb-3">
                      <CheckCircle2 size={13} /> Verified host
                    </p>
                    <p className="text-[14px] font-medium">{property.hostName}</p>
                  </div>
                  <div className="font-display text-lg italic text-right shrink-0 leading-tight text-[#A8763E]">
                    O
                    <br />
                    <span className="text-[10px] not-italic font-mono tracking-widest">
                      OLISTAY
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Score teaser (if available) */}
              {scoreData && (
                <div
                  className={`rounded-lg border p-5 cursor-pointer transition-colors ${gradeColor(
                    scoreData.grade
                  )}`}
                  onClick={() => setActiveTab("AI Score")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} />
                      <span className="font-display text-[17px] font-medium">
                        AI Match Score: {scoreData.grade}
                      </span>
                    </div>
                    <span className="font-mono text-lg font-medium">
                      {scoreData.total_score?.toFixed(1)}/100
                    </span>
                  </div>
                  <p className="text-[13px] mt-1.5 opacity-90">
                    {scoreData.recommendation}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ---------- Features & policies ---------- */}
          {activeTab === "Features & policies" && (
            <section className="space-y-8">
              {/* Amenities */}
              <div>
                <h2 className="font-display text-xl mb-4">Amenities & features</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FeatureList
                    title="Utilities & security"
                    items={[
                      { label: "Generator backup", active: property.hasGenerator, icon: Zap },
                      { label: "Water meter", active: property.hasWaterMeter, icon: Droplets },
                      { label: "Security gate", active: property.securityGate, icon: Shield },
                      { label: "Gardien / Guard", active: property.hasGardien, icon: UserCheck },
                      { label: "Fiber internet", active: property.fiberInternet, icon: Wind },
                      { label: "Parking", active: property.hasParking, icon: Car },
                    ]}
                  />
                  <FeatureList
                    title="Proximity"
                    items={[
                      { label: "Near school", active: property.nearSchool, icon: Building2 },
                      { label: "Near market", active: property.nearMarket, icon: Building2 },
                      { label: "Near hospital", active: property.nearHospital, icon: Building2 },
                      { label: "Near highway", active: property.nearHighway, icon: Car },
                      { label: "Near university", active: property.nearUniversity, icon: Building2 },
                    ]}
                  />
                </div>
              </div>

              <div className="h-px bg-[#D9D2C2]" />

              {/* Quality scores */}
              <div>
                <h2 className="font-display text-xl mb-4">Quality & risk assessment</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ScorePill label="Structural quality" value={property.structuralQuality} max={10} />
                  <ScorePill label="Condition" value={property.conditionScore} max={10} />
                  <ScorePill label="Noise level" value={property.noiseLevel} max={10} invert />
                  <ScorePill label="Landlord reputation" value={property.landlordReputation} max={10} />
                  <ScorePill label="Lease security" value={property.leaseSecurity} max={10} />
                  <ScorePill label="Transport" value={property.transportScore} max={10} />
                </div>
                {property.floodRisk && (
                  <div className="mt-3 flex items-center gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <AlertTriangle size={14} />
                    <span>Flood risk reported for this area</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#D9D2C2]" />

              {/* Contract terms */}
              <div>
                <h2 className="font-display text-xl mb-4">Contract terms</h2>
                <div className="rounded-lg border border-[#E3DCC8] bg-white p-5 space-y-3">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#5C6B78]">Advance payment</span>
                    <span className="font-mono font-medium">
                      {property.advanceMonths || 3} months
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#5C6B78]">Caution (security deposit)</span>
                    <span className="font-mono font-medium">
                      {property.cautionMonths || 1} month
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#5C6B78]">Title deed status</span>
                    <span className="font-medium">{titleTypeLabel(property.titleType)}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#5C6B78]">Infrastructure zone</span>
                    <span className="font-medium">{infraZoneLabel(property.infraZone)}</span>
                  </div>
                  <div className="h-px bg-[#E3DCC8]" />
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#5C6B78]">Total upfront (advance + caution)</span>
                    <span className="font-mono font-medium text-[#A8763E]">
                      {formatXaf(
                        (property.rentXaf || 0) *
                          ((property.advanceMonths || 3) + (property.cautionMonths || 1))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ---------- AI Score ---------- */}
          {activeTab === "AI Score" && (
            <section className="space-y-8">
              {mlLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin mx-auto mb-3 text-[#A8763E]" size={28} />
                  <p className="text-[#5C6B78] text-sm">Computing your personalized match score…</p>
                </div>
              ) : mlError ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto mb-2 text-[#5C6B78]" size={28} />
                  <p className="text-[#5C6B78] text-sm">{mlError}</p>
                  <p className="text-[11px] text-[#5C6B78] mt-1">
                    Make sure you have created a financial profile to see AI scores.
                  </p>
                </div>
              ) : scoreData ? (
                <>
                  {/* Overall grade */}
                  <div className={`rounded-lg border p-6 ${gradeColor(scoreData.grade)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={20} />
                        <span className="font-display text-2xl font-medium">
                          Match Grade: {scoreData.grade}
                        </span>
                      </div>
                      <span className="font-mono text-2xl font-bold">
                        {scoreData.total_score?.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[14px] opacity-90">{scoreData.recommendation}</p>
                  </div>

                  {/* Category breakdown */}
                  {scoreData.category_scores && (
                    <div>
                      <h2 className="font-display text-xl mb-4">Category breakdown</h2>
                      <div className="space-y-3">
                        <CategoryBar
                          label="Financial fit"
                          value={scoreData.category_scores.financial}
                          color="bg-emerald-500"
                        />
                        <CategoryBar
                          label="Goal alignment"
                          value={scoreData.category_scores.goal_alignment}
                          color="bg-teal-500"
                        />
                        <CategoryBar
                          label="Household fit"
                          value={scoreData.category_scores.household}
                          color="bg-sky-500"
                        />
                        <CategoryBar
                          label="Lifestyle match"
                          value={scoreData.category_scores.lifestyle}
                          color="bg-indigo-500"
                        />
                        <CategoryBar
                          label="Safety"
                          value={scoreData.category_scores.safety}
                          color="bg-violet-500"
                        />
                        <CategoryBar
                          label="Stability"
                          value={scoreData.category_scores.stability}
                          color="bg-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summaries */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {scoreData.financial_summary && (
                      <div className="rounded-lg border border-[#E3DCC8] bg-white p-4">
                        <p className="text-[11px] font-mono uppercase tracking-wide text-[#5C6B78] mb-1.5">
                          Financial summary
                        </p>
                        <p className="text-[13.5px] text-[#1F2D3A] leading-relaxed">
                          {scoreData.financial_summary}
                        </p>
                      </div>
                    )}
                    {scoreData.tco_summary && (
                      <div className="rounded-lg border border-[#E3DCC8] bg-white p-4">
                        <p className="text-[11px] font-mono uppercase tracking-wide text-[#5C6B78] mb-1.5">
                          Cost summary
                        </p>
                        <p className="text-[13.5px] text-[#1F2D3A] leading-relaxed">
                          {scoreData.tco_summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Flags */}
                  {scoreData.flags?.length > 0 && (
                    <div>
                      <h2 className="font-display text-xl mb-3">Notices</h2>
                      <div className="space-y-2">
                        {scoreData.flags.map((flag, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-[13.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
                          >
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#5C6B78] text-sm">
                    No score available. Create a financial profile to see how well this property matches you.
                  </p>
                  <button
                    onClick={() => navigate("/financial-profile")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#1F2D3A] text-white px-4 py-2 text-sm hover:bg-[#16212C] transition-colors"
                  >
                    Set up financial profile <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ---------- Cost calculator ---------- */}
          {activeTab === "Cost calculator" && (
            <section className="space-y-8">
              {mlLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin mx-auto mb-3 text-[#A8763E]" size={28} />
                  <p className="text-[#5C6B78] text-sm">Calculating true cost of occupancy…</p>
                </div>
              ) : hiddenCosts ? (
                <>
                  <div>
                    <h2 className="font-display text-xl mb-3">True cost of occupancy</h2>
                    <p className="text-[13px] text-[#5C6B78] mb-4">
                      Beyond the monthly rent, here is what you will actually spend to move in and live here.
                    </p>

                    <div className="rounded-lg border border-[#E3DCC8] bg-white overflow-hidden">
                      <div className="ledger-lines">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-[11px] font-mono uppercase tracking-wide text-[#5C6B78] border-b border-[#E3DCC8]">
                              <th className="py-2.5 pl-4 font-medium">Cost item</th>
                              <th className="py-2.5 pr-4 font-medium text-right">Amount (XAF)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <CostRow label="Base rent" value={hiddenCosts.breakdown?.rent} />
                            <CostRow label="Water" value={hiddenCosts.breakdown?.water} />
                            <CostRow label="Electricity" value={hiddenCosts.breakdown?.electricity} />
                            <CostRow
                              label="Generator contribution"
                              value={hiddenCosts.breakdown?.generator_contrib}
                            />
                            <CostRow
                              label="Building charges"
                              value={hiddenCosts.breakdown?.building_charges}
                            />
                            <CostRow
                              label="Gardien contribution"
                              value={hiddenCosts.breakdown?.gardien_contrib}
                            />
                            <CostRow
                              label="Transport delta"
                              value={hiddenCosts.breakdown?.transport_delta}
                              note="vs. your current neighbourhood"
                            />
                            <tr className="border-t-2 border-[#A8763E]">
                              <td className="pl-4 py-2.5 font-medium text-[14px]">
                                Total monthly cost
                              </td>
                              <td className="pr-4 py-2.5 text-right font-mono font-bold text-[#A8763E]">
                                {formatXaf(hiddenCosts.breakdown?.total_monthly_cost)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-[#D9D2C2]" />

                  {/* Upfront costs */}
                  <div>
                    <h2 className="font-display text-xl mb-3">Upfront move-in costs</h2>
                    <div className="rounded-lg border border-[#E3DCC8] bg-white p-5 space-y-3">
                      <div className="flex justify-between text-[14px]">
                        <span className="text-[#5C6B78]">Advance ({hiddenCosts.advance_months} months)</span>
                        <span className="font-mono font-medium">
                          {formatXaf(hiddenCosts.breakdown?.advance_payment)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-[#5C6B78]">Caution ({hiddenCosts.caution_months} month)</span>
                        <span className="font-mono font-medium">
                          {formatXaf(hiddenCosts.breakdown?.caution_payment)}
                        </span>
                      </div>
                      <div className="h-px bg-[#E3DCC8]" />
                      <div className="flex justify-between text-[14px]">
                        <span className="font-medium">Total upfront</span>
                        <span className="font-mono font-bold text-[#A8763E]">
                          {formatXaf(hiddenCosts.breakdown?.total_upfront_cost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Burden analysis */}
                  <div
                    className={`rounded-lg border p-5 ${
                      hiddenCosts.tco_burden?.includes("HIGH")
                        ? "text-red-700 bg-red-50 border-red-200"
                        : hiddenCosts.tco_burden?.includes("MODERATE")
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={18} />
                      <span className="font-display text-[17px] font-medium">
                        Cost burden: {hiddenCosts.tco_burden}
                      </span>
                    </div>
                    <p className="text-[13px] opacity-90">
                      Monthly total represents{" "}
                      <span className="font-mono font-medium">
                        {(hiddenCosts.tco_to_income_ratio * 100).toFixed(1)}%
                      </span>{" "}
                      of your effective income.
                    </p>
                    <p className="text-[13px] mt-2 opacity-90">{hiddenCosts.summary}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#5C6B78] text-sm">
                    No cost data available. Create a financial profile to calculate the true cost of this property.
                  </p>
                  <button
                    onClick={() => navigate("/financial-profile")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#1F2D3A] text-white px-4 py-2 text-sm hover:bg-[#16212C] transition-colors"
                  >
                    Set up financial profile <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ---------- Neighborhood ---------- */}
          {activeTab === "Neighborhood" && (
            <section className="space-y-8">
              <div>
                <h2 className="font-display text-xl mb-3">Location</h2>
                <div className="rounded-lg border border-[#E3DCC8] bg-white p-5">
                  <p className="text-[14px] leading-relaxed text-[#1F2D3A] mb-4">
                    This property is located in{" "}
                    <span className="font-medium">{property.neighbourhood}</span>,{" "}
                    <span className="font-medium">{property.city}</span>.{" "}
                    {property.gpsLat && property.gpsLon && (
                      <span className="font-mono text-[12px] text-[#5C6B78]">
                        GPS: {property.gpsLat.toFixed(4)}, {property.gpsLon.toFixed(4)}
                      </span>
                    )}
                  </p>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="font-display text-2xl text-[#A8763E]">
                        {property.transportScore ?? "—"}
                      </p>
                      <p className="text-[11.5px] text-[#5C6B78] mt-0.5">Transport Score</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl text-[#A8763E]">
                        {property.nearMarket ? "Yes" : "No"}
                      </p>
                      <p className="text-[11.5px] text-[#5C6B78] mt-0.5">Near Market</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl text-[#A8763E]">
                        {property.nearSchool ? "Yes" : "No"}
                      </p>
                      <p className="text-[11.5px] text-[#5C6B78] mt-0.5">Near School</p>
                    </div>
                  </div>
                </div>
              </div>

{/* Nearby recommendations */}
               {recommendations.length > 0 && (
                 <div>
                   <h2 className="font-display text-xl mb-3">Similar properties nearby</h2>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {recommendations.map((rec) => {
                       const recProperty = {
                         id: rec.property_id,
                         title: rec.title || "Property",
                         unitType: rec.unitType || "T1",
                         city: rec.city || property.city,
                         neighbourhood: rec.neighbourhood || property.neighbourhood,
                         zone: rec.infraZone || property.infraZone,
                         rentMonthly: rec.rent || property.rentXaf,
                         advanceMonths: rec.advanceMonths || property.advanceMonths,
                         hasGenerator: rec.hasGenerator || property.hasGenerator,
                         hasParking: rec.hasParking || property.hasParking,
                         hasSharedWC: rec.sharedWc || property.sharedWc,
                         landlordName: rec.hostName || property.hostName,
                         landlordReputation: rec.landlordReputation || property.landlordReputation,
                         primaryImage: rec.imageUrl || null,
                         matchScore: rec.hybrid_score ? Math.round(rec.hybrid_score * 100) : null,
                       }
                       return (
                         <PropertyCard key={rec.property_id} property={recProperty} />
                       )
                     })}
                   </div>
                 </div>
               )}
            </section>
          )}
        </div>

        {/* ---------------- Right / contact column ---------------- */}
        <aside className="lg:sticky lg:top-[120px] h-fit space-y-4">
          {/* Price card */}
          <div className="rounded-lg border border-[#E3DCC8] bg-white p-5">
            <div className="ledger-lines -mx-5 -mt-5 px-5 pt-5 pb-4 mb-4 rounded-t-lg">
              <p className="font-display text-lg">{formatXaf(property.rentXaf)}</p>
              <p className="text-[12.5px] text-[#5C6B78] mt-0.5">per month</p>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#5C6B78]">Advance</span>
                <span className="font-mono">
                  {property.advanceMonths || 3} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B78]">Caution</span>
                <span className="font-mono">
                  {property.cautionMonths || 1} month
                </span>
              </div>
              <div className="h-px bg-[#E3DCC8] my-2" />
              <div className="flex justify-between font-medium">
                <span>Upfront total</span>
                <span className="font-mono text-[#A8763E]">
                  {formatXaf(
                    (property.rentXaf || 0) *
                      ((property.advanceMonths || 3) + (property.cautionMonths || 1))
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-lg border border-[#E3DCC8] bg-white p-5">
            <div className="ledger-lines -mx-5 -mt-5 px-5 pt-5 pb-4 mb-4 rounded-t-lg">
              <p className="font-display text-lg">Contact host</p>
              <p className="text-[12.5px] text-[#5C6B78] mt-0.5">
                Usually replies within a day
              </p>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <CheckCircle2 size={32} className="text-[#3F5C4C] mx-auto mb-3" />
                <p className="font-display text-lg mb-1">Message sent</p>
                <p className="text-[13px] text-[#5C6B78]">
                  {property.hostName} will reach out to {form.email} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[12.5px] text-[#5C6B78] flex items-center gap-1 mb-1">
                    First &amp; last name{" "}
                    <span className="text-[#A8763E]">*</span>
                  </label>
                  <div className="relative">
                    <User
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6B78]"
                    />
                    <input
                      required
                      value={form.name}
                      onChange={updateField("name")}
                      placeholder="Jean Dupont"
                      className="w-full rounded-md border border-[#E3DCC8] bg-[#FAF7F0] pl-9 pr-3 py-2 text-[13.5px] outline-none focus:border-[#A8763E] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12.5px] text-[#5C6B78] flex items-center gap-1 mb-1">
                    Email <span className="text-[#A8763E]">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6B78]"
                    />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={updateField("email")}
                      placeholder="jean@email.com"
                      className="w-full rounded-md border border-[#E3DCC8] bg-[#FAF7F0] pl-9 pr-3 py-2 text-[13.5px] outline-none focus:border-[#A8763E] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12.5px] text-[#5C6B78] flex items-center gap-1 mb-1">
                    Phone <span className="text-[#A8763E]">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6B78]"
                    />
                    <input
                      required
                      value={form.phone}
                      onChange={updateField("phone")}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full rounded-md border border-[#E3DCC8] bg-[#FAF7F0] pl-9 pr-3 py-2 text-[13.5px] outline-none focus:border-[#A8763E] transition-colors font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12.5px] text-[#5C6B78] flex items-center gap-1 mb-1">
                    <MessageSquare size={12} /> Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={updateField("message")}
                    rows={3}
                    className="w-full rounded-md border border-[#E3DCC8] bg-[#FAF7F0] px-3 py-2 text-[13.5px] outline-none focus:border-[#A8763E] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#1F2D3A] hover:bg-[#16212C] text-white text-[13.5px] font-medium rounded-md py-2.5 transition-colors"
                >
                  <Send size={14} />
                  Send message
                </button>
                <p className="text-[10.5px] text-[#5C6B78] text-center leading-relaxed pt-1">
                  By sending this message you agree to be contacted by the host regarding your inquiry.
                </p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-[#E3DCC8] bg-white p-4 flex items-center gap-3">
      <Icon size={18} className="text-[#A8763E] shrink-0" strokeWidth={1.75} />
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wide text-[#5C6B78]">
          {label}
        </p>
        <p className="text-[14px] font-medium text-[#1F2D3A]">{value}</p>
      </div>
    </div>
  );
}

function FeatureList({ title, items }) {
  return (
    <div>
      <p className="text-[12px] font-mono uppercase tracking-wide text-[#5C6B78] mb-2.5">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-2 text-[14px] ${
              item.active ? "text-[#1F2D3A]" : "text-[#5C6B78] line-through opacity-60"
            }`}
          >
            <item.icon
              size={15}
              className={item.active ? "text-[#A8763E]" : "text-[#5C6B78]"}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScorePill({ label, value, max, invert }) {
  const pct = Math.round(((value || 0) / max) * 100);
  const color = invert
    ? pct > 70
      ? "text-red-600"
      : pct > 40
      ? "text-amber-600"
      : "text-emerald-600"
    : pct >= 70
    ? "text-emerald-600"
    : pct >= 40
    ? "text-amber-600"
    : "text-red-600";

  return (
    <div className="rounded-lg border border-[#E3DCC8] bg-white p-3 text-center">
      <p className="text-[11px] font-mono uppercase tracking-wide text-[#5C6B78] mb-1">
        {label}
      </p>
      <p className={`font-display text-2xl ${color}`}>{value ?? "—"}</p>
      <p className="text-[11px] text-[#5C6B78]">/ {max}</p>
    </div>
  );
}

function CategoryBar({ label, value, color }) {
  const pct = Math.min(100, Math.max(0, (value || 0) * 10)); // score is 0-10, scale to 0-100
  return (
    <div>
      <div className="flex justify-between text-[13px] mb-1">
        <span className="text-[#1F2D3A]">{label}</span>
        <span className="font-mono font-medium">{(value || 0).toFixed(1)}</span>
      </div>
      <div className="h-2 bg-[#E3DCC8] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CostRow({ label, value, note }) {
  return (
    <tr className="hover:bg-[#FAF7F0] transition-colors">
      <td className="pl-4 py-2 text-[13.5px] text-[#1F2D3A]">
        {label}
        {note && (
          <span className="block text-[11px] text-[#5C6B78] mt-0.5">{note}</span>
        )}
      </td>
      <td className="pr-4 py-2 text-right font-mono text-[13.5px]">
        {value != null ? formatXaf(value) : "—"}
      </td>
    </tr>
  );
}
