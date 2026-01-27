/**
 * STEP CONTENT COMPONENT
 * Animated container for step content with header
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { OnboardingStep } from '../types';

interface StepContentProps {
  step: OnboardingStep;
  stepIndex: number;
}

export function StepContent({ step, stepIndex }: StepContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {React.createElement(step.icon, {
                  className: 'h-6 w-6 text-primary',
                })}
              </div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{step.content}</CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
