import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Box,
  Thermometer,
  MapPin,
  QrCode,
  FileText,
  Zap,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  Plus,
  PlusCircle,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  Server,
  Lock,
  Cpu,
  Hash,
  Wind,
  Navigation,
  UserCheck,
  Building2,
  Truck,
  HeartPulse,
  Scale,
  Sun,
  Moon,
  Menu,
  ArrowUpRight,
  Bell,
  Settings,
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  LogOut,
  Sliders,
  Sparkles,
} from "lucide-react";

const rawIcons = {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Box,
  Thermometer,
  MapPin,
  QrCode,
  FileText,
  Zap,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  Plus,
  PlusCircle,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  Server,
  Lock,
  Cpu,
  Hash,
  Wind,
  Navigation,
  UserCheck,
  Building2,
  Truck,
  HeartPulse,
  Scale,
  Sun,
  Moon,
  Menu,
  ArrowUpRight,
  Bell,
  Settings,
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  LogOut,
  Sliders,
  Sparkles,
};

// Safe Proxy fallback: prevents runtime fatal unmounts if any icon key is missing
export const Icons = new Proxy(rawIcons, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    // Safe placeholder component instead of throwing undefined element error
    return function FallbackIcon({ size = 16, color = "currentColor", style = {} }) {
      return (
        <span
          data-fallback-icon={String(prop)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            fontSize: `${Math.max(10, size - 4)}px`,
            color,
            ...style,
          }}
        >
          •
        </span>
      );
    };
  },
});

/**
 * Custom Minimal Brand Logo Icon
 * Combines Medicine Cross + Shield + Route Node
 */
export function BrandLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#4F80F8" />
      {/* Route track */}
      <path
        d="M8 22C12 22 13 10 18 10C22 10 23 16 24 16"
        stroke="#E0F2FE"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Central Medical Cross Shield */}
      <path
        d="M16 6L23 9V14C23 18.5 20 22.5 16 25C12 22.5 9 18.5 9 14V9L16 6Z"
        fill="#FFFFFF"
        fillOpacity="0.25"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Medical Cross */}
      <path
        d="M16 11V19M12 15H20"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Reference 2 Swirl / Helix Logo
 * Iconic concentric vortex spiral in white circle
 */
export function SwirlLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="18" cy="18" r="18" fill="#FFFFFF" />
      {/* Dynamic swirling concentric waves */}
      <path
        d="M18 9C13.0294 9 9 13.0294 9 18C9 20.4853 10.0074 22.7353 11.636 24.364"
        stroke="#121214"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18 13C15.2386 13 13 15.2386 13 18C13 19.3807 13.5596 20.6307 14.4645 21.5355"
        stroke="#121214"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 27C22.9706 27 27 22.9706 27 18C27 15.5147 25.9926 13.2647 24.364 11.636"
        stroke="#121214"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18 23C20.7614 23 23 20.7614 23 18C23 16.6193 22.4404 15.3693 21.5355 14.4645"
        stroke="#121214"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="2.2" fill="#121214" />
    </svg>
  );
}

