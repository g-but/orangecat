'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Minus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import {
  RESEARCH_FIELDS,
  METHODOLOGIES,
  TIMELINES,
  FUNDING_MODELS,
  PROGRESS_FREQUENCIES,
  TRANSPARENCY_LEVELS,
  type ResourceNeedType,
  type ResourceNeedPriority,
  type ImpactArea as ImpactAreaType,
} from '@/config/research';

interface TeamMember {
  name: string;
  role: string;
  expertise?: string;
  contribution_percentage?: number;
}

interface ResourceNeed {
  type: ResourceNeedType;
  description?: string;
  estimated_cost_sats?: number;
  priority: ResourceNeedPriority;
}

interface ImpactArea {
  area: ImpactAreaType;
  description?: string;
}

export default function CreateResearchEntity() {
  const router = useRouter();
  const { formatAmount, displayCurrency } = useDisplayCurrency();
  const [loading, setLoading] = useState(false);

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('');
  const [methodology, setMethodology] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [timeline, setTimeline] = useState('');

  // Funding
  const [fundingGoal, setFundingGoal] = useState('');
  const [fundingModel, setFundingModel] = useState('donation');

  // Team
  const [leadResearcher, setLeadResearcher] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [openCollaboration, setOpenCollaboration] = useState(true);

  // Resources
  const [resourceNeeds, setResourceNeeds] = useState<ResourceNeed[]>([]);

  // Progress & Transparency
  const [progressFrequency, setProgressFrequency] = useState('monthly');
  const [transparencyLevel, setTransparencyLevel] = useState('progress');
  const [votingEnabled, setVotingEnabled] = useState(true);

  // Impact
  const [impactAreas, setImpactAreas] = useState<ImpactArea[]>([]);
  const [targetAudience, _setTargetAudience] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { name: '', role: '', expertise: '', contribution_percentage: 0 },
    ]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (
    index: number,
    field: keyof TeamMember,
    value: TeamMember[keyof TeamMember]
  ) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const _addResourceNeed = () => {
    setResourceNeeds([...resourceNeeds, { type: 'compute', priority: 'medium' }]);
  };

  const _removeResourceNeed = (index: number) => {
    setResourceNeeds(resourceNeeds.filter((_, i) => i !== index));
  };

  const _updateResourceNeed = (
    index: number,
    field: keyof ResourceNeed,
    value: ResourceNeed[keyof ResourceNeed]
  ) => {
    const updated = [...resourceNeeds];
    updated[index] = { ...updated[index], [field]: value };
    setResourceNeeds(updated);
  };

  const _addImpactArea = () => {
    setImpactAreas([...impactAreas, { area: 'scientific_understanding' }]);
  };

  const _removeImpactArea = (index: number) => {
    setImpactAreas(impactAreas.filter((_, i) => i !== index));
  };

  const _updateImpactArea = (
    index: number,
    field: keyof ImpactArea,
    value: ImpactArea[keyof ImpactArea]
  ) => {
    const updated = [...impactAreas];
    updated[index] = { ...updated[index], [field]: value };
    setImpactAreas(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const researchData = {
        title,
        description,
        field,
        methodology,
        expected_outcome: expectedOutcome,
        timeline,
        funding_goal_sats: parseInt(fundingGoal),
        funding_model: fundingModel,
        lead_researcher: leadResearcher,
        team_members: teamMembers,
        open_collaboration: openCollaboration,
        resource_needs: resourceNeeds,
        progress_frequency: progressFrequency,
        transparency_level: transparencyLevel,
        voting_enabled: votingEnabled,
        impact_areas: impactAreas,
        target_audience: targetAudience,
        is_public: isPublic,
      };

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(researchData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Research entity created successfully!');
        router.push(`/dashboard/research/${result.data.id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create research entity');
      }
    } catch (error) {
      logger.error('Error creating research entity', error, 'Research');
      toast.error('An error occurred while creating the research entity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Research Entity</h1>
          <p className="text-muted-foreground">
            Launch your independent research with decentralized funding
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Research Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Basic Research Information
            </CardTitle>
            <CardDescription>Define your research question and approach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Research Title *</label>
              <Input
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="The fundamental question your research addresses"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Research Description *</label>
              <Textarea
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="What understanding are you pursuing? What problem are you solving?"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Research Field *</label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESEARCH_FIELDS.map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Methodology *</label>
                <Select value={methodology} onValueChange={setMethodology}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select methodology" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODOLOGIES.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Expected Outcome *</label>
              <Textarea
                value={expectedOutcome}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setExpectedOutcome(e.target.value)
                }
                placeholder="What understanding or breakthrough do you hope to achieve?"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Research Timeline *</label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Funding */}
        <Card>
          <CardHeader>
            <CardTitle>Funding & Resources</CardTitle>
            <CardDescription>How your research will be funded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Funding Goal ({displayCurrency}) *</label>
                <Input
                  type="number"
                  value={fundingGoal}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFundingGoal(e.target.value)}
                  placeholder="1000000"
                  min="1000"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum {formatAmount(1000)}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Funding Model *</label>
                <Select value={fundingModel} onValueChange={setFundingModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_MODELS.map(fm => (
                      <SelectItem key={fm.value} value={fm.value}>
                        {fm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle>Research Team</CardTitle>
            <CardDescription>Who will be working on this research</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Lead Researcher *</label>
              <Input
                value={leadResearcher}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLeadResearcher(e.target.value)}
                placeholder="Your name or primary researcher"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="open-collaboration"
                checked={openCollaboration}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setOpenCollaboration(e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="open-collaboration" className="text-sm">
                Open to new collaborators
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Team Members</label>
                <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              </div>

              {teamMembers.map((member, index) => (
                <div key={index} className="border rounded-lg p-4 mb-2">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Input
                      placeholder="Name"
                      value={member.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateTeamMember(index, 'name', e.target.value)
                      }
                    />
                    <Input
                      placeholder="Role"
                      value={member.role}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateTeamMember(index, 'role', e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Input
                      placeholder="Expertise (optional)"
                      value={member.expertise || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateTeamMember(index, 'expertise', e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Funding share %"
                      value={member.contribution_percentage || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateTeamMember(
                          index,
                          'contribution_percentage',
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="0"
                      max="100"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTeamMember(index)}
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress & Transparency */}
        <Card>
          <CardHeader>
            <CardTitle>Progress & Transparency</CardTitle>
            <CardDescription>How you will share progress and involve the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Progress Updates *</label>
                <Select value={progressFrequency} onValueChange={setProgressFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRESS_FREQUENCIES.map(pf => (
                      <SelectItem key={pf.value} value={pf.value}>
                        {pf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Transparency Level *</label>
                <Select value={transparencyLevel} onValueChange={setTransparencyLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSPARENCY_LEVELS.map(tl => (
                      <SelectItem key={tl.value} value={tl.value}>
                        {tl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="voting-enabled"
                checked={votingEnabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setVotingEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="voting-enabled" className="text-sm">
                Enable community voting on research direction
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-public"
                checked={isPublic}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="is-public" className="text-sm">
                Make this research entity public
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Research Entity'}
          </Button>
        </div>
      </form>
    </div>
  );
}
