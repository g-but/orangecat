/**
 * Touch feedback utilities for mobile interactions.
 * Used by TouchOptimized, LongPress, and other mobile components.
 */

/** Trigger haptic feedback on supported devices */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    // Android vibration
    const patterns = { light: 10, medium: 50, heavy: 100 };
    navigator.vibrate(patterns[type]);
  }

  // iOS haptic feedback (if available)
  if ('hapticFeedback' in navigator) {
    const nav = navigator as Navigator & {
      hapticFeedback?: (type: 'light' | 'medium' | 'heavy') => void;
    };
    nav.hapticFeedback?.(type);
  }
}

/** Returns true on touch/mobile devices */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

/** Renders a Material-style ripple effect on the given element */
export function createRipple(element: HTMLElement, event: React.TouchEvent | React.MouseEvent) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('span');

  const size = Math.max(rect.width, rect.height);
  const clientX =
    'touches' in event && event.touches.length > 0
      ? event.touches[0].clientX
      : 'clientX' in event
        ? event.clientX
        : 0;
  const clientY =
    'touches' in event && event.touches.length > 0
      ? event.touches[0].clientY
      : 'clientY' in event
        ? event.clientY
        : 0;
  const x = clientX - rect.left - size / 2;
  const y = clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(247, 147, 26, 0.3);
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    animation: ripple 0.6s ease-out;
    pointer-events: none;
    z-index: 1;
  `;

  if (!document.getElementById('ripple-styles')) {
    const styles = document.createElement('style');
    styles.id = 'ripple-styles';
    styles.textContent = `
      @keyframes ripple {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}
