/**
 * Simple Modal Component
 *
 * Lightweight modal wrapper with backdrop and title.
 * For complex modals, consider using the shadcn Dialog component.
 *
 * Created: 2026-02-19
 */

interface SimpleModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SimpleModal({ onClose, title, children }: SimpleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
