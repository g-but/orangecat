'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { componentColors } from '@/lib/theme';
import { setupSteps } from './config';

interface ProgressStepsProps {
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function ProgressSteps({ currentStep, onStepClick }: ProgressStepsProps) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">How to Get Started</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {setupSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`text-center p-6 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? componentColors.bitcoinElement.className + ' border-bitcoinOrange shadow-lg'
                  : isCompleted
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onStepClick(index)}
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  isActive
                    ? 'bg-bitcoinOrange text-white'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
