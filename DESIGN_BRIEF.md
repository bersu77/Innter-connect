# Design Brief — InternConnect (visual & interaction redesign)

> Paste everything below the line into your design AI ("Claude design"). It is a
> self-contained prompt: it explains the product, the current build, every page,
> and the exact aesthetic direction to pursue.

---

## ROLE

You are a senior product designer with a strong point of view, in the lineage of
Apple's Human Interface team. You are redesigning the **visual language and
interaction design** of an existing, fully-built web application called
**InternConnect**. The app already works end to end — you are *not* re-architecting
features or flows; you are giving it a cohesive, beautiful, considered new skin and
motion system. Treat this as art direction + a design system, not a rebuild.

## THE PRODUCT

InternConnect is an **Internship Management System** — a final-year university
project for Addis Ababa University. It is a web app that runs the full internship
lifecycle and connects five kinds of people:

- **Students** — build a profile, browse internships, apply, do supervised tasks,
  receive assessments, submit a final report.
- **Company managers** — post internships, review applications, run placements,
  create supervisor accounts.
- **Supervisors** — company users who mentor interns: assign & grade tasks, chat
  with students, write performance assessments.
- **University coordinators** — verify students, vet the applications their
  students send out, oversee placements, invite partner companies.
- **Administrators** — govern accounts, verify organisations, review the audit log.

The lifecycle the UI must tell a story around: **post → discover → apply → verify
→ review & offer → placement → supervised tasks & assessment → completion & final
report**, with verification, appeals, messaging, and analytics threaded through.

The audience skews young (university students) and institutional (companies,
universities). The product should feel **trustworthy and calm**, but also
**modern and inviting** — not enterprise-drab.

## CURRENT TECHNICAL SUBSTRATE (your design must be buildable on this)

- **React + Vite + Tailwind CSS.** Express your decisions as **design tokens that
  map cleanly to a Tailwind theme config** (colors with 50–900 scales, spacing,
  radii, shadows, font sizes, easing/duration).
- A small **component-primitive library** already exists and is reused everywhere —
  redesign these, don't replace the set:
  `Button` (variants: primary / secondary / ghost / danger; sizes sm / md / lg),
  `Card`, `Input`, `Select`, `Textarea`, `Badge` (tones: neutral / brand /
  success / warning / danger), `Spinner`, plus a `FilterBar` (search + dropdowns).
- **Charts** are rendered with `recharts` (bar + pie) on report pages.
- **Dark mode already exists** (class-based) and must remain first-class — every
  decision needs a light *and* a dark value.
