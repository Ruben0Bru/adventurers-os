// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public", // Dónde se guardarán los archivos del Service Worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true, // Recarga la app si detecta que volvió el internet
  disable: process.env.NODE_ENV === "development", // Apagamos el SW en modo dev para que no interfiera con tus cambios de código
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Si tenías algo en tu config original, déjalo aquí adentro
  reactStrictMode: true,
};

export default withPWA(nextConfig);