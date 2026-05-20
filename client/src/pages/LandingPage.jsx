// LandingPage — design-system v2 (Editorial Calm).
// Section-by-section scroll-choreographed narrative; lifecycle ribbon pins
// under the nav once the visitor scrolls past the hero. Reveal-on-enter for
// every section past the hero (prefers-reduced-motion fallback in index.css).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  UserCheck,
  Shield,
  Settings,
  ScrollText,
  Gavel,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const STAGES = ['Post', 'Discover', 'Apply', 'Verify', 'Review', 'Place', 'Supervise', 'Complete'];

// ── Constellation — five role nodes orbiting the lifecycle hub ──────────────
function Constellation({ size = 420 }) {
  const NODES = [
    { label: 'Student',    a: -90, color: 'var(--brand-500)' },
    { label: 'Company',    a: -18, color: 'var(--amber-500)' },
    { label: 'Supervisor', a:  54, color: 'var(--brand-400)' },
    { label: 'University', a: 126, color: 'var(--success-500)' },
    { label: 'Admin',      a: 198, color: 'var(--stone-700)' },
  ];
  const r = size * 0.38;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r}        fill="none" stroke="var(--border-default)" strokeDasharray="3 5" />
        <circle cx={size / 2} cy={size / 2} r={r * 0.6}  fill="none" stroke="var(--border-default)" strokeDasharray="3 5" />
        {NODES.map((n, i) => {
          const rad = (n.a * Math.PI) / 180;
          const x = size / 2 + Math.cos(rad) * r;
          const y = size / 2 + Math.sin(rad) * r;
          return (
            <line
              key={i}
              x1={size / 2}
              y1={size / 2}
              x2={x}
              y2={y}
              stroke="var(--border-default)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      {NODES.map((n, i) => {
        const rad = (n.a * Math.PI) / 180;
        const x = size / 2 + Math.cos(rad) * r;
        const y = size / 2 + Math.sin(rad) * r;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 88,
              height: 88,
              borderRadius: 999,
              left: x - 44,
              top: y - 44,
              background: 'var(--bg-raised)',
              boxShadow: 'var(--shadow-3), 0 0 0 1px var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              animation: `floatY 6s ease-in-out ${i * 0.5}s infinite`,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: n.color }} />
            <span
              className="t-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                fontWeight: 500,
              }}
            >
              {n.label}
            </span>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          width: 132,
          height: 132,
          borderRadius: 999,
          left: size / 2 - 66,
          top: size / 2 - 66,
          background: 'var(--stone-900)',
          color: 'var(--stone-50)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-4)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            lineHeight: 1,
            fontStyle: 'italic',
          }}
        >
          Internship
        </span>
        <span
          className="t-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--stone-400)',
            marginTop: 4,
          }}
        >
          Lifecycle
        </span>
      </div>
    </div>
  );
}

