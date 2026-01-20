'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { aiGuidanceContent, aiDefaultContent, type AIFieldType } from '@/lib/ai-guidance';

interface AIGuidanceSidebarProps {
  focusedField: AIFieldType;
  className?: string;
}

/**
 * AIGuidanceSidebar - Field-specific contextual help
 *
 * Shows guidance based on which field is currently focused.
 * Falls back to default content when no field is focused.
 */
export function AIGuidanceSidebar({ focusedField, className }: AIGuidanceSidebarProps) {
  const content = focusedField ? aiGuidanceContent[focusedField] : null;

  return (
    <div className={className}>
      <Card variant="minimal" className="sticky top-4">
        <AnimatePresence mode="wait">
          {content ? (
            // Field-specific guidance
            <motion.div
              key={focusedField}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-tiffany-100 flex items-center justify-center">
                  {content.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{content.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{content.description}</p>

              {/* Tips */}
              {content.tips && content.tips.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Tips
                  </h4>
                  <ul className="space-y-2">
                    {content.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-tiffany-600 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples */}
              {content.examples && content.examples.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Examples
                  </h4>
                  <ul className="space-y-1.5">
                    {content.examples.map((example, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-500 italic pl-3 border-l-2 border-gray-200"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            // Default guidance
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {/* Header */}
              <h3 className="font-semibold text-gray-900 mb-2">{aiDefaultContent.title}</h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{aiDefaultContent.description}</p>

              {/* Features */}
              <div className="space-y-3 mb-4">
                {aiDefaultContent.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-gray-600 pt-1">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Hint */}
              {aiDefaultContent.hint && (
                <div className="flex items-start gap-2 p-3 bg-tiffany-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-tiffany-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-tiffany-700">{aiDefaultContent.hint}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

export default AIGuidanceSidebar;
