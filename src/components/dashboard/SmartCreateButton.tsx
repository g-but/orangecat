'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useProjectStore } from '@/stores/projectStore';
import DraftContinueDialog from './DraftContinueDialog';
import { ROUTES } from '@/config/routes';

export type { CreateOption } from '@/config/create-options';
export { CREATE_OPTIONS, shouldShowDivider } from '@/config/create-options';

interface SmartCreateButtonProps {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  showIcon?: boolean;
  fullWidth?: boolean;
  forceNewProject?: boolean;
}

export default function SmartCreateButton({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  fullWidth = false,
  forceNewProject = false,
}: SmartCreateButtonProps) {
  const router = useRouter();
  const { drafts } = useProjectStore();
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const hasAnyDraft = drafts.length > 0;
  const primaryDraft = hasAnyDraft ? drafts[0] : null;
  const shouldShowDraftPrompt = hasAnyDraft && !forceNewProject;

  const handleClick = () => {
    if (shouldShowDraftPrompt) {
      setShowDraftDialog(true);
    } else {
      router.push(ROUTES.PROJECTS.CREATE);
    }
  };

  const handleContinueDraft = () => {
    setShowDraftDialog(false);
    router.push(ROUTES.PROJECTS.CREATE);
  };

  const handleStartFresh = () => {
    setShowDraftDialog(false);
    router.push(`${ROUTES.PROJECTS.CREATE}?new=true`);
  };

  const getButtonContent = () => {
    if (shouldShowDraftPrompt && primaryDraft) {
      return (
        <>
          {showIcon && <Edit3 className="w-4 h-4 mr-2" />}
          {children || (primaryDraft.isDraft ? 'Continue Project' : 'Complete Project')}
        </>
      );
    }
    return (
      <>
        {showIcon && <Plus className="w-4 h-4 mr-2" />}
        {children || 'Create Project'}
      </>
    );
  };

  const getButtonClassName = () => {
    if (shouldShowDraftPrompt) {
      return variant === 'outline'
        ? 'border-strong text-fg-primary hover:bg-surface-raised'
        : variant === 'ghost'
          ? 'text-fg-primary hover:bg-surface-raised'
          : 'bg-fg-primary text-fg-inverted hover:bg-fg-primary/90';
    }
    return '';
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={`${getButtonClassName()} ${fullWidth ? 'w-full' : ''} ${className}`}
        size={size}
        variant={variant}
      >
        {getButtonContent()}
      </Button>

      <DraftContinueDialog
        isOpen={showDraftDialog}
        onClose={() => setShowDraftDialog(false)}
        onContinueDraft={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    </>
  );
}
