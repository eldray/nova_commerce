import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SparklesIcon, ShieldCheckIcon, RocketLaunchIcon, ChartBarIcon, DevicePhoneMobileIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import './landing.module.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: SparklesIcon,
      title: 'Beautiful Storefronts',
      description: 'Create stunning, mobile-first online stores that convert visitors into customers.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with tenant isolation and encrypted data storage.'
    },
    {
      icon: CreditCardIcon,
      title: 'Local Payments',
      description: 'Accept Mobile Money, Paystack, Hubtel and other African payment methods.'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile Optimized',
      description: 'Perfect shopping experience on any device, anywhere in Ghana.'
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      description: 'Track sales, customers, and trends with beautiful, actionable dashboards.'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Launch in Minutes',
      description: 'From signup to live store in under 10 minutes with our guided setup wizard.'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '< 2s', label: 'Page Load Time' },
    { value: '24/7', label: 'Customer Support' },
    { value: '0%', label: 'Transaction Fees' }
  ];

  const testimonials = [
    {
      quote: "Nova Commerce transformed how we sell online. Our sales increased by 300% in just 3 months!",
      author: "Ama Mensah",
      role: "Founder, Accra Fashion Hub",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    {
      quote: "The Mobile Money integration is seamless. Our customers love how easy it is to pay.",
      author: "Kwame Osei",
      role: "CEO, Kumasi Electronics",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      quote: "Finally, an e-commerce platform built for African businesses. Highly recommended!",
      author: "Fatima Ibrahim",
      role: "Owner, Northern Crafts",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">Nova Commerce</span>
          </Link>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </div>
          <div className="nav-actions">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <SparklesIcon className="badge-icon" />
            <span>#1 E-commerce Platform in Ghana</span>
          </div>
          <h1 className="hero-title">
            Build Your Online Store
            <span className="highlight"> in Minutes</span>
          </h1>
          <p className="hero-subtitle">
            The all-in-one platform for Ghanaian businesses. Accept Mobile Money, 
            manage inventory, and grow your sales with beautiful, fast storefronts.
          </p>
          <div className="hero-cta">
            <Link to="/register">
              <Button variant="primary" size="large" className="cta-button">
                Start Your Free Trial
                <RocketLaunchIcon className="button-icon" />
              </Button>
            </Link>
            <p className="trial-info">No credit card required • 14-day free trial</p>
          </div>
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop" 
            alt="E-commerce Dashboard"
            className="hero-img"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Sell Online</h2>
          <p className="section-subtitle">
            Powerful features designed for modern African businesses
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <Card key={index} className="feature-card">
              <div className="feature-icon-wrapper">
                <feature.icon className="feature-icon" />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">Launch Your Store in 3 Simple Steps</h2>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Your Account</h3>
            <p>Sign up in seconds and complete your business profile</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Customize Your Store</h3>
            <p>Add products, set up payments, and configure delivery</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Start Selling</h3>
            <p>Publish your store and accept orders immediately</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">Trusted by Ghanaian Businesses</h2>
          <p className="section-subtitle">See what our merchants are saying</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
              </div>
              <div className="testimonial-author">
                <img src={testimonial.image} alt={testimonial.author} className="author-avatar" />
                <div className="author-info">
                  <div className="author-name">{testimonial.author}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Grow Your Business?</h2>
          <p className="cta-subtitle">
            Join hundreds of Ghanaian businesses already selling with Nova Commerce
          </p>
          <div className="cta-buttons">
            <Link to="/register">
              <Button variant="primary" size="large">
                Start Your Free Trial
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="secondary" size="large">
                View Demo Store
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">Nova Commerce</span>
            <p className="footer-tagline">Empowering African businesses to sell online</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="/demo">Demo</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Help Center</a>
              <a href="#">Blog</a>
              <a href="#">API Docs</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Nova Commerce. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
