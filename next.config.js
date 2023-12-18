/** @type {import('next').NextConfig} */
const nextConfig = {
    //svg 파일 웹펙 설치
    webpack: (config) => {
        config.module.rules.push({
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        })
        return config
      },
      reactStrictMode: false,
      images: {
        domains: ['images.ctfassets.net'],
      },
      async redirects() {
        return [
          {
            source: '/upload',
            destination: '/upload',
            permanent: true,
          },
        ];
      },
}

module.exports = nextConfig
