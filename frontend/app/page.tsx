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
      <div className="min-h-screen flex flex-col lg:flex-row bg-black p-4 gap-4 relative">
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
        
        {/* Content Section - Full width on mobile/tablet, half on desktop */}
        <div className="flex-1 lg:flex-1 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 h-screen lg:h-full relative z-10">
            {/* FireGlobe Title */}
            <div className="mb-6 lg:mb-8">
              <div className={`${sora.className} text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight flex items-center justify-center transform -skew-x-12`}>
                <span className="text-white">Fire</span>
                <AuroraText 
                  className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight"
                  colors={["#FF4500", "#FF8C00", "#FFD700", "#FF6B35"]}
                  speed={1.5}
                >
                  <span className="text-white">Globe</span>
                </AuroraText>
              </div>
            </div>

            {/* Login Section */}
            <div className="max-w-md w-full">
              <p className="text-gray-400 mb-4 lg:mb-6 font-bold text-sm sm:text-base">
                Get your access token to start testing
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 ml-4 sm:ml-8 lg:ml-12">
                <RainbowButton
                  onClick={login}
                  className="mx-auto sm:mx-0 font-semibold py-3 sm:py-4 lg:py-5.5 px-6 sm:px-8 rounded-lg text-base sm:text-lg flex-1 sm:flex-none"
                >
                  Get Started
                </RainbowButton>
                
                <button
                  onClick={() => router.push('/how-to-use')}
                  className="mx-auto sm:mx-0 font-semibold py-2.5 px-6 rounded-lg text-base flex-1 sm:flex-none relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5"></div>
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                    <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                      How To Use
                    </span>
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  <div className="absolute inset-0 border border-orange-500/30 rounded-lg group-hover:border-orange-400/50 transition-all duration-300"></div>
                  <div className="absolute inset-0 rounded-lg shadow-lg shadow-orange-500/5 group-hover:shadow-orange-500/20 transition-all duration-300"></div>
                </button>
              </div>

              <p className="mt-4 lg:mt-6 text-xs sm:text-sm text-gray-500">
                Connect with email, wallet, or social accounts
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Globe Canvas - Hidden on mobile/tablet, visible on desktop */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
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