// ── Lifecycle ribbon pinned under the nav once past the hero ────────────────
function LifecycleRibbon({ stage, visible }) {
  const bounded = Math.min(STAGES.length - 1, Math.max(0, stage));
  return (
    <div
      aria-hidden={!visible}
      className="hidden md:block"
      style={{
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'color-mix(in srgb, var(--bg-paper) 90%, transparent)',
        backdropFilter: 'blur(var(--blur-md))',
        WebkitBackdropFilter: 'blur(var(--blur-md))',
        borderBottom: '1px solid var(--border-subtle)',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'transform var(--dur-panel) var(--ease-soft), opacity var(--dur-panel) var(--ease-soft)',
      }}
    >
      <div
        className="mx-auto flex items-center"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '12px var(--content-pad-x)',
          gap: 16,
        }}
      >
        <span className="t-eyebrow" style={{ marginRight: 'auto' }}>
          Now reading · stage {String(bounded + 1).padStart(2, '0')} · {STAGES[bounded]}
        </span>
        <div
          className="hidden lg:grid"
          style={{ gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 6, width: 360 }}
        >
          {STAGES.map((s, i) => (
            <div
              key={s}
              style={{
                height: 6,
                borderRadius: 999,
                background: i <= bounded ? 'var(--brand-500)' : 'var(--stone-200)',
                transition: 'background-color var(--dur-base) var(--ease-emphasis)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hero left column ───────────────────────────────────────────────────────
function HeroLeft() {
  return (
    <div>
      <span className="t-eyebrow">
        Internship workspace · for universities &amp; companies
      </span>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 6vw, 76px)',
          lineHeight: 0.98,
          letterSpacing: '-0.025em',
          margin: '14px 0 0',
          fontWeight: 400,
          animation: 'lc-hero-up 700ms var(--ease-soft) 80ms backwards',
        }}
      >
        The shortest path<br />
        from <span style={{ fontStyle: 'italic', color: 'var(--brand-500)' }}>classroom</span>
        <br />
        to <span style={{ fontStyle: 'italic', color: 'var(--amber-500)' }}>first job</span>.
      </h1>
      <p
        className="t-body-lg"
        style={{
          color: 'var(--text-secondary)',
          marginTop: 22,
          maxWidth: 420,
          animation: 'lc-hero-up 700ms var(--ease-soft) 140ms backwards',
        }}
      >
        One workspace. Five roles. The full internship lifecycle, finally calm.
      </p>
      <div
        className="flex flex-wrap"
        style={{
          marginTop: 24,
          gap: 10,
          animation: 'lc-hero-up 700ms var(--ease-soft) 200ms backwards',
        }}
      >
        <Link to="/register">
          <Button variant="primary" pill size="lg" trailing={<ArrowRight size={16} strokeWidth={1.8} />}>
            Start as a student
          </Button>
        </Link>
        <Link to="/register">
          <Button variant="secondary" pill size="lg">For companies</Button>
        </Link>
      </div>
      <style>{`
        @keyframes lc-hero-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── For-students mock: a single internship row card ────────────────────────
function InternshipCardMock() {
  return (
    <Card elevated style={{ padding: 18 }}>
      <div className="flex" style={{ gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
        <span
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--brand-100)',
            color: 'var(--brand-700)',
            fontWeight: 600,
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          AC
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Frontend Engineering Intern
          </div>
          <div className="t-caption" style={{ marginTop: 2 }}>
            Acme Co · Addis Ababa · 12 wks
          </div>
        </div>
        <Badge tone="brand">new</Badge>
      </div>
      <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 14 }}>
        <Badge tone="neutral">React</Badge>
        <Badge tone="neutral">TypeScript</Badge>
        <Badge tone="neutral">Figma</Badge>
      </div>
      <p className="t-body-md" style={{ color: 'var(--text-secondary)', margin: 0 }}>
        Build internal tools alongside the design-system team. Ship to production weekly.
      </p>
      <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14, alignItems: 'center' }}>
        <Button variant="primary" size="sm" pill trailing={<ArrowRight size={14} strokeWidth={1.8} />}>
          Apply
        </Button>
        <Button variant="ghost" size="sm">Save</Button>
        <span className="t-mono muted" style={{ marginLeft: 'auto' }}>closes in 6d</span>
      </div>
    </Card>
  );
}

// ── For-companies mock: pipeline grid ──────────────────────────────────────
function PipelineMock() {
  const stages = [
    ['New',    12, 'brand'],
    ['Review',  8, 'warning'],
    ['Offer',   3, 'amber'],
    ['Placed',  2, 'success'],
  ];
  return (
    <Card elevated style={{ padding: 18 }}>
      <span className="t-eyebrow">Pipeline · Frontend Intern</span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          marginTop: 12,
        }}
      >
        {stages.map(([l, n, tone]) => (
          <div
            key={l}
            style={{
              padding: 12,
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span className="t-eyebrow">{l}</span>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                lineHeight: 1,
                fontWeight: 400,
                marginTop: 4,
              }}
            >
              {n}
            </div>
            <div style={{ marginTop: 6 }}>
              <Badge tone={tone}>{l.toLowerCase()}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── For-universities mock: placement-rate stat + tiny bar chart ────────────
function PlacementRateMock() {
  const bars = [36, 52, 48, 70, 60, 86, 78, 92];
  return (
    <Card elevated style={{ padding: 20 }}>
      <span className="t-eyebrow">Cohort 2026 · placement rate</span>
      <div className="flex" style={{ alignItems: 'baseline', marginTop: 8, gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 56,
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          92
          <span style={{ fontSize: 28, color: 'var(--text-tertiary)' }}>%</span>
        </span>
        <Badge tone="success">+3 pts</Badge>
      </div>
      <div
        style={{
          marginTop: 18,
          height: 90,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: i === bars.length - 1 ? 'var(--brand-500)' : 'var(--brand-200)',
              borderRadius: '4px 4px 0 0',
              transition: 'background-color var(--dur-base) var(--ease-emphasis)',
            }}
          />
        ))}
      </div>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [stage, setStage] = useState(-1);            // active section index — drives reveal classes + ribbon visibility
  const [ribbonStage, setRibbonStage] = useState(0); // scroll-driven stage 0…7 — fills the ribbon segments
  const refs = useRef([]);

  // Section-level IntersectionObserver — flips the reveal class on enter and
  // tracks which section is currently in view (drives ribbon visibility).
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number(e.target.dataset.section);
            if (Number.isFinite(i)) setStage(i);
            e.target.classList.add('is-in');
          }
        });
      },
      { threshold: 0.35 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scroll-driven ribbon stage — advances continuously through ALL 8 stages
  // from the end of the hero to the start of the final CTA, so every stage
  // (Post → Complete) is reached even though there are only 6 narrative
  // sections between them.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let raf = 0;
    function recompute() {
      raf = 0;
      const startEl = refs.current[1]; // top of "Lifecycle" section
      const endEl = refs.current[7];   // top of "Final CTA" section
      if (!startEl || !endEl) return;
      const startY = startEl.getBoundingClientRect().top + window.scrollY;
      const endY = endEl.getBoundingClientRect().top + window.scrollY;
      const span = endY - startY;
      if (span <= 0) return;
      const probe = window.scrollY + window.innerHeight * 0.5;
      const frac = Math.max(0, Math.min(1, (probe - startY) / span));
      const idx = Math.min(STAGES.length - 1, Math.floor(frac * STAGES.length));
      setRibbonStage(idx);
    }
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(recompute);
    }
    recompute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', recompute);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recompute);
    };
  }, []);

  // Ribbon attaches once the user has scrolled past the hero (any section ≥ 1)
  // and stays until they reach the final CTA, so all 8 stages get shown.
  const ribbonVisible = stage >= 1 && stage <= 6;

  const setRef = (i) => (el) => { refs.current[i] = el; };

  return (
    <div
      style={{
        background: 'var(--bg-paper)',
        color: 'var(--text-primary)',
        paddingTop: 64,
      }}
    >
      <LifecycleRibbon stage={ribbonStage} visible={ribbonVisible} />

      {/* ── Section 01 · Hero ─────────────────────────────────────────── */}
      <section
        ref={setRef(0)}
        data-section="0"
        className="mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x) 64px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <HeroLeft />
        <div className="hidden md:flex" style={{ justifyContent: 'center' }}>
          <Constellation size={420} />
        </div>
      </section>

      {/* ── Section 02 · Lifecycle ───────────────────────────────────── */}
      <section
        ref={setRef(1)}
        data-section="1"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x)',
        }}
      >
        <span className="t-eyebrow">The lifecycle</span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 4.5vw, 56px)',
            lineHeight: 1,
            letterSpacing: '-0.022em',
            margin: '8px 0 14px',
            fontWeight: 400,
            maxWidth: 720,
          }}
        >
          Eight steps from{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--amber-500)' }}>posted</span> to{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--brand-500)' }}>placed</span>.
        </h2>
        <p className="t-body-lg" style={{ color: 'var(--text-secondary)', maxWidth: 560 }}>
          Each stage gets its own surface in the app. Verification, supervision and assessment are
          threaded through. Nothing happens off-platform.
        </p>
        <div
          style={{
            marginTop: 36,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: 16,
          }}
        >
          {STAGES.map((s, i) => (
            <div
              key={s}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: i < 3 ? 'var(--brand-500)' : 'var(--bg-raised)',
                  color: i < 3 ? '#fff' : 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-2), 0 0 0 1px var(--border-default)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1, textAlign: 'center' }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 03 · Five roles ──────────────────────────────────── */}
      <section
        ref={setRef(2)}
        data-section="2"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x)',
        }}
      >
        <span className="t-eyebrow">One workspace · five roles</span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 4.5vw, 56px)',
            lineHeight: 1,
            letterSpacing: '-0.022em',
            margin: '8px 0 0',
            fontWeight: 400,
            maxWidth: 640,
          }}
        >
          Built for the people who actually run an internship.
        </h2>
        <div
          style={{
            marginTop: 36,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          {[
            { role: 'Student',    Icon: Briefcase,  blurb: 'Discover, apply, do the work.',       tone: 'brand',  offset: 4 },
            { role: 'Company',    Icon: Building2,  blurb: 'Post roles, run placements.',         tone: 'amber',  offset: -4 },
            { role: 'Supervisor', Icon: UserCheck,  blurb: 'Mentor with structure.',              tone: 'sage',   offset: 4 },
            { role: 'University', Icon: Shield,     blurb: 'Verify, vet, oversee.',               tone: 'brand',  offset: -4 },
            { role: 'Admin',      Icon: Settings,   blurb: 'Govern accounts & the audit log.',    tone: 'stone',  offset: 4 },
          ].map(({ role, Icon, blurb, tone, offset }) => (
            <Card
              key={role}
              style={{ padding: 20, transform: `translateY(${offset}px)` }}
            >
              <span
                aria-hidden
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background:
                    tone === 'amber' ? 'var(--amber-100)' :
                    tone === 'sage'  ? 'var(--success-100)' :
                    tone === 'stone' ? 'var(--stone-200)' :
                                       'var(--brand-100)',
                  color:
                    tone === 'amber' ? 'var(--amber-700)' :
                    tone === 'sage'  ? 'var(--success-700)' :
                    tone === 'stone' ? 'var(--stone-700)' :
                                       'var(--brand-700)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} strokeWidth={1.6} />
              </span>
              <div className="t-display-sm" style={{ marginTop: 12 }}>{role}</div>
              <p
                className="t-body-sm"
                style={{ color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}
              >
                {blurb}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Section 04 · For students ────────────────────────────────── */}
      <section
        id="for-students"
        ref={setRef(3)}
        data-section="3"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div>
          <span className="t-eyebrow">For students</span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '8px 0 0',
              fontWeight: 400,
            }}
          >
            Discover. Apply. Place.
          </h3>
          <p
            className="t-body-lg"
            style={{ color: 'var(--text-secondary)', marginTop: 14, maxWidth: 480 }}
          >
            Verified internships from companies your university already trusts. One-click to
            apply. Track every status from a single page.
          </p>
          <div className="flex flex-wrap" style={{ gap: 10, marginTop: 18 }}>
            <Link to="/register">
              <Button variant="ghost" trailing={<ArrowRight size={16} strokeWidth={1.8} />}>
                Browse internships
              </Button>
            </Link>
          </div>
        </div>
        <InternshipCardMock />
      </section>

      {/* ── Section 05 · For companies ──────────────────────────────── */}
      <section
        id="for-companies"
        ref={setRef(4)}
        data-section="4"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <PipelineMock />
        <div>
          <span className="t-eyebrow">For companies &amp; supervisors</span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '8px 0 0',
              fontWeight: 400,
            }}
          >
            Mentor with structure.
          </h3>
          <p
            className="t-body-lg"
            style={{ color: 'var(--text-secondary)', marginTop: 14, maxWidth: 480 }}
          >
            Post the role, review the cohort, place the intern. Assign tasks, grade work, write
            the assessment — every interaction in one thread.
          </p>
          <div className="flex flex-wrap" style={{ gap: 10, marginTop: 18 }}>
            <Link to="/register">
              <Button variant="ghost" trailing={<ArrowRight size={16} strokeWidth={1.8} />}>
                How it works for companies
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 06 · For universities ───────────────────────────── */}
      <section
        id="for-universities"
        ref={setRef(5)}
        data-section="5"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div>
          <span className="t-eyebrow">For universities</span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '8px 0 0',
              fontWeight: 400,
            }}
          >
            Oversee the cohort.
          </h3>
          <p
            className="t-body-lg"
            style={{ color: 'var(--text-secondary)', marginTop: 14, maxWidth: 480 }}
          >
            Verify your students, vet every application before it goes out, see each placement at
            a glance. Export a clean report at the end of every term.
          </p>
        </div>
        <PlacementRateMock />
      </section>

      {/* ── Section 07 · Trust ──────────────────────────────────────── */}
      <section
        ref={setRef(6)}
        data-section="6"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '80px var(--content-pad-x)',
        }}
      >
        <span className="t-eyebrow">Built for trust</span>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: '8px 0 0',
            fontWeight: 400,
            maxWidth: 720,
          }}
        >
          Verification, audit trail, appeals — said plainly.
        </h3>
        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          {[
            {
              Icon: Shield,
              title: 'Verified accounts',
              body: 'Universities verify their students. Admins verify organisations. No one applies in the dark.',
            },
            {
              Icon: ScrollText,
              title: 'Full audit trail',
              body: 'Every status change, every offer, every assessment — written to an immutable log.',
            },
            {
              Icon: Gavel,
              title: 'Fair appeals',
              body: 'A student can appeal any decision through the platform. Universities adjudicate, on the record.',
            },
          ].map(({ Icon, title, body }) => (
            <Card key={title} style={{ padding: 20 }}>
              <Icon size={22} strokeWidth={1.6} />
              <div className="t-display-sm" style={{ marginTop: 14 }}>{title}</div>
              <p
                className="t-body-md"
                style={{ color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}
              >
                {body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Section 08 · Final CTA ──────────────────────────────────── */}
      <section
        ref={setRef(7)}
        data-section="7"
        className="reveal mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: '120px var(--content-pad-x) 140px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            lineHeight: 1,
            letterSpacing: '-0.025em',
            margin: 0,
            fontWeight: 400,
          }}
        >
          Begin your internship,<br />begin your{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--brand-500)' }}>career</span>.
        </h2>
        <div className="flex" style={{ justifyContent: 'center', marginTop: 26 }}>
          <Link to="/register">
            <Button
              variant="primary"
              size="lg"
              pill
              trailing={<ArrowRight size={16} strokeWidth={1.8} />}
            >
              Create your account
            </Button>
          </Link>
        </div>
        <p className="t-caption" style={{ marginTop: 14 }}>
          Free for students &amp; universities. No card required.
        </p>
      </section>
    </div>
  );
}
