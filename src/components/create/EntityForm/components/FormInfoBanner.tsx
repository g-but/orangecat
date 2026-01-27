/**
 * FORM INFO BANNER
 * Displays informational banners with different variants
 */

interface InfoBanner {
  title: string;
  content: string;
  variant?: 'info' | 'warning' | 'success';
}

interface FormInfoBannerProps {
  banner: InfoBanner;
}

export function FormInfoBanner({ banner }: FormInfoBannerProps) {
  const variantStyles = {
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      title: 'text-yellow-900',
      content: 'text-yellow-700',
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      title: 'text-green-900',
      content: 'text-green-700',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      title: 'text-blue-900',
      content: 'text-blue-700',
    },
  };

  const styles = variantStyles[banner.variant || 'info'];

  return (
    <div className={`rounded-md p-4 border ${styles.bg}`}>
      <h4 className={`text-sm font-semibold mb-2 ${styles.title}`}>{banner.title}</h4>
      <p className={`text-sm ${styles.content}`}>{banner.content}</p>
    </div>
  );
}
