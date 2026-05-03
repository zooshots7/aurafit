export default function Footer() {
  return (
    <footer className="w-full py-12 border-t border-outline-variant/30 bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-6 max-w-7xl mx-auto">
        <span className="text-lg font-headline italic text-on-surface">AuraFit</span>
        <div className="flex gap-8">
          <a className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary hover:underline decoration-primary underline-offset-4 transition-colors" href="#">Privacy</a>
          <a className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary hover:underline decoration-primary underline-offset-4 transition-colors" href="#">Terms</a>
          <a className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary hover:underline decoration-primary underline-offset-4 transition-colors" href="#">Contact</a>
        </div>
        <span className="font-label text-xs tracking-widest uppercase text-on-surface-variant">&copy; {new Date().getFullYear()} AuraFit. Powered by Claude AI</span>
      </div>
    </footer>
  );
}
