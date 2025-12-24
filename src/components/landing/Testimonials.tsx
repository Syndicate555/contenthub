import React, { useRef } from "react";
import { Quote } from "lucide-react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { testimonials } from "@/data/landing";
import { CSSReveal } from "@/components/motion";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const TestimonialCard = ({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--mouse-x", `${x}%`);
    cardRef.current.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              y: -4,
              transition: { duration: 0.2 },
            }
      }
      className="group relative"
      onMouseMove={handleMouseMove}
    >
      {/* Gradient border effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-brand-1/20 via-brand-3/10 to-brand-2/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

      <div className="relative bg-surface-solid rounded-2xl p-6 border border-border-light group-hover:border-transparent transition-all duration-300 h-full overflow-hidden">
        {/* Spotlight effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(91, 91, 255, 0.03), transparent 40%)`,
          }}
        />

        {/* Inner glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] pointer-events-none" />

        <Quote className="w-8 h-8 text-brand-1/20 mb-4 group-hover:text-brand-1/40 transition-colors" />
        <p className="text-text-body leading-relaxed mb-6 relative z-10">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3 relative z-10">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-1/20 via-brand-3/20 to-brand-2/20 flex items-center justify-center text-brand-1 font-semibold border border-brand-1/10"
            whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          >
            {testimonial.author.charAt(0)}
          </motion.div>
          <div>
            <p className="font-semibold text-text-primary text-sm">
              {testimonial.author}
            </p>
            <p className="text-text-secondary text-sm">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Testimonials = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section className="py-20 md:py-28 px-4 relative" ref={sectionRef}>
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-1/[0.02] via-transparent to-brand-2/[0.02]" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <CSSReveal>
            <span className="inline-flex items-center gap-2 badge-brand mb-4">
              Testimonials
            </span>
          </CSSReveal>
          <CSSReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              Loved by{" "}
              <motion.span
                className="bg-gradient-to-r from-brand-3 to-brand-1 bg-clip-text text-transparent inline-block"
                initial={{ filter: "blur(10px)", opacity: 0 }}
                animate={isInView ? { filter: "blur(0px)", opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                early users
              </motion.span>
            </h2>
          </CSSReveal>
          <CSSReveal delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Here&apos;s what people are saying about Tavlo.
            </p>
          </CSSReveal>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Section divider */}
      <motion.div
        className="section-divider max-w-4xl mx-auto mt-20"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
    </section>
  );
};

export default Testimonials;
