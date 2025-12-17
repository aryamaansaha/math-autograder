/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Force webpack to use CommonJS version of supabase to avoid ESM issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/supabase-js': '@supabase/supabase-js/dist/main/index.js',
    };
    return config;
  },
}

module.exports = nextConfig

