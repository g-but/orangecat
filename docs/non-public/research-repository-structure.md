# Research Repository Structure & Credibility Assessment Framework

**Version:** 1.0
**Date:** January 6, 2026
**Purpose:** Structured storage and credibility assessment of research sources
**Integration:** Stream of Consciousness Research System

## Repository Architecture

### Core Principles

1. **Transparency First:** All credibility assessments must be reproducible and auditable
2. **Multi-dimensional Evaluation:** No single metric determines credibility
3. **Continuous Assessment:** Credibility scores update as new evidence emerges
4. **Researcher Independence:** Automated bias detection and transparency requirements

---

## Database Schema

### 1. **Research Topics Table**

```sql
CREATE TABLE research_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extraction_method TEXT, -- 'manual', 'ai_generated', 'crowdsourced'
  source_recording_id UUID, -- Links to original stream of consciousness recording
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Topic relationships
  parent_topic_id UUID REFERENCES research_topics(id), -- For topic hierarchies
  related_topics UUID[] DEFAULT '{}', -- Array of related topic IDs

  -- Research status
  research_status TEXT DEFAULT 'proposed' CHECK (research_status IN ('proposed', 'active', 'completed', 'abandoned')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  search_vector TSVECTOR, -- For full-text search
  metadata JSONB DEFAULT '{}' -- Extensible metadata storage
);
```

### 2. **Research Questions Table**

