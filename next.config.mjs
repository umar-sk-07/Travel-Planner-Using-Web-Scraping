/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental:{
        instrumentationHook:true,
    },
    env: {
        NEXT_PUBLIC_STRIPE_PUBLIC_KEY: "pk_test_51MU0aHSFIqJ5O1bFXOF45kPsIm1PrxKdJwgwYc3Mr9c5VKMRb3QPmO2DfUcGiQggfFI9FUXaT8XoIKZyrwrmeP0K00WfxzqsXH",
        // NEXT_PUBLIC_APTIBLE_DOMAIN: "",
        NEXT_PUBLIC_DOMAIN:"http://localhost:3000",
      },
      images: {
        remotePatterns: [
          {
            hostname: "imgcld.yatra.com",
          },
          {
            hostname: "content.r9cdn.net",
          },
        ],
      },
    };

export default nextConfig;
