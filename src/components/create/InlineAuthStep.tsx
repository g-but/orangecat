'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  User,
  Mail,
  Lock,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { satoshisToBitcoin } from '@/utils/currency';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import supabase from '@/lib/supabase/browser';
import type { FundingPageFormData } from '@/types/funding';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Registration schema
const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, hyphens, and underscores'
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface InlineAuthStepProps {
  onSuccess: (userId: string) => Promise<void>;
  projectData: Partial<FundingPageFormData> & { title: string; goal_amount: number; category: string };
  onBack: () => void;
}

export default function InlineAuthStep({ onSuccess, projectData, onBack }: InlineAuthStepProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Handle login
  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      if (authData.user) {
        toast.success('Welcome back! 🎉', {
          description: 'Publishing your project...',
        });
        await onSuccess(authData.user.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please check your credentials and try again';
      toast.error('Login failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Check if username is available using ProfileWriter service
      const { ProfileWriter } = await import('@/services/profile');
      const isAvailable = await ProfileWriter.checkUsernameUniqueness(data.username, '');

      if (!isAvailable) {
        toast.error('Username taken', {
          description: 'Please choose a different username',
        });
        setIsLoading(false);
        return;
      }

      // Register user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (authData.user) {
        // Create profile using ProfileWriter service
        const { ProfileWriter } = await import('@/services/profile');
        const result = await ProfileWriter.createProfile(authData.user.id, {
          username: data.username,
          email: data.email,
          name: data.username,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create profile');
        }

        toast.success('Account created! 🎉', {
          description: 'Publishing your project...',
        });
        await onSuccess(authData.user.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again';
      toast.error('Registration failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-teal-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost there! 🚀</h2>
              <p className="text-gray-600">
                Your project is ready to publish. Just sign in or create a quick account to post it.
              </p>
            </div>
          </div>
        </div>

        {/* Auth Tabs */}
        <div className="p-8">
          <Tabs value={mode} onValueChange={v => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="gap-2">
                <User className="w-4 h-4" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-400" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between pt-4">
                      <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white shadow-lg min-w-[180px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In & Publish
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="your_username" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormDescription>This will be your public profile name</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-400" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            At least 8 characters with uppercase, lowercase, and number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4 text-gray-400" />
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between pt-4">
                      <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white shadow-lg min-w-[180px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create & Publish
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Campaign Preview */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Campaign Summary</h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Title</span>
              <span className="text-sm font-medium text-gray-900">{projectData.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Goal</span>
              <span className="text-sm font-medium text-gray-900">
                ₿{satoshisToBitcoin(projectData.goal_amount).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category</span>
              <span className="text-sm font-medium text-gray-900">{projectData.category}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
