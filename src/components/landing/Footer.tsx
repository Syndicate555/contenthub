"use client";

import React from "react";
import { Twitter, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import { navLinks } from "@/data/landing";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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
              aria-label="Tavlo - Return to homepage"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-1 to-brand-2 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-1/20">
                T
              </span>
              Tavlo
            </Link>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
                className="text-sm text-text-secondary hover:text-brand-1 transition-colors min-h-[44px] flex items-center"
                aria-label={`Navigate to ${link.label} section`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Socials */}
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
