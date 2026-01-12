import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 hover:border-white/30 transition-all duration-300">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              ListingsIQ
            </h1>
            <p className="text-gray-300 text-sm font-light tracking-wide">Local Listings Management</p>
          </div>

          <LoginForm />

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-gray-400 text-sm">
              New here?{' '}
              <a href="/auth/register" className="text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text font-semibold hover:from-purple-300 hover:to-blue-300 transition-all">
                Create an account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}