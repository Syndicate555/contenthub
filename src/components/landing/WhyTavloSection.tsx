"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
 

const WhyTavloSection = () => {
  const prefersReducedMotion = useReducedMotion();

  const fadeInUp = prefersReducedMotion ? {} : { opacity: 0, y: 20 };

  return (
    <section
      id="why-tavlo"
      className="relative py-16 md:py-24 px-4 overflow-hidden"
      aria-labelledby="why-tavlo-heading"
    >
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand-1/[0.03] to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start">
          <motion.figure
            initial={fadeInUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="order-1 md:order-2"
          >
            <div className="relative max-w-md lg:max-w-lg mx-auto rounded-3xl bg-surface-solid/80 border border-border-light shadow-2xl shadow-black/10 overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dggvt0gzu/image/upload/v1766746119/ChatGPT_Image_Dec_26_2025_05_17_15_AM_ctjn79.png"
                alt="Infographic illustrating content overload from saved posts across platforms."
                width={1024}
                height={1536}
                sizes="(max-width: 768px) 100vw, 48vw"
                className="w-full h-auto"
                quality={95}
              />
            </div>
            <figcaption className="sr-only">
              Infographic showing content overload and why saved posts get lost.
            </figcaption>
          </motion.figure>

          <div className="order-2 md:order-1">
            <motion.div
              initial={fadeInUp}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2
                id="why-tavlo-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight"
              >
                Why{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-1 to-brand-2">
                  Tavlo
                </span>
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Stop losing great ideas to the algorithm. Build a feed you
                actually come back to.
              </p>
            </motion.div>

            <motion.div
              initial={fadeInUp}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 space-y-4 text-text-secondary text-base leading-relaxed"
            >
              <p>
                Social media is an endless firehose. Every day there are more
                threads, clips, carousels, and hot takes than anyone can
                process, and the best ideas still slip through the cracks. You
                might like something, save it, even tell yourself you will come
                back to it, then it disappears under a mountain of new content.
                Over time, your saves turn into a messy archive you never open,
                basically a graveyard of great ideas.
              </p>
              <p>
                A lot of the content you save is not meant to be consumed in
                five seconds. Educational posts, breakdowns, frameworks, and
                tutorials need focus, but doomscrolling mode gives you maybe 5-7
                seconds before you move on. So you save it for later, except
                later rarely comes because the next wave of content is already
                waiting. Tavlo fixes that by giving your saved content a proper
                home, a dedicated, distraction-free place designed for
                revisiting, learning, and actually using what caught your
                attention in the first place.
              </p>
              <p>
                Tavlo also makes the process feel rewarding. It gamifies
                curation so organizing is not a chore, it is a habit you want to
                keep. Instead of saves being passive, Tavlo turns them into
                something active, a library you refine, return to, and grow over
                time. That is where saved content stops being just entertainment
                and starts becoming fuel for your goals.{" "}
                <span className="font-semibold text-text-primary">
                  Most importantly, Tavlo puts you back in control.
                </span>{" "}
                Your feed becomes personal again, built from what you chose and
                what you value, not what an algorithm decides you should see
                next.
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyTavloSection;
