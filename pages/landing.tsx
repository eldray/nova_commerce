import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Sparkles, ShieldCheck, Rocket, BarChart3, Smartphone, CreditCard } from 'lucide-react';
import styles from './landing.module.css';

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
      icon: Sparkles,
      title: 'Beautiful Storefronts',
      description: 'Create stunning, mobile-first online stores that convert visitors into customers.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with tenant isolation and encrypted data storage.'
    },
    {
      icon: CreditCard,
      title: 'Local Payments',
      description: 'Accept Mobile Money, Paystack, Hubtel and other African payment methods.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Perfect shopping experience on any device, anywhere in Ghana.'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track sales, customers, and trends with beautiful, actionable dashboards.'
    },
    {
      icon: Rocket,
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
    <div className={styles['landing-page']}>
      {/* Navigation */}
      <nav className={`${styles['landing-nav']} ${isScrolled ? styles['scrolled'] : ''}`}>
        <div className={styles['nav-container']}>
          <Link to="/" className={styles['nav-logo']}>
            <span className={styles['logo-icon']}>🛍️</span>
            <span className={styles['logo-text']}>Nova Commerce</span>
          </Link>
          <div className={styles['nav-links']}>
            <a href="#features" className={styles['nav-link']}>Features</a>
            <a href="#testimonials" className={styles['nav-link']}>Testimonials</a>
            <a href="#pricing" className={styles['nav-link']}>Pricing</a>
          </div>
          <div className={styles['nav-actions']}>
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
      <section className={styles['hero-section']}>
        <div className={styles['hero-content']}>
          <div className={styles['hero-badge']}>
            <Sparkles className={styles['badge-icon']} />
            <span>#1 E-commerce Platform in Ghana</span>
          </div>
          <h1 className={styles['hero-title']}>
            Build Your Online Store
            <span className={styles['highlight']}> or Shop Amazing Products</span>
          </h1>
          <p className={styles['hero-subtitle']}>
            Whether you're a business ready to sell online or a customer looking for unique Ghanaian products, 
            Nova Commerce connects you. Accept Mobile Money, manage inventory, and grow your sales with beautiful, fast storefronts.
          </p>
          <div className={styles['hero-buttons']}>
            <Link to="/register?type=merchant">
              <Button variant="primary" size="large" className={styles['cta-button']}>
                Start Selling Today
                <Rocket className={styles['button-icon']} />
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="secondary" size="large" className={styles['cta-button-secondary']}>
                Browse Stores & Shop
                <Sparkles className={styles['button-icon']} />
              </Button>
            </Link>
          </div>
          <p className={styles['trial-info']}>No credit card required • 14-day free trial for merchants • Free shopping for customers</p>
          <div className={styles['hero-stats']}>
            {stats.map((stat, index) => (
              <div key={index} className={styles['stat-item']}>
                <div className={styles['stat-value']}>{stat.value}</div>
                <div className={styles['stat-label']}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles['hero-image']}>
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop" 
            alt="E-commerce Dashboard"
            className={styles['hero-img']}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles['features-section']}>
        <div className={styles['section-header']}>
          <h2 className={styles['section-title']}>Everything You Need to Sell Online</h2>
          <p className={styles['section-subtitle']}>
            Powerful features designed for modern African businesses
          </p>
        </div>
        <div className={styles['features-grid']}>
          {features.map((feature, index) => (
            <Card key={index} className={styles['feature-card']}>
              <div className={styles['feature-icon-wrapper']}>
                <feature.icon className={styles['feature-icon']} />
              </div>
              <h3 className={styles['feature-title']}>{feature.title}</h3>
              <p className={styles['feature-description']}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={styles['how-it-works']}>
        <div className={styles['section-header']}>
          <h2 className={styles['section-title']}>Launch Your Store in 3 Simple Steps</h2>
        </div>
        <div className={styles['steps-container']}>
          <div className={styles['step']}>
            <div className={styles['step-number']}>1</div>
            <h3>Create Your Account</h3>
            <p>Sign up in seconds and complete your business profile</p>
          </div>
          <div className={styles['step-divider']}></div>
          <div className={styles['step']}>
            <div className={styles['step-number']}>2</div>
            <h3>Customize Your Store</h3>
            <p>Add products, set up payments, and configure delivery</p>
          </div>
          <div className={styles['step-divider']}></div>
          <div className={styles['step']}>
            <div className={styles['step-number']}>3</div>
            <h3>Start Selling</h3>
            <p>Publish your store and accept orders immediately</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={styles['testimonials-section']}>
        <div className={styles['section-header']}>
          <h2 className={styles['section-title']}>Trusted by Ghanaian Businesses</h2>
          <p className={styles['section-subtitle']}>See what our merchants are saying</p>
        </div>
        <div className={styles['testimonials-grid']}>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className={styles['testimonial-card']}>
              <div className={styles['testimonial-content']}>
                <div className={styles['quote-mark']}>"</div>
                <p className={styles['testimonial-quote']}>{testimonial.quote}</p>
              </div>
              <div className={styles['testimonial-author']}>
                <img src={testimonial.image} alt={testimonial.author} className={styles['author-avatar']} />
                <div className={styles['author-info']}>
                  <div className={styles['author-name']}>{testimonial.author}</div>
                  <div className={styles['author-role']}>{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-content']}>
          <h2 className={styles['cta-title']}>Ready to Get Started?</h2>
          <p className={styles['cta-subtitle']}>
            Join hundreds of Ghanaian businesses already selling with Nova Commerce, or discover amazing products from local stores
          </p>
          <div className={styles['hero-buttons']}>
            <Link to="/register?type=merchant">
              <Button variant="primary" size="large">
                Start Selling Now
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="secondary" size="large">
                Shop as Customer
              </Button>
            </Link>
            <Link to="/customer-home">
              <Button variant="outline" size="large">
                View Customer Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles['landing-footer']}>
        <div className={styles['footer-container']}>
          <div className={styles['footer-brand']}>
            <span className={styles['logo-icon']}>🛍️</span>
            <span className={styles['logo-text']}>Nova Commerce</span>
            <p className={styles['footer-tagline']}>Empowering African businesses to sell online</p>
          </div>
          <div className={styles['footer-links']}>
            <div className={styles['footer-column']}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="/demo">Demo</a>
            </div>
            <div className={styles['footer-column']}>
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>
            <div className={styles['footer-column']}>
              <h4>Resources</h4>
              <a href="#">Help Center</a>
              <a href="#">Blog</a>
              <a href="#">API Docs</a>
            </div>
          </div>
        </div>
        <div className={styles['footer-bottom']}>
          <p>&copy; 2024 Nova Commerce. All rights reserved.</p>
          <div className={styles['footer-legal']}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
