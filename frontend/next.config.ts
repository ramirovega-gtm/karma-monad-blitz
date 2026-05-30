import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El repo tiene lockfiles en la raíz y en frontend/; fijamos la raíz de Turbopack
  // a este directorio para que el tracing de archivos sea correcto.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
