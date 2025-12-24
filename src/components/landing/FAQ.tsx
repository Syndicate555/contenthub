import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/landing";
import { CSSReveal } from "@/components/motion";

const FAQ = () => {
  return (
    <section id="faq" className="py-20 md:py-28 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <CSSReveal>
            <span className="inline-flex items-center gap-2 badge-brand mb-4">
              FAQ
            </span>
          </CSSReveal>
          <CSSReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              Questions?{" "}
              <span className="bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent">
                Answers.
              </span>
            </h2>
          </CSSReveal>
          <CSSReveal delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything you need to know about Tavlo.
            </p>
          </CSSReveal>
        </div>

        {/* FAQ Accordion */}
        <CSSReveal delay={0.3}>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-surface-solid rounded-xl border border-border-light px-6 data-[state=open]:shadow-lg data-[state=open]:shadow-brand-1/5 data-[state=open]:border-brand-1/20 transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-text-primary py-5 hover:no-underline hover:text-brand-1 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-text-secondary leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CSSReveal>
      </div>
    </section>
  );
};

export default FAQ;
