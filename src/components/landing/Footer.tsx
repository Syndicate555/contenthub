import React from 'react';
import { Twitter, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';
import { navLinks } from '@/data/landing';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="py-12 px-4 border-t border-border-light bg-surface-solid/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 font-bold text-xl text-text-primary"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-1 to-brand-2 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-1/20">
                T
              </span>
              Tavlo
            </Link>
            <p className="text-sm text-text-secondary max-w-xs">
              Turn saved posts into knowledge you actually reuse.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap gap-6">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm text-text-secondary hover:text-brand-1 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <a 
              href="#" 
              className="text-sm text-text-secondary hover:text-brand-1 transition-colors"
            >
              Privacy
            </a>
            <a 
              href="#" 
              className="text-sm text-text-secondary hover:text-brand-1 transition-colors"
            >
              Terms
            </a>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            <a 
              href="#" 
              className="w-10 h-10 rounded-full border border-border-light bg-surface-solid flex items-center justify-center text-text-secondary hover:text-brand-1 hover:border-brand-1/30 hover:shadow-lg hover:shadow-brand-1/10 transition-all"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full border border-border-light bg-surface-solid flex items-center justify-center text-text-secondary hover:text-brand-1 hover:border-brand-1/30 hover:shadow-lg hover:shadow-brand-1/10 transition-all"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full border border-border-light bg-surface-solid flex items-center justify-center text-text-secondary hover:text-brand-1 hover:border-brand-1/30 hover:shadow-lg hover:shadow-brand-1/10 transition-all"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © {currentYear} Tavlo. All rights reserved.
          </p>
          <p className="text-sm text-text-muted">
            Made with care for knowledge workers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