```sql
CREATE TABLE research_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES research_topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('hypothesis', 'exploratory', 'descriptive', 'causal', 'comparative')),
  specificity_score DECIMAL(3,2) CHECK (specificity_score >= 0 AND specificity_score <= 1),

  -- Research design
  methodology_suggestions TEXT[],
  required_sample_size INTEGER,
  estimated_timeline INTERVAL,
  resource_requirements TEXT[],

  -- Status tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'answered', 'rejected')),
  assigned_to UUID REFERENCES profiles(id),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

  -- Results
  findings_summary TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  limitations TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **Research Sources Table**

```sql
CREATE TABLE research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES research_topics(id) ON DELETE CASCADE,
  question_id UUID REFERENCES research_questions(id) ON DELETE CASCADE,

  -- Basic source information
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}', -- Array of author names
  abstract TEXT,
  publication_date DATE,
  url TEXT,
  doi TEXT UNIQUE,
  isbn TEXT,

  -- Publication details
  publication_type TEXT NOT NULL CHECK (publication_type IN (
    'journal_article', 'conference_paper', 'book', 'book_chapter',
    'preprint', 'thesis', 'technical_report', 'working_paper',
    'patent', 'dataset', 'software', 'blog_post', 'news_article',
    'government_report', 'white_paper', 'other'
  )),
  journal_name TEXT,
  conference_name TEXT,
  publisher TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,

  -- Content and methodology
  full_text_available BOOLEAN DEFAULT false,
  methodology TEXT, -- Free text description
  study_design TEXT CHECK (study_design IN (
    'randomized_controlled_trial', 'cohort_study', 'case_control_study',
    'cross_sectional_study', 'longitudinal_study', 'meta_analysis',
    'systematic_review', 'qualitative_study', 'theoretical_paper',
    'simulation', 'observational', 'experimental', 'other'
  )),
  sample_size INTEGER,
  population_description TEXT,

  -- Quality assessment
  peer_reviewed BOOLEAN DEFAULT false,
  impact_factor DECIMAL(5,3),
  citation_count INTEGER DEFAULT 0,
  altmetric_score INTEGER,

  -- Funding and conflicts
  funding_sources TEXT[] DEFAULT '{}',
  conflict_of_interest TEXT,
  industry_funded BOOLEAN DEFAULT false,

  -- Credibility assessment (computed)
  overall_credibility_score DECIMAL(3,2) CHECK (overall_credibility_score >= 0 AND overall_credibility_score <= 10),
  credibility_components JSONB DEFAULT '{}', -- Detailed breakdown

  -- User assessments
  user_ratings JSONB DEFAULT '{}', -- {user_id: rating, user_id: rating}
  average_user_rating DECIMAL(3,2),

  -- Metadata
  language TEXT DEFAULT 'en',
  keywords TEXT[] DEFAULT '{}',
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified TIMESTAMP WITH TIME ZONE,

  -- Search and indexing
  search_vector TSVECTOR,
  embeddings VECTOR(1536), -- For semantic search (OpenAI embeddings)

  -- Extensible metadata
  custom_metadata JSONB DEFAULT '{}'
);
```

### 4. **Source Credibility Assessments Table**

```sql
CREATE TABLE credibility_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES research_sources(id) ON DELETE CASCADE,
  assessor_type TEXT NOT NULL CHECK (assessor_type IN ('ai_automated', 'expert_reviewer', 'crowdsourced', 'author_self')),

  -- Assessment components
  methodology_rigor DECIMAL(3,2) CHECK (methodology_rigor >= 0 AND methodology_rigor <= 10),
  methodology_notes TEXT,

  author_expertise DECIMAL(3,2) CHECK (author_expertise >= 0 AND author_expertise <= 10),
  author_notes TEXT,

  publication_quality DECIMAL(3,2) CHECK (publication_quality >= 0 AND publication_quality <= 10),
  publication_notes TEXT,

  funding_independence DECIMAL(3,2) CHECK (funding_independence >= 0 AND funding_independence <= 10),
  funding_notes TEXT,

  replication_status DECIMAL(3,2) CHECK (replication_status >= 0 AND replication_status <= 10),
  replication_notes TEXT,

  -- Bias assessment
  selection_bias_risk TEXT CHECK (selection_bias_risk IN ('low', 'medium', 'high', 'very_high')),
  confirmation_bias_risk TEXT CHECK (confirmation_bias_risk IN ('low', 'medium', 'high', 'very_high')),
  publication_bias_risk TEXT CHECK (publication_bias_risk IN ('low', 'medium', 'high', 'very_high')),

  -- Overall assessment
  overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 10),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  assessment_summary TEXT,

  -- Assessment metadata
  assessed_by UUID REFERENCES profiles(id),
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessment_version TEXT DEFAULT '1.0',
  review_status TEXT DEFAULT 'draft' CHECK (review_status IN ('draft', 'reviewed', 'published', 'superseded')),

  -- Evidence and reasoning
  evidence_cited TEXT[] DEFAULT '{}', -- Links to supporting evidence
  counter_evidence TEXT[] DEFAULT '{}', -- Links to contradicting evidence
  limitations TEXT,

  -- Reproducibility
  assessment_reproducible BOOLEAN DEFAULT true,
  reproducibility_notes TEXT
);
```

### 5. **Research Projects Table**

```sql
CREATE TABLE research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lead_researcher UUID REFERENCES profiles(id),

  -- Project scope
  topic_ids UUID[] DEFAULT '{}', -- Topics this project addresses
  primary_question_id UUID REFERENCES research_questions(id),

  -- Project details
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'abandoned', 'on_hold')),
  project_type TEXT CHECK (project_type IN ('academic', 'industry', 'independent', 'crowdsourced')),

  -- Resources and funding
  funding_amount DECIMAL(12,2),
  funding_currency TEXT DEFAULT 'USD',
  funding_sources TEXT[] DEFAULT '{}',
  resource_requirements TEXT,

  -- Team and collaboration
  team_members UUID[] DEFAULT '{}',
  collaborators TEXT[] DEFAULT '{}', -- External collaborators
  institutions TEXT[] DEFAULT '{}',

  -- Progress tracking
  milestones JSONB DEFAULT '[]', -- Array of milestone objects
  current_milestone TEXT,
  completion_percentage DECIMAL(5,2) CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Outputs
  publications TEXT[] DEFAULT '{}', -- DOIs or URLs
  datasets TEXT[] DEFAULT '{}', -- Dataset identifiers
  software_repositories TEXT[] DEFAULT '{}', -- GitHub URLs etc.
  presentations TEXT[] DEFAULT '{}',

  -- Impact assessment
  citation_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  social_impact_score DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Credibility Assessment Framework

### Automated Credibility Scoring Algorithm

```typescript
interface CredibilityWeights {
  methodology: 0.3;
  author: 0.25;
  publication: 0.2;
  funding: 0.15;
  replication: 0.1;
}

function calculateOverallCredibility(assessment: CredibilityAssessment): number {
  const weights = CredibilityWeights;

  return (
    assessment.methodology_rigor * weights.methodology +
    assessment.author_expertise * weights.author +
    assessment.publication_quality * weights.publication +
    assessment.funding_independence * weights.funding +
    assessment.replication_status * weights.replication
  );
}
```

