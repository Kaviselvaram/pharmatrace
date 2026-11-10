import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Icons, BrandLogo, SwirlLogo } from "../ui/Icons";

export default function LandingPage({ onEnterApp, batches = [], lastPacket }) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCorridor, setSelectedCorridor] = useState("NH44 Southbound");
  const [sliderPosition, setSliderPosition] = useState(65);
  const [destIdx, setDestIdx] = useState(0);
  const heroRef = useRef(null);

  const destinationCards = [
    {
      title: "Apollo Hospital Chennai",
      sub: "2-of-2 dual custody handover",
      img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Bangalore Logistics Hub",
      sub: "ColdLogix reefer telemetry checkpoint",
      img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Genome Valley Hyderabad",
      sub: "Genesis formulation facility",
      img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    },
  ];

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll(".hero-fade"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  const steps = [
    {
      num: "01",
      title: "Create Batch",
      desc: "Manufacturer mints an immutable lot on-chain with strict thermal boundaries (2.00°C – 8.00°C) and canonical genesis hash.",
      tag: "GENESIS MINT",
    },
    {
      num: "02",
      title: "Assign Custody",
      desc: "Batch is placed under custodian control. 2-of-2 dual-key multi-sig contracts prevent unilateral diversion.",
      tag: "2-OF-2 MULTI-SIG",
    },
    {
      num: "03",
      title: "Stream Telemetry",
      desc: "Virtualized edge sensors in refrigerated reefers record ambient temperature, humidity, and GPS coordinates every second.",
      tag: "EDGE TELEMETRY",
    },
    {
      num: "04",
      title: "Cryptographically Verify",
      desc: "Packets are packed into a canonical 78-byte structure and signed with ECDSA secp256k1 before on-chain ecrecover.",
      tag: "EIP-191 DIGEST",
    },
    {
      num: "05",
      title: "Monitor Journey",
      desc: "Interstate fleet movement is tracked in real time across waypoints from Hyderabad Genome Valley to Chennai.",
      tag: "LIVE CORRIDOR",
    },
    {
      num: "06",
      title: "Detect Threat",
      desc: "MITM payload tampering, replay nonce attacks, and refrigeration compressor failures are caught instantly by EVM assertions.",
      tag: "ZERO-TRUST",
    },
    {
      num: "07",
      title: "Autonomous Quarantine",
      desc: "Upon an unrecoverable breach, the smart contract transitions the lot to QUARANTINED, locking clinical dispensation.",
      tag: "AUTO-LOCKDOWN",
    },
    {
      num: "08",
      title: "Orchestrated Recovery",
      desc: "Expedited digital twin replacement is minted and linked on-chain to the quarantined lot to protect patient supply.",
      tag: "DIGITAL RECOVERY",
    },
  ];

  const currentTemp = lastPacket?.temperature_celsius ?? 4.25;
  const isSafe = currentTemp >= 2.0 && currentTemp <= 8.0;

  return (
    <div style={{ background: "#FFFFFF", color: "#111827", minHeight: "100vh", overflowX: "hidden" }}>
      {/* =========================================================================
          REFERENCE 1: HERO SECTION WITH PANORAMIC CONTRAST & DOCKED PILL BAR
          ========================================================================= */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          minHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 32px 32px 32px",
          /* Majestic cinematic landscape hero backdrop */
          background: `linear-gradient(180deg, rgba(12, 13, 17, 0.4) 0%, rgba(12, 13, 17, 0.65) 60%, rgba(12, 13, 17, 0.9) 100%), url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat`,
          color: "#FFFFFF",
          borderRadius: "0 0 32px 32px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Top Header Bar inside Hero */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <SwirlLogo size={32} />
            <span
              className="font-display"
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "#FFFFFF",
                letterSpacing: "-0.4px",
              }}
            >
              PharmaTrace
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: "600",
                marginLeft: "8px",
              }}
            >
              <Icons.Search size={12} />
              <span>Search lot / corridor...</span>
            </div>
          </div>

          {/* Navigation Links matching Reference 1 top right */}
          <nav style={{ display: "flex", alignItems: "center", gap: "24px" }} className="nav-links-desktop">
            <a href="#how-it-works" style={{ textDecoration: "none", color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", fontWeight: "500" }}>
              How It Works
            </a>
            <a href="#core-value" style={{ textDecoration: "none", color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", fontWeight: "500" }}>
              Core Axiom
            </a>
            <a href="#surveillance" style={{ textDecoration: "none", color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", fontWeight: "500" }}>
              Fleet Surveillance
            </a>
            <a href="#security" style={{ textDecoration: "none", color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", fontWeight: "500" }}>
              Cryptography
            </a>
            <a href="#audit" style={{ textDecoration: "none", color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", fontWeight: "500" }}>
              FDA / CDSCO Audit
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => onEnterApp("verify")}
              className="portal-white-pill-btn"
              style={{ padding: "8px 18px", fontSize: "12px" }}
            >
              <Icons.QrCode size={14} />
              <span>Verify Lot</span>
            </button>
            <button
              onClick={() => onEnterApp("overview")}
              className="portal-white-pill-btn"
              style={{ padding: "8px 18px", fontSize: "12px", background: "var(--dash-blue-accent)", color: "#FFFFFF" }}
            >
              <span>Enter Workspace</span>
              <Icons.ArrowUpRight size={14} />
            </button>
          </div>
        </header>

        {/* Center: Hero Title & Messaging matching Reference 1 "Travel" */}
        <div style={{ textAlign: "center", margin: "auto 0", padding: "40px 0" }}>
          <h1
            className="font-display hero-fade"
            style={{
              fontSize: "clamp(54px, 8vw, 110px)",
              fontWeight: "800",
              color: "#FFFFFF",
              letterSpacing: "-2.5px",
              lineHeight: "1.0",
              margin: "0 0 16px 0",
            }}
          >
            Trace
          </h1>
          <p
            className="hero-fade"
            style={{
              fontSize: "17px",
              color: "rgba(255, 255, 255, 0.85)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.5",
            }}
          >
            Trust with intention. Discover cold-chain telemetry, cryptographic provenance, and autonomous digital recovery all in one place.
          </p>
        </div>

        {/* Bottom: Docked Segmented Search/Filter Bar matching Reference 1 */}
        <div className="hero-fade" style={{ maxWidth: "1080px", width: "100%", margin: "0 auto" }}>
          <div className="hero-docked-bar">
            {/* Segment 1: Corridor */}
            <div className="hero-dock-segment">
              <span className="hero-dock-label">Corridor / Logistics</span>
              <span className="hero-dock-value">Hyderabad → Chennai NH44</span>
            </div>

            {/* Segment 2: Target Envelope */}
            <div className="hero-dock-segment">
              <span className="hero-dock-label">Thermal Boundary</span>
              <span className="hero-dock-value">2.00°C – 8.00°C Nominal</span>
            </div>

            {/* Segment 3: Security Standard */}
            <div className="hero-dock-segment">
              <span className="hero-dock-label">Signature Scheme</span>
              <span className="hero-dock-value">EIP-191 / secp256k1</span>
            </div>

            {/* Segment 4: Active Edge Node */}
            <div className="hero-dock-segment">
              <span className="hero-dock-label">Active Node</span>
              <span className="hero-dock-value">ColdLogix Reefer #1042</span>
            </div>

            {/* Explore Button matching Reference 1 "Explore" solid white pill button */}
            <button
              onClick={() => onEnterApp("overview")}
              className="portal-white-pill-btn"
              style={{ padding: "14px 28px", borderRadius: "var(--radius-sm)", flexShrink: 0 }}
            >
              <span>Explore</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REFERENCE 1: TRUST STRIP & EDITORIAL HEADLINE WITH SLIDER TARGET
          ========================================================================= */}
      <section style={{ maxWidth: "1140px", margin: "0 auto", padding: "64px 24px 32px 24px" }}>
        {/* Trust Badges matching Reference 1: "💙 We are Melali  ★ 5K+ People Satisfied" */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#2563EB", display: "flex", alignItems: "center", gap: "6px" }}>
              💙 Algorithmic Verification
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#D97706", display: "flex", alignItems: "center", gap: "6px" }}>
              ★ 39/39 EVM Hardhat Vector Proofs
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", marginLeft: "10px" }}>
              {["#2563EB", "#059669", "#7C3AED"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: c,
                    border: "2px solid #FFFFFF",
                    marginLeft: "-8px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "var(--portal-text-muted)", fontWeight: "600" }}>
              +4 Network Nodes Authorized
            </span>
          </div>
        </div>

        {/* Giant Editorial Headline matching Reference 1:
            "Visa Travels means
             Going Places" */}
        <div style={{ textAlign: "center", margin: "48px 0" }}>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(38px, 5.5vw, 68px)",
              fontWeight: "800",
              color: "var(--portal-text-primary)",
              letterSpacing: "-1.5px",
              lineHeight: "1.1",
              position: "relative",
              display: "inline-block",
            }}
          >
            PharmaTrace means <br />
            Going <span style={{ position: "relative" }}>
              Further
              {/* Subtle translucent circle overlay on word matching Reference 1 */}
              <span
                style={{
                  position: "absolute",
                  right: "-20px",
                  top: "-10px",
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: "rgba(147, 197, 253, 0.35)",
                  pointerEvents: "none",
                }}
              />
            </span>
          </h2>

          {/* Dotted target line matching Reference 1: o---------(+) */}
          <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
            <div className="portal-target-line">
              <span className="dot-start" />
              <div className="dash-track" />
              <div className="target-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REFERENCE 1: SECTION "• 01 Our Value" / ASYMMETRIC 3-IMAGE CARDS
          ========================================================================= */}
      <section id="core-value" style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 24px 64px 24px" }}>
        {/* Tag pill matching Reference 1: "• 01 Our Value" */}
        <div style={{ marginBottom: "20px" }}>
          <span className="portal-pill-tag">
            • 01 Core Axiom
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: "40px",
            alignItems: "center",
          }}
        >
          {/* Left Column matching Reference 1:
              "Not Your Boring Travel Agent
               We plan chill, curated trips with good vibes and better people.
               [Book a Seat]" */}
          <div>
            <h3
              className="font-display"
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "var(--portal-text-primary)",
                lineHeight: "1.2",
                marginBottom: "16px",
                letterSpacing: "-0.8px",
              }}
            >
              Not Your Ordinary <br />
              Cold-Chain Framework
            </h3>
            <p
              style={{
                fontSize: "15px",
                color: "var(--portal-text-secondary)",
                lineHeight: "1.6",
                marginBottom: "28px",
              }}
            >
              We replace blind trust in cold-chain logistics with algorithmic verification. Every temperature heartbeat is digitally signed at the edge and mathematically proven on the EVM before admission.
            </p>
            <button
              onClick={() => onEnterApp("overview")}
              className="portal-black-pill-btn"
            >
              <span>Launch Workspace</span>
              <Icons.ChevronRight size={15} />
            </button>
          </div>

          {/* Right Column: Asymmetric 3-Card Composition matching Reference 1 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: "16px",
              alignItems: "center",
            }}
          >
            {/* Card 1: Tall Rounded Card (Bangli, East Bali style) */}
            <div
              className="portal-card"
              style={{
                borderRadius: "24px",
                height: "320px",
                position: "relative",
                background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%), url('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80') center/cover`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "20px",
                color: "#FFFFFF",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "700" }}>Genome Valley, Hyderabad</span>
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px" }}>
                Genesis batch formulation & automated sensor initialization
              </span>
            </div>

            {/* Card 2: Middle offset downward (Uluwatu style) */}
            <div
              className="portal-card"
              style={{
                borderRadius: "24px",
                height: "260px",
                marginTop: "40px",
                position: "relative",
                background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%), url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80') center/cover`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "18px",
                color: "#FFFFFF",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700" }}>NH44 Logistics Corridor</span>
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px" }}>
                Canonical 78-byte packing & EIP-191 ECDSA signatures
              </span>
            </div>

            {/* Card 3: Right card offset upward with navigation pills <- Prev + Next */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                className="portal-card"
                style={{
                  borderRadius: "24px",
                  height: "230px",
                  position: "relative",
                  background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%), url('${destinationCards[destIdx].img}') center/cover`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "16px",
                  color: "#FFFFFF",
                  transition: "background 0.3s ease",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "700" }}>{destinationCards[destIdx].title}</span>
                <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px" }}>
                  {destinationCards[destIdx].sub}
                </span>
              </div>

              {/* Prev / Next controls matching Reference 1 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                <button
                  onClick={() => setDestIdx((prev) => (prev > 0 ? prev - 1 : destinationCards.length - 1))}
                  title="Previous destination"
                  style={{
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    borderRadius: "var(--radius-full)",
                    padding: "4px 10px",
                    fontSize: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setDestIdx((prev) => (prev < destinationCards.length - 1 ? prev + 1 : 0))}
                  title="Next destination"
                  style={{
                    background: "#111827",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "var(--radius-full)",
                    padding: "4px 10px",
                    fontSize: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  + Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REFERENCE 1: SECTION "• Popular Destination 2025" -> "Pick the Batch"
          ========================================================================= */}
      <section id="surveillance" style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 24px 64px 24px" }}>
        {/* Tag pill matching Reference 1: "• Popular Destination 2025" */}
        <div style={{ marginBottom: "16px" }}>
          <span className="portal-pill-tag">
            • Live Fleet Surveillance 2026
          </span>
        </div>

        {/* Heading & Subtitle Split matching Reference 1 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "28px" }}>
          <h2
            className="font-display"
            style={{
              fontSize: "36px",
              fontWeight: "800",
              color: "var(--portal-text-primary)",
              letterSpacing: "-1px",
              margin: 0,
            }}
          >
            Pick the Batch
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--portal-text-secondary)",
              maxWidth: "460px",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            Real-time digital twins streaming verified sensor heartbeats from virtualized reefers along the interstate pharma corridor.
          </p>
        </div>

        {/* Filter Bar matching Reference 1
            [Destination] [Category] [Price] [Date] [Discover] */}
        <div
          style={{
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: "var(--radius-md)",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", flex: 1 }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--portal-text-muted)", display: "block" }}>
                DESTINATION
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--portal-text-primary)" }}>
                Chennai Apollo Hospital
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--portal-text-muted)", display: "block" }}>
                CATEGORY
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--portal-text-primary)" }}>
                mRNA Biologics & Vaccines
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--portal-text-muted)", display: "block" }}>
                THERMAL ENVELOPE
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--portal-text-primary)" }}>
                2.00°C – 8.00°C Enforced
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--portal-text-muted)", display: "block" }}>
                STATUS
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--portal-text-primary)" }}>
                Live Stream Active
              </span>
            </div>
          </div>

          <button
            onClick={() => onEnterApp("batches")}
            className="portal-black-pill-btn"
            style={{ padding: "8px 20px", fontSize: "12px" }}
          >
            <span>Discover Lots</span>
          </button>
        </div>

        {/* 3 Catalog Cards matching Reference 1 cards (Uluwatu, Toba Lake, Sumba Adventure) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Card 1: mRNA Vaccine Lot */}
          <div className="portal-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Covaxin mRNA Booster</h4>
                <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>Lot #0x4a9b...7a8b</span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  background: "#ECFDF5",
                  color: "#059669",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                • 4 Casks remaining
              </span>
            </div>

            <div
              style={{
                height: "170px",
                borderRadius: "16px",
                background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%), url('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80') center/cover`,
                position: "relative",
                padding: "14px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                color: "#FFFFFF",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: "700" }}>4.25°C Nominal</span>
              <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                Open Stream
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--portal-text-muted)" }}>
              <span>Transit: Reefer #1042</span>
              <span>Corridor: NH44</span>
              <button
                onClick={() => onEnterApp("batches")}
                className="circle-arrow-btn"
                style={{ width: "28px", height: "28px", background: "#F3F4F6", color: "#111827" }}
              >
                <Icons.ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Insulin Solution */}
          <div className="portal-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Humalog Rapid Insulin</h4>
                <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>Lot #0x7b1c...99a0</span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  background: "#ECFDF5",
                  color: "#059669",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                • 5 Casks remaining
              </span>
            </div>

            <div
              style={{
                height: "170px",
                borderRadius: "16px",
                background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%), url('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80') center/cover`,
                position: "relative",
                padding: "14px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                color: "#FFFFFF",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: "700" }}>3.90°C Nominal</span>
              <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                Open Stream
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--portal-text-muted)" }}>
              <span>Transit: SwiftCold Reefer</span>
              <span>Corridor: NH44</span>
              <button
                onClick={() => onEnterApp("batches")}
                className="circle-arrow-btn"
                style={{ width: "28px", height: "28px", background: "#F3F4F6", color: "#111827" }}
              >
                <Icons.ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: Monoclonal Antibodies */}
          <div className="portal-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Keytruda Oncology Biologics</h4>
                <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>Lot #0x9f3d...4b2c</span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                • 2 Casks remaining
              </span>
            </div>

            <div
              style={{
                height: "170px",
                borderRadius: "16px",
                background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%), url('https://images.unsplash.com/photo-1579165466791-78822231cb67?auto=format&fit=crop&w=600&q=80') center/cover`,
                position: "relative",
                padding: "14px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                color: "#FFFFFF",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: "700" }}>4.80°C Nominal</span>
              <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                Verified
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--portal-text-muted)" }}>
              <span>Transit: Reefer #02</span>
              <span>Corridor: NH44</span>
              <button
                onClick={() => onEnterApp("batches")}
                className="circle-arrow-btn"
                style={{ width: "28px", height: "28px", background: "#F3F4F6", color: "#111827" }}
              >
                <Icons.ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: INTERACTIVE HOW IT WORKS (8 STAGES FROM MASTER INSTRUCTION)
          ========================================================================= */}
      <section id="how-it-works" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="portal-pill-tag" style={{ marginBottom: "12px" }}>
              • 02 Verification Architecture
            </span>
            <h2 className="font-display" style={{ fontSize: "36px", fontWeight: "800", color: "var(--portal-text-primary)", letterSpacing: "-1px" }}>
              How PharmaTrace Works
            </h2>
            <p style={{ fontSize: "15px", color: "var(--portal-text-secondary)", maxWidth: "600px", margin: "8px auto 0 auto" }}>
              A continuous cryptographic pipeline eliminating blind institutional trust at every step of cold-chain transit.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            {steps.map((s, idx) => (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{
                  background: activeStep === idx ? "#FFFFFF" : "transparent",
                  border: activeStep === idx ? "2px solid #2563EB" : "1px solid #E5E7EB",
                  borderRadius: "20px",
                  padding: "24px 20px",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: activeStep === idx ? "0 10px 24px rgba(37, 99, 235, 0.08)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span className="font-display" style={{ fontSize: "20px", fontWeight: "800", color: activeStep === idx ? "#2563EB" : "#9CA3AF" }}>
                    {s.num}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: "700", background: "#F3F4F6", color: "#4B5563", padding: "2px 6px", borderRadius: "var(--radius-full)" }}>
                    {s.tag}
                  </span>
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "6px" }}>
                  {s.title}
                </h4>
                <p style={{ fontSize: "12px", color: "#6B7280", lineHeight: "1.5", margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: CALL TO ACTION BANNER & CLEAN FOOTER
          ========================================================================= */}
      <section style={{ maxWidth: "1140px", margin: "0 auto", padding: "80px 24px 40px 24px" }}>
        <div
          style={{
            background: "#111827",
            borderRadius: "32px",
            padding: "56px 40px",
            textAlign: "center",
            color: "#FFFFFF",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.15)",
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: "800",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            Ready to explore verified cold-chain logistics?
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.75)",
              maxWidth: "540px",
              margin: "0 auto 32px auto",
              lineHeight: "1.6",
            }}
          >
            Launch the operational workspace to simulate reefer telemetry, trigger adversarial chaos attacks, and verify on-chain autonomous recovery.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => onEnterApp("overview")}
              className="portal-white-pill-btn"
              style={{ padding: "14px 32px" }}
            >
              <span>Enter Workspace</span>
              <Icons.ArrowUpRight size={16} />
            </button>
            <button
              onClick={() => onEnterApp("verify")}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#FFFFFF",
                borderRadius: "var(--radius-full)",
                padding: "14px 28px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Scan Package QR
            </button>
          </div>
        </div>
      </section>

      {/* Modern Editorial Footer */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "40px 24px 48px 24px", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SwirlLogo size={28} />
            <span className="font-display" style={{ fontSize: "16px", fontWeight: "800", color: "#111827" }}>
              PharmaTrace
            </span>
            <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "12px" }}>
              Replacing institutional trust with algorithmic verification.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "12px", color: "#6B7280" }}>
            <span>EVM Cancun</span>
            <span>secp256k1</span>
            <span>EIP-191</span>
            <span>FDA 21 CFR Part 11</span>
            <span>CDSCO Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
