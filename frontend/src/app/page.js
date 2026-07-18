import UploadForm from '@/components/UploadForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-white">
      {/* Decorative gradient blur in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          DevDrop<span className="text-blue-500">.</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400 max-w-md">
          Secure, ephemeral cloud file sharing built for developers. Files are completely destroyed when constraints expire.
        </p>
      </div>

      {/* Render our upload utility workspace */}
      <UploadForm />
    </main>
  );
}