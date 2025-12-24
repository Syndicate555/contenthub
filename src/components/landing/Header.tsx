"use client";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/landing";

export const Navbar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div ref={ref} className="w-full fixed top-0 inset-x-0 z-[100] p-4">
      <DesktopNav visible={visible} navItems={navLinks} />
      <MobileNav visible={visible} navItems={navLinks} />
    </motion.div>
  );
};

const Logo = () => {
  return (
    <Link 
      href="/" 
      className="flex items-center gap-2.5 font-bold text-lg text-text-primary group"
      aria-label="Tavlo - Home"
    >
      <motion.span 
        className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-1 to-brand-2 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-1/25"
        whileHover={{ scale: 1.05, rotate: 5 }}
      >
        T
      </motion.span>
      <span className="bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text">
        Tavlo
      </span>
    </Link>
  );
};

interface NavbarProps {
  navItems: {
    label: string;
    href: string;
  }[];
  visible: boolean;
}

const DesktopNav = ({ navItems, visible }: NavbarProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <motion.div
      onMouseLeave={() => {
        setHovered(null);
      }}
      initial={{
        width: "1000px", // Initial modest size
        y: 0,
        x: "-50%",
        top: 0,
        borderRadius: "2rem",
        backgroundColor: "rgba(255, 255, 255, 0.0)",
        backdropFilter: "none",
        boxShadow: "none",
      }}
      animate={{
        width: visible ? "850px" : "1000px", // Shrinks to a smaller size when visible
        y: visible ? 16 : 0,
        x: "-50%",
        top: visible ? 16 : 0,
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        backgroundColor: visible ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.0)",
        borderRadius: visible ? "1rem" : "2rem",
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 30,
      }}
      className={cn(
        "hidden lg:flex flex-row items-center justify-between py-2 px-4 fixed z-[60] left-1/2" 
      )}
    >
      <Logo />
      <motion.div className="lg:flex flex-row flex-1 hidden items-center justify-center space-x-2 lg:space-x-2 text-sm text-zinc-600 font-medium hover:text-zinc-800 transition duration-200">
        {navItems.map((navItem, idx: number) => (
          <button
            key={`link=${idx}`}
            onClick={() => scrollToSection(navItem.href)}
            onMouseEnter={() => setHovered(idx)}
            className="text-neutral-600 relative px-4 py-2"
          >
            {hovered === idx && (
              <motion.div
                layoutId="hovered"
                className="w-full h-full absolute inset-0 bg-gray-100 rounded-full"
              />
            )}
            <span className="relative z-20">{navItem.label}</span>
          </button>
        ))}
      </motion.div>
      <div className="flex items-center gap-4">
        <Link href="/sign-in">
          <Button variant="ghost" className="hidden md:block text-text-secondary hover:text-brand-1">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-in">
          <Button
            className="hidden md:flex bg-gradient-to-r from-brand-1 to-brand-2 text-white hover:shadow-lg hover:shadow-brand-1/20 rounded-full"
          >
            Try for free
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

const MobileNav = ({ navItems, visible }: NavbarProps) => {
  const [open, setOpen] = useState(false);

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{
          width: "calc(100% - 2rem)",
          y: 0,
          x: "-50%",
          left: "50%",
          top: 0,
          borderRadius: "2rem",
          backgroundColor: "rgba(255, 255, 255, 0.0)",
          backdropFilter: "none",
          boxShadow: "none",
        }}
        animate={{
          width: (visible && !open) ? "calc(90% - 2rem)" : "calc(100% - 2rem)",
          y: visible ? 16 : 0,
          x: "-50%",
          left: "50%",
          top: visible ? 16 : 0,
          backdropFilter: (visible || open) ? "blur(10px)" : "none",
          boxShadow: (visible || open)
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
            : "none",
          backgroundColor: (visible || open) ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.0)",
          borderRadius: open ? "1rem" : (visible ? "1rem" : "2rem"),
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 30,
        }}
        className={cn(
          "flex relative flex-col lg:hidden justify-between items-center bg-transparent fixed z-[101]",
          "rounded-2xl"
        )}
      >
        <div className="flex flex-row justify-between items-center w-full px-4 py-2">
          <Logo />
          {open ? (
            <X
              className="text-black"
              onClick={() => setOpen(!open)}
            />
          ) : (
            <Menu
              className="text-black"
              onClick={() => setOpen(!open)}
            />
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex bg-white inset-x-0 z-50 flex-col items-start justify-start gap-4 w-full px-4 py-8 shadow-xl rounded-b-2xl overflow-hidden"
            >
              {navItems.map((navItem, idx: number) => (
                <button
                  key={`link=${idx}`}
                  onClick={() => scrollToSection(navItem.href)}
                  className="relative text-neutral-600 w-full text-left py-2 font-medium"
                >
                  <motion.span className="block">{navItem.label}</motion.span>
                </button>
              ))}
              <Link href="/sign-in" className="w-full">
                <Button
                  variant="outline"
                  className="block md:hidden w-full"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full">
                <Button
                  variant="default"
                  className="block md:hidden w-full bg-gradient-to-r from-brand-1 to-brand-2"
                >
                  Try for free
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default Navbar;