### Component Scoring Guidelines

#### 1. **Methodology Rigor (0-10)**
- **10:** Randomized controlled trial with large sample, proper controls, blinded
- **8-9:** Well-designed observational study, systematic review
- **6-7:** Case-control or cohort study with good design
- **4-5:** Cross-sectional study, qualitative research
- **2-3:** Anecdotal evidence, expert opinion
- **0-1:** No methodology described, clearly flawed design

#### 2. **Author Expertise (0-10)**
- **10:** Multiple publications in field, cited extensively, institutional affiliation
- **8-9:** Several publications, some citations, relevant expertise
- **6-7:** Some publications or relevant experience
- **4-5:** Limited expertise but relevant background
- **2-3:** Minimal relevant experience
- **0-1:** No apparent expertise in the field

#### 3. **Publication Quality (0-10)**
- **10:** Nature, Science, top-tier journal (impact factor >20)
- **8-9:** High-impact journal in field (impact factor 10-20)
- **6-7:** Respected peer-reviewed journal (impact factor 5-10)
- **4-5:** Peer-reviewed journal (impact factor 1-5)
- **2-3:** Conference proceedings, working papers
- **0-1:** Unreviewed sources, blogs, social media

#### 4. **Funding Independence (0-10)**
- **10:** Government or academic funding, no conflicts declared
- **8-9:** Mixed funding with transparency
- **6-7:** Private foundation funding
- **4-5:** Industry funding with safeguards
- **2-3:** Direct industry funding
- **0-1:** Heavy industry funding, conflicts apparent

#### 5. **Replication Status (0-10)**
- **10:** Multiple successful replications
- **8-9:** At least one successful replication
- **6-7:** No replication attempts but methodology sound
- **4-5:** Replication attempted with mixed results
- **2-3:** Failed replication attempts
- **0-1:** Known replication failures or impossible to replicate

### Bias Detection Framework

#### Types of Bias Assessed
```typescript
interface BiasAssessment {
  selectionBias: {
    risk: 'low' | 'medium' | 'high' | 'very_high';
    indicators: string[];
    mitigation: string[];
  };
  confirmationBias: {
    risk: 'low' | 'medium' | 'high' | 'very_high';
    indicators: string[];
    mitigation: string[];
  };
  publicationBias: {
    risk: 'low' | 'medium' | 'high' | 'very_high';
    indicators: string[];
    mitigation: string[];
  };
  fundingBias: {
    risk: 'low' | 'medium' | 'high' | 'very_high';
    indicators: string[];
    mitigation: string[];
  };
}
```

#### Automated Bias Detection
```python
def detect_biases(source: ResearchSource, full_text: str = None) -> BiasAssessment:
    """Automated bias detection using NLP and metadata analysis"""

    # Selection bias detection
    selection_indicators = detect_selection_bias(full_text, source.methodology)

    # Confirmation bias detection
    confirmation_indicators = detect_confirmation_bias(full_text)

    # Publication bias detection
    publication_indicators = detect_publication_bias(source)

    # Funding bias detection
    funding_indicators = detect_funding_bias(source.funding_sources)

    return BiasAssessment(
        selectionBias=assess_selection_bias_risk(selection_indicators),
        confirmationBias=assess_confirmation_bias_risk(confirmation_indicators),
        publicationBias=assess_publication_bias_risk(publication_indicators),
        fundingBias=assess_funding_bias_risk(funding_indicators)
    )
```

---

## API Endpoints

### Research Topics API

```typescript
// GET /api/research/topics
interface GetTopicsRequest {
  category?: string;
  status?: ResearchStatus;
  priority?: Priority;
  limit?: number;
  offset?: number;
  search?: string;
}

// POST /api/research/topics
interface CreateTopicRequest {
  title: string;
  description: string;
  category: string;
  sourceRecordingId?: string;
}

// PUT /api/research/topics/:id
interface UpdateTopicRequest {
  title?: string;
  description?: string;
  category?: string;
  status?: ResearchStatus;
  priority?: Priority;
}
```

