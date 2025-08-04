import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //all config options go here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'amplify-d335597a80fxjy-ma-amplifyteamdrivebucket28-i47hjvvkemxz.s3.us-east-2.amazonaws.com',
        pathname: '/**',
        
        // or write it out as
        //remotePatterns: [new URL('https://assets.example.com/account123/**')],
      },
    ],
  },
};

export default nextConfig;
