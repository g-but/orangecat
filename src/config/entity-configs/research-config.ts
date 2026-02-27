import { EntityConfig } from '@/types/entity';
import { ResearchEntity } from '@/types/research';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { z } from 'zod';

// Research entity validation schema
export const researchEntitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  field: z.enum([
    'fundamental_physics',
    'mathematics',
    'computer_science',
    'biology',
    'chemistry',
    'neuroscience',
    'psychology',
    'economics',
    'philosophy',
    'engineering',
    'medicine',
    'environmental_science',
    'social_science',
    'artificial_intelligence',
    'blockchain_cryptography',
    'other',
  ]),
  methodology: z.enum([
    'theoretical',
    'experimental',
    'computational',
    'empirical',
    'qualitative',
    'mixed_methods',
    'meta_analysis',
    'survey',
    'case_study',
    'action_research',
  ]),
  expected_outcome: z.string().min(1).max(1000),
  timeline: z.enum(['short_term', 'medium_term', 'long_term', 'ongoing', 'indefinite']),
  funding_goal_sats: z.number().min(1000),
  funding_model: z.enum(['donation', 'subscription', 'milestone', 'royalty', 'hybrid']),
  resource_needs: z
    .array(
      z.object({
        type: z.enum([
          'compute',
          'data',
          'equipment',
          'collaboration',
          'publication',
          'travel',
          'software',
          'other',
        ]),
        description: z.string().optional(),
        estimated_cost_sats: z.number().min(0).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
      })
    )
    .optional(),
  lead_researcher: z.string().min(1),
  team_members: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        expertise: z.string().optional(),
        contribution_percentage: z.number().min(0).max(100).optional(),
      })
    )
    .optional(),
  open_collaboration: z.boolean().optional(),
  progress_frequency: z.enum(['weekly', 'biweekly', 'monthly', 'milestone', 'as_needed']),
  transparency_level: z.enum(['full', 'progress', 'milestone', 'minimal']),
  voting_enabled: z.boolean().optional(),
  impact_areas: z
    .array(
      z.object({
        area: z.enum([
          'scientific_understanding',
          'technological_innovation',
          'medical_advancement',
          'environmental_protection',
          'social_progress',
          'economic_development',
          'education',
          'policy_making',
          'philosophical_insight',
          'other',
        ]),
        description: z.string().optional(),
      })
    )
    .optional(),
  target_audience: z.array(z.string()).optional(),
  sdg_alignment: z
    .array(
      z.object({
        goal: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  is_public: z.boolean().optional(),
});

export const researchConfig: EntityConfig<ResearchEntity> = {
  entityType: 'research',
  name: 'Research',
  namePlural: 'Research',
  displayName: 'Research',
  displayNamePlural: 'Research',
  description:
    'Independent research topics with decentralized funding (e.g., Dark Matter, Climate Science)',
  icon: '🔬',
  color: '#8B5CF6', // Purple for research
  colorTheme: 'purple',
  schema: researchEntitySchema,

  // Routing
  listPath: ENTITY_REGISTRY['research'].basePath,
  detailPath: (id: string) => `${ENTITY_REGISTRY['research'].publicBasePath}/${id}`,
  createPath: ENTITY_REGISTRY['research'].createPath,
  editPath: (id: string) => `${ENTITY_REGISTRY['research'].createPath}?edit=${id}`,
  apiEndpoint: ENTITY_REGISTRY['research'].apiEndpoint,

  // Card rendering
  makeHref: entity => `${ENTITY_REGISTRY['research'].publicBasePath}/${entity.id}`,
  makeCardProps: entity => ({
    badge: entity.status === 'active' ? 'Active' : entity.status === 'draft' ? 'Draft' : undefined,
    badgeVariant: entity.status === 'active' ? 'success' : 'default',
    showEditButton: true,
    editHref: `${ENTITY_REGISTRY['research'].createPath}?edit=${entity.id}`,
  }),

  // Basic fields
  fields: [
    {
      name: 'title',
      label: 'Research Title',
      type: 'text',
      required: true,
      placeholder: 'The fundamental question your research addresses',
      maxLength: 200,
    },
    {
      name: 'description',
      label: 'Research Description',
      type: 'textarea',
      required: true,
      placeholder: 'What understanding are you pursuing? What problem are you solving?',
      maxLength: 2000,
    },
    {
      name: 'field',
      label: 'Research Field',
      type: 'select',
      required: true,
      options: [
        { value: 'fundamental_physics', label: 'Fundamental Physics' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'computer_science', label: 'Computer Science' },
        { value: 'biology', label: 'Biology' },
        { value: 'chemistry', label: 'Chemistry' },
        { value: 'neuroscience', label: 'Neuroscience' },
        { value: 'psychology', label: 'Psychology' },
        { value: 'economics', label: 'Economics' },
        { value: 'philosophy', label: 'Philosophy' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'medicine', label: 'Medicine' },
        { value: 'environmental_science', label: 'Environmental Science' },
        { value: 'social_science', label: 'Social Science' },
        { value: 'artificial_intelligence', label: 'Artificial Intelligence' },
        { value: 'blockchain_cryptography', label: 'Blockchain & Cryptography' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      name: 'methodology',
      label: 'Research Methodology',
      type: 'select',
      required: true,
      options: [
        { value: 'theoretical', label: 'Theoretical Research' },
        { value: 'experimental', label: 'Experimental Research' },
        { value: 'computational', label: 'Computational Research' },
        { value: 'empirical', label: 'Empirical Research' },
        { value: 'qualitative', label: 'Qualitative Research' },
        { value: 'mixed_methods', label: 'Mixed Methods' },
        { value: 'meta_analysis', label: 'Meta-Analysis' },
        { value: 'survey', label: 'Survey Research' },
        { value: 'case_study', label: 'Case Study' },
        { value: 'action_research', label: 'Action Research' },
      ],
    },
    {
      name: 'expected_outcome',
      label: 'Expected Outcome',
      type: 'textarea',
      required: true,
      placeholder: 'What understanding or breakthrough do you hope to achieve?',
      maxLength: 1000,
    },
    {
      name: 'timeline',
      label: 'Research Timeline',
      type: 'select',
      required: true,
      options: [
        { value: 'short_term', label: 'Short-term (3-6 months)' },
        { value: 'medium_term', label: 'Medium-term (6-18 months)' },
        { value: 'long_term', label: 'Long-term (1-3 years)' },
        { value: 'ongoing', label: 'Ongoing Research' },
        { value: 'indefinite', label: 'Indefinite/Exploratory' },
      ],
    },
  ],

  // Research-specific fields
  sections: [
    {
      id: 'funding',
      title: 'Funding & Resources',
      description: 'How your research will be funded and what resources you need',
      fields: [
        {
          name: 'funding_goal_sats',
          label: 'Funding Goal (sats)',
          type: 'number',
          required: true,
          placeholder: 'How many sats do you need to complete this research?',
          min: 1000, // Minimum 1000 sats
        },
        {
          name: 'funding_model',
          label: 'Funding Model',
          type: 'select',
          required: true,
          options: [
            { value: 'donation', label: 'Funding-based (pure support)' },
            { value: 'subscription', label: 'Subscription (ongoing support)' },
            { value: 'milestone', label: 'Milestone-based (progress payments)' },
            { value: 'royalty', label: 'Royalty-share (revenue sharing)' },
            { value: 'hybrid', label: 'Hybrid (multiple models)' },
          ],
        },
        {
          name: 'resource_needs',
          label: 'Resource Needs',
          type: 'multiselect',
          options: [
            { value: 'compute', label: 'Compute Resources' },
            { value: 'data', label: 'Data Access' },
            { value: 'equipment', label: 'Specialized Equipment' },
            { value: 'collaboration', label: 'Research Collaboration' },
            { value: 'publication', label: 'Publication Support' },
            { value: 'travel', label: 'Travel/Field Work' },
            { value: 'software', label: 'Software/Tools' },
            { value: 'other', label: 'Other Resources' },
          ],
        },
      ],
    },
    {
      id: 'team',
      title: 'Research Team',
      description: 'Who will be working on this research',
      fields: [
        {
          name: 'lead_researcher',
          label: 'Lead Researcher',
          type: 'text',
          required: true,
          placeholder: 'Your name or the primary researcher',
        },
        {
          name: 'team_members',
          label: 'Team Members',
          type: 'array',
          arrayType: 'object',
          arrayFields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'role', label: 'Role', type: 'text', required: true },
            { name: 'expertise', label: 'Expertise', type: 'text' },
            {
              name: 'contribution_percentage',
              label: 'Funding Share %',
              type: 'number',
              min: 0,
              max: 100,
            },
          ],
        },
        {
          name: 'open_collaboration',
          label: 'Open to New Collaborators',
          type: 'checkbox',
          hint: 'Allow other researchers to join this project',
        },
      ],
    },
    {
      id: 'progress',
      title: 'Progress Tracking',
      description: 'How you will share progress and milestones',
      fields: [
        {
          name: 'progress_frequency',
          label: 'Progress Update Frequency',
          type: 'select',
          required: true,
          options: [
            { value: 'weekly', label: 'Weekly Updates' },
            { value: 'biweekly', label: 'Bi-weekly Updates' },
            { value: 'monthly', label: 'Monthly Updates' },
            { value: 'milestone', label: 'Milestone-based Updates' },
            { value: 'as_needed', label: 'As-needed Updates' },
          ],
        },
        {
          name: 'transparency_level',
          label: 'Transparency Level',
          type: 'select',
          required: true,
          options: [
            { value: 'full', label: 'Full Transparency (all findings public)' },
            { value: 'progress', label: 'Progress Updates (methods/results shared)' },
            { value: 'milestone', label: 'Milestone Updates (key achievements)' },
            { value: 'minimal', label: 'Minimal Updates (basic status)' },
          ],
        },
        {
          name: 'voting_enabled',
          label: 'Enable Community Voting',
          type: 'checkbox',
          hint: 'Allow supporters to vote on research direction and priorities',
        },
      ],
    },
    {
      id: 'impact',
      title: 'Expected Impact',
      description: 'How this research will benefit humanity and science',
      fields: [
        {
          name: 'impact_areas',
          label: 'Impact Areas',
          type: 'multiselect',
          options: [
            { value: 'scientific_understanding', label: 'Scientific Understanding' },
            { value: 'technological_innovation', label: 'Technological Innovation' },
            { value: 'medical_advancement', label: 'Medical Advancement' },
            { value: 'environmental_protection', label: 'Environmental Protection' },
            { value: 'social_progress', label: 'Social Progress' },
            { value: 'economic_development', label: 'Economic Development' },
            { value: 'education', label: 'Education' },
            { value: 'policy_making', label: 'Policy Making' },
            { value: 'philosophical_insight', label: 'Philosophical Insight' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          name: 'target_audience',
          label: 'Target Audience',
          type: 'multiselect',
          options: [
            { value: 'scientists', label: 'Scientists/Researchers' },
            { value: 'policymakers', label: 'Policy Makers' },
            { value: 'businesses', label: 'Businesses' },
            { value: 'general_public', label: 'General Public' },
            { value: 'students', label: 'Students' },
            { value: 'practitioners', label: 'Industry Practitioners' },
            { value: 'ngos', label: 'NGOs/Non-profits' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          name: 'sdg_alignment',
          label: 'UN Sustainable Development Goals',
          type: 'multiselect',
          options: [
            { value: 'no_poverty', label: 'No Poverty' },
            { value: 'zero_hunger', label: 'Zero Hunger' },
            { value: 'good_health', label: 'Good Health and Well-being' },
            { value: 'quality_education', label: 'Quality Education' },
            { value: 'gender_equality', label: 'Gender Equality' },
            { value: 'clean_water', label: 'Clean Water and Sanitation' },
            { value: 'affordable_energy', label: 'Affordable and Clean Energy' },
            { value: 'decent_work', label: 'Decent Work and Economic Growth' },
            { value: 'industry_innovation', label: 'Industry, Innovation and Infrastructure' },
            { value: 'reduced_inequalities', label: 'Reduced Inequalities' },
            { value: 'sustainable_cities', label: 'Sustainable Cities and Communities' },
            { value: 'responsible_consumption', label: 'Responsible Consumption and Production' },
            { value: 'climate_action', label: 'Climate Action' },
            { value: 'life_below_water', label: 'Life Below Water' },
            { value: 'life_on_land', label: 'Life on Land' },
            { value: 'peace_justice', label: 'Peace and Justice Strong Institutions' },
            { value: 'partnerships', label: 'Partnerships for the Goals' },
          ],
        },
      ],
    },
  ],

  // Default values for new research entities
  defaults: {
    funding_model: 'donation',
    transparency_level: 'progress',
    progress_frequency: 'monthly',
    voting_enabled: true,
    open_collaboration: true,
    status: 'draft',
    is_public: true,
    is_featured: false,
  },

  // Validation rules
  validation: {
    custom: [
      {
        field: 'funding_goal_sats',
        rule: (value: unknown) => typeof value === 'number' && value >= 1000,
        message: 'Funding goal must be at least 1,000',
      },
      {
        field: 'team_members',
        rule: (value: unknown) => {
          if (!value || !Array.isArray(value)) {
            return true;
          }
          const members = value as Array<{ contribution_percentage?: number }>;
          return (
            members.reduce(
              (sum: number, member) => sum + (member.contribution_percentage || 0),
              0
            ) <= 100
          );
        },
        message: 'Total contribution percentages cannot exceed 100%',
      },
    ],
  },

  // Permissions
  permissions: {
    create: 'authenticated',
    read: 'public',
    update: 'owner',
    delete: 'owner',
  },
};