### Research Sources API

```typescript
// GET /api/research/sources
interface GetSourcesRequest {
  topicId?: string;
  credibilityMin?: number;
  credibilityMax?: number;
  publicationType?: PublicationType[];
  peerReviewed?: boolean;
  limit?: number;
  offset?: number;
}

// POST /api/research/sources
interface CreateSourceRequest {
  topicId: string;
  title: string;
  authors: string[];
  url?: string;
  doi?: string;
  publicationType: PublicationType;
  // ... other fields
}

// POST /api/research/sources/:id/assess
interface AssessCredibilityRequest {
  methodologyRigor: number;
  authorExpertise: number;
  publicationQuality: number;
  fundingIndependence: number;
  replicationStatus: number;
  notes?: string;
}
```

### Research Questions API

```typescript
// GET /api/research/questions
interface GetQuestionsRequest {
  topicId?: string;
  status?: QuestionStatus;
  type?: QuestionType;
  limit?: number;
  offset?: number;
}

// POST /api/research/questions
interface CreateQuestionRequest {
  topicId: string;
  question: string;
  type: QuestionType;
  methodologySuggestions?: string[];
}
```

---

## Frontend Components

### Topic Dashboard
```tsx
interface TopicDashboardProps {
  topics: ResearchTopic[];
  onTopicSelect: (topic: ResearchTopic) => void;
  filters: TopicFilters;
  sortBy: TopicSortOption;
}

const TopicDashboard: React.FC<TopicDashboardProps> = ({
  topics,
  onTopicSelect,
  filters,
  sortBy
}) => {
  // Implementation for topic browsing and management
};
```

### Source Credibility Viewer
```tsx
interface CredibilityViewerProps {
  source: ResearchSource;
  assessments: CredibilityAssessment[];
  onAssessmentAdd: (assessment: Partial<CredibilityAssessment>) => void;
}

const CredibilityViewer: React.FC<CredibilityViewerProps> = ({
  source,
  assessments,
  onAssessmentAdd
}) => {
  // Visual credibility assessment display
};
```

### Research Project Manager
```tsx
interface ProjectManagerProps {
  project: ResearchProject;
  onUpdate: (updates: Partial<ResearchProject>) => void;
  team: Profile[];
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  project,
  onUpdate,
  team
}) => {
  // Project progress tracking and management
};
```

---

## Integration with Stream of Consciousness System

### Automatic Topic Processing Pipeline

```typescript
class ResearchTopicProcessor {
  async processRecording(recording: AudioRecording): Promise<ResearchTopic[]> {
    // 1. Transcribe audio
    const transcript = await this.transcribeAudio(recording);

    // 2. Extract topics
    const topics = await this.extractTopics(transcript);

    // 3. Generate research questions
    for (const topic of topics) {
      topic.questions = await this.generateQuestions(topic);
    }

    // 4. Find related existing research
    for (const topic of topics) {
      topic.relatedSources = await this.findRelatedSources(topic);
    }

    // 5. Store in repository
    const savedTopics = await this.saveTopics(topics, recording.id);

    return savedTopics;
  }
}
```

### Continuous Learning System

```typescript
class CredibilityLearningSystem {
  async updateCredibilityModel(newAssessment: CredibilityAssessment): Promise<void> {
    // Update ML model with new assessment data
    await this.trainCredibilityModel([newAssessment]);

    // Recalculate credibility scores for affected sources
    await this.recalculateAffectedScores(newAssessment.sourceId);

    // Update search indices
    await this.updateSearchIndex(newAssessment.sourceId);
  }
}
```

---

## Quality Assurance & Auditing

### Automated Quality Checks

```typescript
class QualityAssuranceSystem {
  async auditSource(source: ResearchSource): Promise<AuditReport> {
    const issues: AuditIssue[] = [];

    // Check DOI validity
    if (source.doi && !(await this.validateDOI(source.doi))) {
      issues.push({
        type: 'invalid_doi',
        severity: 'high',
        message: 'DOI does not resolve to valid publication'
      });
    }

    // Check for duplicate sources
    const duplicates = await this.findDuplicateSources(source);
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate_source',
        severity: 'medium',
        message: `Found ${duplicates.length} potential duplicate sources`
      });
    }

    // Verify citation count accuracy
    if (source.citation_count && !(await this.verifyCitationCount(source))) {
      issues.push({
        type: 'inaccurate_citation_count',
        severity: 'low',
        message: 'Citation count may be outdated'
      });
    }

    return { sourceId: source.id, issues, overallQuality: this.calculateQualityScore(issues) };
  }
}
```