- Current look (what you are replacing): Inter typeface, a single blue accent
  (#2563eb), slate-grey neutrals, `rounded-xl` corners, very soft shadows,
  glassmorphism (backdrop-blur) on the app shell. It is clean but generic and
  mono-accent. Keep what is genuinely good (softness, roundedness, the glass
  shell) and elevate the rest.

## THE STRUCTURE — every "part" you must design for

**1. Public / marketing**
- **Landing page** — the front door (see the dedicated brief below).
- **Login** and **Register** pages. Register has a role tab switcher
  (student / university / company).

**2. The app shell** (shared by every signed-in page)
- A left **sidebar** with role-specific navigation.
- A top **header**: the organisation name + "… workspace" label, a light/dark
  theme toggle, a notifications bell, and the user avatar.
- A mobile drawer version of the sidebar.

**3. Role dashboards & their pages** (navigation differs per role)
- **Student:** Dashboard home, Browse Internships, My Applications, Placements,
  Tasks, Assessments, Messages, Appeals, My Profile, Account.
- **Company manager:** Dashboard, My Internships, Applications, Placements,
  Supervisors, Invitations, Reports, Appeals, Company Profile, Account; plus
  Post-Internship and Internship-Detail pages.
- **Supervisor:** Dashboard, My Interns, Tasks, Assessments, Messages, Account.
- **University:** Dashboard, Student Verification, Application Verification,
  Placements, Partner Companies, Reports, Appeals, University Profile, Account.
- **Admin:** Dashboard, Users, Organisation Verification, Appeals, Audit Log,
  Reports, Account.

**4. The recurring page archetypes** (design each archetype once, beautifully)
- **Dashboard home** — a greeting + a grid of summary stat cards + recent activity.
- **Card-list pages** — a search/filter bar, then a vertical list or grid of cards
  (internships, applications, placements, tasks, assessments, invitations, appeals).
- **Data-table pages** — admin/university management views (users, verification,
  audit log, student lists).
- **Detail page** — a single internship with full info + an apply action.
- **Forms** — multi-field profile forms, the post-internship form, task creation.
- **Messaging** — a two-party chat thread (student ↔ supervisor).
- **Reports & analytics** — summary stat cards + interactive bar/pie charts +
  a data table + export buttons.
- **Empty, loading, and error states** for all of the above.
- **Status & verification surfaces** — lots of small status pills, progress ticks,
  appeal panels, verification gates.

## THE DESIGN DIRECTION I WANT

Pursue **Apple-grade simplicity** — calm, confident, content-first. The brief, in
the client's words, with how to interpret each point:

**1. Apple-like, simple.**
Restraint over decoration. Generous whitespace. A strong, quiet typographic
hierarchy does the heavy lifting. Depth comes from **soft layering — light
shadows, subtle blur, gentle elevation — not from borders or boxes**. Precise
optical alignment to a consistent grid. Very few colours on screen at once.
Nothing ornamental that doesn't help the user. The feeling: premium, effortless,
unhurried.

**2. A *gravitating* landing page.**
It must pull the visitor in and not let go. A hero that lands instantly — one
bold, concise promise, huge negative space, a single focal visual. Then a
**scroll-choreographed story**: as the visitor scrolls, the internship lifecycle
and the five roles reveal themselves with motion that feels *inevitable* — content
easing into place, gentle parallax/float, depth between layers. Build desire,
then resolve to one clear call to action. A student should reach the bottom and
want to sign up. Premium, magnetic, never busy.

**3. A low-contrast, harmonious colour scheme.**
Soft, not harsh. **No pure `#000` on pure `#fff`** — use a warm or cool off-white
and a soft near-black. Desaturated, muted tones throughout. Build harmony using
the colour wheel: pick a primary and a **complementary secondary (roughly opposite
on the wheel)**, but desaturate *both* so they sit together calmly rather than
fighting — complementary in hue, harmonised in saturation/brightness. Fold the
status colours (success / warning / danger) into the same muted family so a green
or red never jars. Deliver the full palette for **light and dark**. Important
caveat: "low contrast" is an *aesthetic*, not an excuse — body text and
interactive labels must still pass **WCAG AA**. Aim for Apple's trick: surfaces
and chrome are low-contrast and soft; text remains crisply legible.

**4. Smooth, pixel-perfect animation like Apple.**
Define a real **motion system**, don't sprinkle transitions. Specify easing curves
(Apple-style cubic-béziers — soft, slightly springy, decisive), a small set of
duration tokens (≈120–250ms for UI feedback, longer and choreographed for
scroll/page transitions), and **choreography rules** (stagger, parent-then-child,
enter/exit). Every interactive element gets considered hover / press / focus
micro-interactions. Scroll-driven reveals on the landing page. Page/route
transitions that feel continuous. Absolutely no jank, no layout shift, 60fps,
and honour `prefers-reduced-motion`. "Pixel-perfect" = a strict spacing grid,
optical (not just mathematical) alignment, crispness at every screen density.

## WHAT TO DELIVER

Produce a complete, decisive design specification:

1. **Design principles** — 3–5 short principles that govern every later choice.
2. **Colour system** — light + dark. Give hex values on 50–900 scales for: page
   background, raised surface, the text scale, the primary accent, the
   complementary secondary, and muted success/warning/danger. Name the tokens.
   Briefly explain the colour-wheel harmony you used.
3. **Typography** — typeface(s), the type scale (sizes / weights / line-heights /
   tracking), and where each step is used.
4. **Layout & space** — the grid, a spacing scale, corner radii, an elevation /
   shadow scale, and blur values.
5. **Motion system** — named easing curves (with cubic-bézier values), duration
   tokens, choreography rules, and a catalogue of the standard micro-interactions.
6. **Component direction** — how each primitive should look and behave in every
   state: Button (all variants), Card, Input, Select, Textarea, Badge, Spinner,
   FilterBar, nav items, tables, and the recharts charts (give them themed colours
   for light and dark).
7. **The app shell** — sidebar + header treatment, including the mobile drawer.
8. **Page-by-page art direction** — cover every archetype in section 4 above, and
   give the **landing page the most depth**: section-by-section, with the scroll
   choreography described.
9. **Dark mode** — how the system translates; what changes beyond inverting.
10. **States** — the empty, loading, and error treatments.

## CONSTRAINTS

- **Buildable in Tailwind** — everything should reduce to theme tokens + utility
  classes; avoid effects that need heavy custom JS.
- **Keep the component set and page flows** — this is a reskin + motion system,
  not a feature redesign.
- **Accessibility** — AA contrast for text, always-visible focus states,
  reduced-motion fallback, hit targets ≥ 40px.
- **Responsive** — mobile-first up to wide desktop; the sidebar collapses to a
  drawer.
- **Dark mode is not an afterthought** — every token and component needs both.

## HOW TO RESPOND

Work top-down: principles → colour & type → the rest of the system → the app
shell → the pages, landing last and longest. Be **concrete and decisive** — real
hex codes, px/rem, ms, cubic-bézier values, token names — not vague adjectives.
For each significant choice add one line of *why*, so it is defensible. Where it
helps, include Tailwind `theme.extend` snippets and simple ASCII/markdown
wireframes. If you must assume something, state the assumption and continue —
deliver one strong, coherent direction rather than a menu of options.
