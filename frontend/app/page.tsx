'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from '@/components/ui/globe';
import { AuroraText } from '@/components/ui/aurora-text';
import { RainbowButton } from '@/components/ui/rainbow-button';
import LiquidEther from '@/components/LiquidEther';
import { Sora } from 'next/font/google';

const sora = Sora({ subsets: ['latin'], weight: ['700','800'] });


export default function Home() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/user-dashboard');
    }
  }, [ready, authenticated, router]);

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Login page
  if (!authenticated) {
    return (
      <div className="min-h-screen flex bg-black p-4 gap-4 relative">
        {/* Full page LiquidEther background */}
        <div className="absolute inset-0">
          <LiquidEther
            colors={['#FF4500', '#FF8C00', '#FFD700']}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          />
        </div>
        {/* Left Side - Content Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center p-8 h-full relative z-10">
            {/* FireGlobe Title */}
            <div className="mb-8">
              <div className={`${sora.className} text-7xl md:text-8xl font-extrabold tracking-tight flex items-center justify-center transform -skew-x-12`}>
                <span className="text-white">Fire</span>
                <AuroraText 
                  className="text-7xl md:text-8xl font-extrabold tracking-tight"
                  colors={["#FF4500", "#FF8C00", "#FFD700", "#FF6B35"]}
                  speed={1.5}
                >
                  <span className="text-white">Globe</span>
                </AuroraText>
              </div>
            </div>

            {/* Login Section */}
            <div className="max-w-md w-full">
              <p className="text-gray-400 mb-6 font-bold">
                Get your access token to start testing
              </p>

              <RainbowButton
                onClick={login}
                className="mx-auto font-semibold py-2.5 px-6 rounded-lg text-base"
              >
                Get Started
              </RainbowButton>

              <p className="mt-6 text-sm text-gray-500">
                Connect with email, wallet, or social accounts
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Globe Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="w-[500px] h-[500px] relative">
              <Globe className="!absolute !inset-0 !w-full !h-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, the redirect above will navigate to /user-dashboard
  return null;
}