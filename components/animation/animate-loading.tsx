import { motion } from 'motion/react'

export const PremiumAnimatedLogo = ({ size = 120 }: { size?: number }) => {
  const scale = size / 36 // Scale factor based on original 36x36 design

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Outer glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            '0 0 20px rgba(200, 232, 107, 0.2)',
            '0 0 40px rgba(200, 232, 107, 0.4)',
            '0 0 20px rgba(200, 232, 107, 0.2)',
          ],
        }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Background gradient definition */}
        <defs>
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8e86b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#c8e86b" stopOpacity="0.05" />
          </linearGradient>
          <radialGradient id="playGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c8e86b" stopOpacity="1" />
            <stop offset="100%" stopColor="#a8cc4b" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Manga panel frame with elegant drawing animation */}
        <motion.rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="6"
          fill="url(#panelGradient)"
          stroke="#c8e86b"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: 1,
            strokeWidth: [1.5, 2, 1.5],
          }}
          transition={{
            pathLength: { duration: 1.2, ease: 'easeInOut', delay: 0.3 },
            opacity: { duration: 0.4, delay: 0.3 },
            strokeWidth: { duration: 3, ease: 'easeInOut', repeat: Infinity },
          }}
        />

        {/* Animated corner accents */}
        {[
          { x: 1, y: 1, rotate: 0 },
          { x: 35, y: 1, rotate: 90 },
          { x: 35, y: 35, rotate: 180 },
          { x: 1, y: 35, rotate: 270 },
        ].map((corner, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
          >
            <motion.path
              d={`M${corner.x},${corner.y + 3} L${corner.x},${corner.y} L${corner.x + 3},${corner.y}`}
              stroke="#c8e86b"
              strokeWidth="2"
              fill="none"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            />
          </motion.g>
        ))}

        {/* Speed lines with elegant rotation and opacity waves */}
        <motion.g
          stroke="#c8e86b"
          strokeWidth="0.7"
          animate={{
            rotate: [0, 360],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            rotate: { duration: 8, ease: 'linear', repeat: Infinity },
            opacity: { duration: 3, ease: 'easeInOut', repeat: Infinity },
          }}
          style={{ originX: '18px', originY: '18px' }}
        >
          <line x1="18" y1="18" x2="1" y2="1" />
          <line x1="18" y1="18" x2="10" y2="1" />
          <line x1="18" y1="18" x2="18" y2="1" />
          <line x1="18" y1="18" x2="26" y2="1" />
          <line x1="18" y1="18" x2="35" y2="1" />
          <line x1="18" y1="18" x2="35" y2="10" />
          <line x1="18" y1="18" x2="35" y2="18" />
          <line x1="18" y1="18" x2="35" y2="26" />
          <line x1="18" y1="18" x2="35" y2="35" />
          <line x1="18" y1="18" x2="26" y2="35" />
          <line x1="18" y1="18" x2="18" y2="35" />
          <line x1="18" y1="18" x2="10" y2="35" />
          <line x1="18" y1="18" x2="1" y2="35" />
          <line x1="18" y1="18" x2="1" y2="26" />
          <line x1="18" y1="18" x2="1" y2="18" />
          <line x1="18" y1="18" x2="1" y2="10" />
        </motion.g>

        {/* Second rotating speed line layer (opposite direction) */}
        <motion.g
          stroke="#c8e86b"
          strokeWidth="0.4"
          animate={{
            rotate: [360, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            rotate: { duration: 6, ease: 'linear', repeat: Infinity },
            opacity: { duration: 2.5, ease: 'easeInOut', repeat: Infinity },
          }}
          style={{ originX: '18px', originY: '18px' }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="18"
              y1="18"
              x2={18 + 14 * Math.cos((angle * Math.PI) / 180)}
              y2={18 + 14 * Math.sin((angle * Math.PI) / 180)}
            />
          ))}
        </motion.g>

        {/* Play button outer ring with breathing effect */}
        <motion.circle
          cx="18"
          cy="18"
          r="10.5"
          fill="none"
          stroke="#c8e86b"
          strokeWidth="0.5"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />

        {/* Play button circle with elegant scale animation */}
        <motion.circle
          cx="18"
          cy="18"
          r="9"
          fill="url(#playGlow)"
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            times: [0, 0.6, 0.8, 1],
            ease: 'easeOut',
          }}
        />

        {/* Subtle inner highlight on play button */}
        <motion.circle
          cx="16"
          cy="16"
          r="4"
          fill="white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0.1] }}
          transition={{
            duration: 0.6,
            delay: 1,
          }}
        />

        {/* Play triangle with elegant drawing animation */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.polygon
            points="15,13.5 15,22.5 23,18"
            fill="#060e06"
            initial={{ pathLength: 0, scale: 0.8 }}
            animate={{
              pathLength: 1,
              scale: [0.8, 1.05, 1],
            }}
            transition={{
              pathLength: { duration: 0.5, delay: 0.8, ease: 'easeInOut' },
              scale: { duration: 0.5, delay: 1.3, ease: 'easeOut' },
            }}
          />
        </motion.g>

        {/* Particle effects around play button */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180
          const radius = 11
          const x = 18 + radius * Math.cos(angle)
          const y = 18 + radius * Math.sin(angle)

          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="1"
              fill="#c8e86b"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
                cx: [x, 18 + (radius + 2) * Math.cos(angle), 18 + (radius + 4) * Math.cos(angle)],
                cy: [y, 18 + (radius + 2) * Math.sin(angle), 18 + (radius + 4) * Math.sin(angle)],
              }}
              transition={{
                duration: 2,
                delay: 1.5 + i * 0.1,
                ease: 'easeOut',
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          )
        })}
      </motion.svg>

      {/* Decorative rotating ring outside the panel */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
        style={{ transformOrigin: 'center center' }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            cx="18"
            cy="18"
            r="17"
            fill="none"
            stroke="#c8e86b"
            strokeWidth="0.3"
            strokeDasharray="2 8"
            animate={{
              opacity: [0.1, 0.3, 0.1],
              strokeDashoffset: [0, 20],
            }}
            transition={{
              duration: 3,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  )
}

// Enhanced loading page with beautiful animations
export const PremiumLoadingPage = () => (
  <motion.div
    className="fixed inset-0 flex items-center justify-center"
    // style={{ backgroundColor: '#060e06' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {/* Animated background pattern */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #c8e86b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>

    <div className="relative flex flex-col items-center gap-8">
      {/* Logo container with floating animation */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          rotate: [-1, 1, -1],
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <PremiumAnimatedLogo size={140} />
      </motion.div>

      {/* Loading text with elegant animation */}
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <h1 className="text-[#c8e86b] text-2xl font-bold tracking-wider">
          MotionRecap
        </h1>

        {/* Animated progress dots */}
        <div className="flex items-center gap-2">
          {["Loading", "your", "story"].map((word, i) => (
            <motion.span
              key={i}
              className="text-[#c8e86b]/60 text-sm font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.8 + i * 0.15,
                duration: 0.4,
              }}
            >
              {word}
              {i < 3 && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.15,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  ·
                </motion.span>
              )}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// Compact loading bar version
export const LoadingBar = () => (
  <div className="flex flex-col items-center gap-4">
    <PremiumAnimatedLogo size={80} />
    <div className="w-48 h-1 bg-[#c8e86b]/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#c8e86b] rounded-full"
        initial={{ width: '0%' }}
        animate={{ 
          width: ['0%', '100%', '0%'],
          x: ['-100%', '0%', '100%']
        }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </div>
  </div>
)

// Usage with Next.js
export default function Loading() {
  return <PremiumLoadingPage />
}