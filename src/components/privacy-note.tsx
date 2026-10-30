export function PrivacyNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-sm text-muted border-t border-line pt-3 leading-relaxed">
      <strong className="text-fg font-medium">Privacy.</strong> Camera frames and photos are processed in your browser only. Nothing is uploaded or stored, and the camera turns off when you press Stop or leave the page. {children}
    </p>
  );
}
