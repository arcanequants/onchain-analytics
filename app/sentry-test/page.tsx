'use client';

export default function SentryTestPage() {
  const handleTestError = () => {
    throw new Error('This is a test error from Sentry Test Page');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6">
          Sentry Error Test
        </h1>

        <p className="text-white/80 mb-6">
          Click the button below to trigger a test error that will be sent to Sentry.
        </p>

        <button
          onClick={handleTestError}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Trigger Test Error
        </button>

        <p className="text-white/60 text-sm mt-4">
          After clicking, check your Sentry dashboard to see the error.
        </p>
      </div>
    </div>
  );
}
