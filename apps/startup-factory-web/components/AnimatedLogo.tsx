"use client";

export default function AnimatedLogo() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32 group">
      {/* Outer rotating ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin-slow"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animationDuration: "12s" }}
      >
        <circle
          cx="100" cy="100" r="90"
          stroke="#3D2FFF"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.4"
        />
      </svg>

      {/* Middle ring counter-rotating */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin-reverse"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle
          cx="100" cy="100" r="65"
          stroke="#F5F0E8"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.15"
        />
      </svg>

      {/* Logo icon — static center */}
      <svg
        className="relative z-10 w-16 h-16"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Frame lines */}
        <line x1="30" y1="155" x2="30" y2="35" stroke="white" strokeWidth="4" />
        <line x1="142" y1="148" x2="38" y2="35" stroke="white" strokeWidth="4" />
        <line x1="40" y1="158" x2="138" y2="158" stroke="white" strokeWidth="4" />
        {/* Nodes */}
        <circle cx="30" cy="155" r="8" stroke="white" strokeWidth="4" />
        <circle cx="30" cy="30" r="8" stroke="white" strokeWidth="4" />
        <circle cx="145" cy="152" r="8" stroke="white" strokeWidth="4" />
        {/* Outer circle */}
        <circle cx="95" cy="95" r="70" stroke="white" strokeWidth="4" />
        {/* Inner circle */}
        <circle cx="95" cy="95" r="32"
          stroke="#3D2FFF" strokeWidth="3"
          className="animate-pulse"
          style={{ animationDuration: "3s" }}
        />
        {/* Diagonal cross line */}
        <line x1="140" y1="50" x2="50" y2="140" stroke="white" strokeWidth="3" opacity="0.6" />
      </svg>

      {/* Glow pulse */}
      <div
        className="absolute inset-0 rounded-full bg-[#3D2FFF]/5 animate-ping"
        style={{ animationDuration: "4s" }}
      />

    </div>
  );
}
