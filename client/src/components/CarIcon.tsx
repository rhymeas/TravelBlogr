import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CarIconProps {
  isVisible: boolean;
  position: "top" | "middle" | "bottom";
  isMoving?: boolean;
  className?: string;
}

export default function CarIcon({ 
  isVisible, 
  position, 
  isMoving = false, 
  className = "" 
}: CarIconProps) {
  const [showExhaust, setShowExhaust] = useState(false);

  useEffect(() => {
    if (isMoving) {
      setShowExhaust(true);
      const timer = setTimeout(() => setShowExhaust(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isMoving]);

  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return { top: "10px" };
      case "middle":
        return { top: "50%", transform: "translateY(-50%)" };
      case "bottom":
        return { bottom: "10px" };
      default:
        return { top: "50%", transform: "translateY(-50%)" };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            y: isMoving ? [0, -5, 0] : 0
          }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            y: {
              duration: 1.5,
              repeat: isMoving ? Infinity : 0,
              ease: "easeInOut"
            }
          }}
          className={`absolute left-1/2 transform -translate-x-1/2 z-20 ${className}`}
          style={getPositionStyles()}
          data-testid="car-icon"
        >
          <div className="relative">
            {/* Car Body */}
            <motion.div
              animate={{
                rotate: isMoving ? [0, 1, -1, 0] : 0
              }}
              transition={{
                duration: 0.5,
                repeat: isMoving ? Infinity : 0,
                ease: "easeInOut"
              }}
              className="relative"
            >
              {/* Main Car SVG */}
              <svg
                width="40"
                height="24"
                viewBox="0 0 40 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                {/* Car Shadow */}
                <ellipse
                  cx="20"
                  cy="22"
                  rx="16"
                  ry="2"
                  fill="#000000"
                  opacity="0.1"
                />
                
                {/* Car Body */}
                <rect
                  x="4"
                  y="8"
                  width="32"
                  height="10"
                  rx="2"
                  fill="#0d9488"
                  className="drop-shadow-sm"
                />
                
                {/* Car Top */}
                <rect
                  x="8"
                  y="4"
                  width="24"
                  height="8"
                  rx="4"
                  fill="#0f766e"
                  className="drop-shadow-sm"
                />
                
                {/* Windows */}
                <rect
                  x="10"
                  y="6"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#a7f3d0"
                  opacity="0.8"
                />
                <rect
                  x="22"
                  y="6"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#a7f3d0"
                  opacity="0.8"
                />
                
                {/* Headlights */}
                <circle
                  cx="36"
                  cy="13"
                  r="2"
                  fill="#fef9c3"
                  stroke="#fbbf24"
                  strokeWidth="0.5"
                />
                
                {/* Wheels */}
                <circle
                  cx="10"
                  cy="18"
                  r="3"
                  fill="#374151"
                  className="drop-shadow-sm"
                />
                <circle
                  cx="30"
                  cy="18"
                  r="3"
                  fill="#374151"
                  className="drop-shadow-sm"
                />
                
                {/* Wheel centers */}
                <circle cx="10" cy="18" r="1.5" fill="#6b7280" />
                <circle cx="30" cy="18" r="1.5" fill="#6b7280" />
              </svg>

              {/* Cute exhaust puffs when moving */}
              <AnimatePresence>
                {showExhaust && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, x: 0 }}
                    animate={{ 
                      scale: [0, 1, 1.5],
                      opacity: [0, 0.6, 0],
                      x: [-15, -20, -25]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                    className="absolute top-2 left-0"
                  >
                    <div className="text-gray-400 text-xs">💨</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Position indicator dot */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"
            />

            {/* "Live" indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
                🔴 Live
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple animated car for loading states
export function CarLoadingIcon({ className = "" }: { className?: string }) {
  return (
    <motion.div
      animate={{
        x: [0, 10, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`text-2xl ${className}`}
      data-testid="car-loading-icon"
    >
      🚗
    </motion.div>
  );
}