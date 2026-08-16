import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Store,
  CreditCard,
  Package,
  MapPin,
  BarChart3,
  Users2,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { Button } from "../components/Button";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import { useAuth } from "../helpers/useAuth";
import styles from "./_index.module.css";

const NAV_LINKS = [
  { label: "Features", to: "#features" },
  { label: "How it works", to: "#how-it-works" },
  { label: "Pricing", to: "#pricing" },
];

const features = [
  {
    icon: Store,
    title: "Store builder",
    description:
      "Launch a fully branded storefront without writing code. Pick a theme, add your logo and colors, and go live in minutes.",
  },
  {
    icon: Package,
    title: "Product & inventory",
    description:
      "Manage products, variants, categories and stock levels from one dashboard, with low-stock alerts built in.",
  },
  {
    icon: CreditCard,
    title: "Ghana payments",
    description:
      "Accept Mobile Money and card payments through Paystack and Hubtel — built for the way Ghanaians actually pay.",
  },
  {
    icon: MapPin,
    title: "Delivery zones",
    description:
      "Set delivery fees and timelines by zone, from Accra and Kumasi to nationwide shipping and pickup.",
  },
  {
    icon: BarChart3,
    title: "Analytics dashboard",
    description:
      "Track revenue, orders and top products with real-time charts and date-range filters.",
  },
  {
    icon: Users2,
    title: "Staff & roles",
    description:
      "Invite your team with granular permissions for sales, inventory, support and more.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Register your business in under a minute — no credit card required.",
  },
  {
    number: "02",
    title: "Set up your store",
    description:
      "Add your branding, connect payments, set delivery zones and list your first product through our guided wizard.",
  },
  {
    number: "03",
    title: "Start selling",
    description:
      "Publish your storefront and start accepting orders from customers across Ghana.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For new businesses testing the waters.",
    features: ["Up to 25 products", "1 staff account", "MoMo & card payments", "Community support"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "GH₵150",
    period: "/month",
    description: "For growing stores ready to scale up.",
    features: [
      "Unlimited products",
      "Coupons & reviews",
      "Up to 10 staff accounts",
      "Priority support",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Business",
    price: "GH₵350",
    period: "/month",
    description: "For established brands with custom needs.",
    features: [
      "Custom domain",
      "Advanced analytics",
      "Unlimited staff accounts",
      "Dedicated support",
    ],
    cta: "Get started",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Abena K.",
    role: "Founder, Abena's Wardrobe — Accra",
    quote:
      "I had a working storefront the same afternoon I signed up. Setting up Mobile Money payments took five minutes.",
  },
  {
    name: "Kwame O.",
    role: "Owner, KO Electronics — Kumasi",
    quote:
      "The delivery zone setup meant I could finally charge fair rates outside Kumasi instead of guessing.",
  },
  {
    name: "Efua D.",
    role: "Founder, Efua Naturals — Takoradi",
    quote:
      "The dashboard tells me exactly what's selling. I stopped restocking products nobody wanted.",
  },
];

export default function IndexPage() {
  const { authState } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isAuthenticated = authState.type === "authenticated";

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Nova Commerce — Launch your online store in Ghana</title>
        <meta
          name="description"
          content="Nova Commerce is the all-in-one platform for Ghanaian businesses to launch an online store, accept Mobile Money and card payments, and manage orders and delivery."
        />
      </Helmet>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            Nova Commerce
          </Link>

          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <a key={link.to} href={link.to} className={styles.navLink}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <ThemeModeSwitch />
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className={styles.desktopOnly}>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
            <button
              className={styles.menuButton}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className={styles.mobileNav}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className={styles.mobileNavLink}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link to="/login" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
                Log in
              </Link>
            )}
          </nav>
        )}
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Built for Ghanaian businesses</span>
            <h1 className={styles.heroTitle}>Launch your online store in minutes.</h1>
            <p className={styles.heroSubtitle}>
              Nova Commerce gives you a branded storefront, Mobile Money & card payments,
              inventory, delivery zones and analytics — all in one platform, set up in an
              afternoon.
            </p>
            <div className={styles.heroActions}>
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">
                    Go to dashboard <ArrowRight size={18} />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/register">
                      Start selling free <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/login">Log in</Link>
                  </Button>
                </>
              )}
            </div>
            <p className={styles.heroNote}>No credit card required to get started.</p>
          </div>
          <div className={styles.heroImageWrap}>
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80"
              alt="Ghanaian small business owner managing an online store"
              className={styles.heroImage}
            />
          </div>
        </section>

        <section id="features" className={styles.section}>
          <div className={styles.sectionIntro}>
            <h2 className={styles.sectionTitle}>Everything you need to sell online</h2>
            <p className={styles.sectionSubtitle}>
              One platform for your storefront, payments, inventory and delivery.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <feature.icon size={22} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className={styles.stepsSection}>
          <div className={styles.sectionIntro}>
            <h2 className={styles.sectionTitle}>Up and running in three steps</h2>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.number} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.section}>
          <div className={styles.sectionIntro}>
            <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
            <p className={styles.sectionSubtitle}>
              Start free. Upgrade as your store grows.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingCardHighlighted : ""}`}
              >
                {plan.highlighted && <span className={styles.pricingBadge}>Most popular</span>}
                <h3 className={styles.pricingName}>{plan.name}</h3>
                <div className={styles.pricingPrice}>
                  {plan.price}
                  {plan.period && <span className={styles.pricingPeriod}>{plan.period}</span>}
                </div>
                <p className={styles.pricingDescription}>{plan.description}</p>
                <ul className={styles.pricingFeatures}>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <CheckCircle2 size={16} /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant={plan.highlighted ? "primary" : "outline"}
                  className={styles.pricingCta}
                  asChild
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <h2 className={styles.sectionTitle}>Trusted by Ghanaian merchants</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t) => (
              <div key={t.name} className={styles.testimonialCard}>
                <p className={styles.testimonialQuote}>"{t.quote}"</p>
                <span className={styles.testimonialAuthor}>{t.name}</span>
                <span className={styles.testimonialRole}>{t.role}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.banner}>
          <div className={styles.bannerContent}>
            <h2 className={styles.bannerTitle}>Ready to launch your store?</h2>
            <p className={styles.bannerSubtitle}>
              Join Ghanaian businesses already selling on Nova Commerce.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Go to dashboard" : "Start selling free"}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>Nova Commerce</span>
          <nav className={styles.footerNav}>
            <a href="#features" className={styles.footerLink}>Features</a>
            <a href="#pricing" className={styles.footerLink}>Pricing</a>
            <Link to="/login" className={styles.footerLink}>Log in</Link>
            <Link to="/register" className={styles.footerLink}>Sign up</Link>
          </nav>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} Nova Commerce. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
