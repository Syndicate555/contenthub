"use client";

import { motion } from "framer-motion";

export function CaughtUpIllustration() {
  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Background circle with gradient */}
      <motion.circle
        cx="60"
        cy="60"
        r="50"
        fill="url(#grad1)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      />

      {/* Checkmark */}
      <motion.path
        d="M35 60 L50 75 L85 40"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeInOut" }}
      />

      {/* Floating sparkles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={60 + Math.cos((i * Math.PI) / 2) * 70}
          cy={60 + Math.sin((i * Math.PI) / 2) * 70}
          r="4"
          fill="url(#grad2)"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </motion.svg>
  );
}

export function NoResultsIllustration() {
  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto"
    >
      <defs>
        <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Magnifying glass */}
      <motion.circle
        cx="50"
        cy="50"
        r="25"
        stroke="url(#searchGrad)"
        strokeWidth="6"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      />

      <motion.line
        x1="70"
        y1="70"
        x2="90"
        y2="90"
        stroke="url(#searchGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />

      {/* Question mark */}
      <motion.text
        x="50"
        y="58"
        fontSize="28"
        fill="url(#searchGrad)"
        textAnchor="middle"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        ?
      </motion.text>
    </motion.svg>
  );
}
