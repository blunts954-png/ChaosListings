'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Zap, TrendingUp, BarChart3, Globe, Layers, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden pt-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '4s'}} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className={`text-center space-y-8 transform transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-xl hover:border-white/30 transition-all">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Now with free Google & Yelp APIs</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block mb-2">Manage Your</span>
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Local Listings
              </span>
              <span className="block">Effortlessly</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light">
              Sync, update, and manage your business listings across 15+ directories. <br />
              <span className="text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text font-semibold">Zero cost. Full control.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/businesses"
                    className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all backdrop-blur-xl"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>100% Free to Start</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>No Credit Card Required</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>15+ Directory Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Powerful Features. Simple Design.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Sync</h3>
              <p className="text-gray-400">
                Connect your Google My Business and Yelp accounts. Automatically sync listings in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">15+ Directories</h3>
              <p className="text-gray-400">
                Manage Uber Eats, DoorDash, Instagram, TikTok, Facebook, Waze, and more in one place.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-indigo-500/50 transition-all">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Competitive Analysis</h3>
              <p className="text-gray-400">
                See how you stack up against competitors. Get market insights and recommendations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Dashboard</h3>
              <p className="text-gray-400">
                Track sync status, errors, and performance metrics with beautiful analytics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-pink-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-all">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">CSV Upload</h3>
              <p className="text-gray-400">
                Upload directory listings via CSV. Perfect for smaller directories and local businesses.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-red-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-red-500/50 transition-all">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Always Free</h3>
              <p className="text-gray-400">
                Built on free APIs. Never pay per location. Scale without worrying about costs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to take control?</h2>
            <p className="text-gray-300 mb-8">
              Join hundreds of local businesses managing their listings with ChaosListings.
            </p>
            {!isAuthenticated && (
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/50"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-gray-400 text-sm">© 2026 ChaosListings. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