### Manual Review Workflows

```typescript
interface ReviewWorkflow {
  stages: ReviewStage[];
  requiredReviewers: number;
  consensusThreshold: number;
}

const DEFAULT_REVIEW_WORKFLOW: ReviewWorkflow = {
  stages: [
    { name: 'initial_assessment', type: 'automated', requiredApprovals: 0 },
    { name: 'peer_review', type: 'expert', requiredApprovals: 2 },
    { name: 'community_review', type: 'crowdsourced', requiredApprovals: 5 },
    { name: 'final_publication', type: 'editorial', requiredApprovals: 1 }
  ],
  requiredReviewers: 3,
  consensusThreshold: 0.7
};
```

---

## Security & Access Control

### Role-Based Permissions

```typescript
enum UserRole {
  GUEST = 'guest',           // Can view public topics/sources
  CONTRIBUTOR = 'contributor', // Can add sources and topics
  RESEARCHER = 'researcher',  // Can create research projects
  REVIEWER = 'reviewer',      // Can assess credibility
  MODERATOR = 'moderator',    // Can moderate content
  ADMIN = 'admin'            // Full system access
}

interface Permissions {
  canCreateTopics: boolean;
  canEditTopics: boolean;
  canDeleteTopics: boolean;
  canAssessCredibility: boolean;
  canModerateContent: boolean;
  canViewPrivateSources: boolean;
  canExportData: boolean;
}
```

### Data Privacy & Ethics

- **Anonymization:** Automatic removal of personal identifiers
- **Consent Management:** Explicit user consent for data usage
- **Right to Deletion:** Users can request deletion of their data
- **Ethical Review:** Automated flagging of sensitive research topics
- **Transparency:** Full audit trail of all data modifications

---

## Performance & Scalability

### Database Optimization

```sql
-- Performance indexes
CREATE INDEX idx_research_topics_category ON research_topics(category);
CREATE INDEX idx_research_topics_status ON research_topics(research_status);
CREATE INDEX idx_research_sources_topic_id ON research_sources(topic_id);
CREATE INDEX idx_research_sources_credibility ON research_sources(overall_credibility_score DESC);
CREATE INDEX idx_credibility_assessments_source_id ON credibility_assessments(source_id);

-- Full-text search indexes
CREATE INDEX idx_topics_search ON research_topics USING gin(search_vector);
CREATE INDEX idx_sources_search ON research_sources USING gin(search_vector);

-- Semantic search index (using pgvector)
CREATE INDEX idx_sources_embeddings ON research_sources USING ivfflat(embeddings vector_cosine_ops);
```

### Caching Strategy

```typescript
interface CacheConfig {
  topicList: { ttl: 300, maxSize: 1000 };      // 5 minutes
  sourceDetails: { ttl: 3600, maxSize: 500 };  // 1 hour
  credibilityScores: { ttl: 86400, maxSize: 2000 }; // 24 hours
  searchResults: { ttl: 180, maxSize: 100 };   // 3 minutes
}
```

---

## Monitoring & Analytics

### Usage Metrics

```typescript
interface RepositoryMetrics {
  totalTopics: number;
  totalSources: number;
  totalQuestions: number;
  averageCredibilityScore: number;
  topicsByCategory: Record<string, number>;
  sourcesByPublicationType: Record<string, number>;
  userEngagement: {
    activeUsers: number;
    topicsCreated: number;
    sourcesAdded: number;
    assessmentsCompleted: number;
  };
  systemHealth: {
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}
```

### Research Impact Tracking

```typescript
interface ResearchImpact {
  topicId: string;
  citations: number;
  downloads: number;
  socialShares: number;
  mediaCoverage: number;
  policyInfluence: string[];
  practicalApplications: string[];
  followUpResearch: string[];
}
```

---

This repository structure provides a comprehensive foundation for credible, transparent, and collaborative research management, enabling the stream of consciousness system to generate not just topics, but entire research ecosystems.