# Comprehensive Contract Examples: Real-World Scenarios

**Created:** 2025-12-30  
**Purpose:** Detailed, realistic examples showing contract flexibility and modularity

---

## 🎯 Key Principles

1. **Contracts can be sent to individuals OR groups**
   - **Individual** → Direct decision (accept/decline)
   - **Group** → Voting process (governance-based)

2. **Contracts are flexible and modular**
   - Terms are JSONB (can define anything)
   - Contract types are extensible
   - Same system for all relationships

3. **Real-world relationships are complex**
   - Rental, ownership, employment, service, partnership
   - All handled through the same contract system

---

## 📖 Scenario 1: Building Group Setup (Complete Story)

### The Situation

"Sunset Apartments" is a residential building in Zurich. The building group manages the property collectively.

### Step 1: Building Group Created

```
Sarah (building manager) creates "Sunset Apartments" group
  ↓
Group created:
  - Label: "building"
  - Governance: "consensus" (all residents vote)
  - Visibility: "private" (only residents see)
  ↓
Sarah is founder/admin
```

### Step 2: Building Asset Created

```
Sarah creates building asset:
  - Title: "Sunset Apartments"
  - Type: "Real Estate"
  - Value: 5,000,000 CHF
  - Location: "Zurich, Switzerland"
  - Units: 12 apartments
  ↓
Asset created with:
  - actor_id: Sunset Apartments group (group owns the building)
```

### Step 3: Maria Wants to Rent Apartment 3B

**Maria's Journey:**
```
Maria searches for apartments
  ↓
Finds "Sunset Apartments" group
  ↓
Sees: "Apartment 3B available for rent"
  ↓
Clicks "Request to Rent"
  ↓
Fills out rental application:
  - Personal info
  - Rental period: 12 months
  - Monthly rent: 1,500 CHF
  ↓
Clicks "Submit Request"
```

**System Creates Proposal:**
```
Proposal created in Sunset Apartments group:
  ├─ Title: "Maria requests to rent Apartment 3B"
  ├─ Contract Type: "rental"
  ├─ Party A: Maria (individual actor)
  ├─ Party B: Sunset Apartments (group actor)
  ├─ Subject: Building asset (Apartment 3B unit)
  ├─ Terms: {
  │   "rental_unit": "Apartment 3B",
  │   "monthly_rent": 1500,
  │   "currency": "CHF",
  │   "rent_period_months": 12,
  │   "start_date": "2025-02-01",
  │   "deposit": 3000,
  │   "rights": ["exclusive_use", "privacy", "quiet_enjoyment"],
  │   "responsibilities": [
  │     "maintain_cleanliness",
  │     "pay_rent_on_time",
  │     "report_maintenance_issues",
  │     "no_subletting_without_permission"
  │   ],
  │   "landlord_responsibilities": [
  │     "maintain_building",
  │     "handle_repairs",
  │     "provide_utilities"
  │   ]
  │ }
  └─ Status: "proposed" (sent to GROUP)
```

**Group Decision Process:**
```
All building residents see proposal
  ↓
Discussion:
  - Check apartment availability
  - Review Maria's application
  - Discuss rental terms
  ↓
Voting (consensus governance - 100% needed):
  - Resident 1: "Yes" ✅
  - Resident 2: "Yes" ✅
  - Resident 3: "Yes" ✅
  - ... (all 12 residents vote)
  ↓
Vote passes (100% consensus)
  ↓
Contract created:
  ├─ Status: "active"
  ├─ Maria is now tenant
  └─ Apartment 3B is rented
```

**Result:**
```
Maria's dashboard:
  "Active Contracts: Sunset Apartments (Rental - Apartment 3B)"
  "Monthly Rent: 1,500 CHF"
  "Next Payment: 2025-02-01"
  ↓
Building group dashboard:
  "Active Rentals: Maria (Apartment 3B)"
  "Monthly Income: 1,500 CHF"
  "Available Units: 11/12"
```

---

## 📖 Scenario 2: Room Rental (More Granular)

### The Situation

"Co-living Space Zurich" is a group that owns a large apartment. They rent out individual rooms.

### Step-by-Step Journey

**Step 1: Co-living Group Exists**
```
Co-living Space Zurich:
  - Group created
  - Owns apartment asset (5 bedrooms, shared kitchen/living)
  - Has 4 current residents
  - 1 room available
```

**Step 2: David Wants to Rent a Room**
```
David searches for rooms
  ↓
Finds "Co-living Space Zurich"
  ↓
Sees: "Room 5 available - 800 CHF/month"
  ↓
Clicks "Request to Rent Room"
  ↓
Fills out:
  - Rental period: 6 months
  - Monthly rent: 800 CHF
  - Shared spaces: Kitchen, living room, bathroom
  ↓
Clicks "Submit Request"
```

**Step 3: Contract Sent to Group**
```
Proposal created:
  ├─ Contract Type: "rental"
  ├─ Party A: David (individual)
  ├─ Party B: Co-living Space Zurich (group)
  ├─ Subject: Apartment asset (Room 5)
  ├─ Terms: {
  │   "rental_unit": "Room 5",
  │   "monthly_rent": 800,
  │   "currency": "CHF",
  │   "rent_period_months": 6,
  │   "shared_spaces": ["kitchen", "living_room", "bathroom"],
  │   "rights": ["exclusive_use_of_room", "shared_use_of_common_areas"],
  │   "responsibilities": [
  │     "maintain_room_cleanliness",
  │     "respect_shared_spaces",
  │     "follow_house_rules",
  │     "pay_rent_on_time"
  │   ],
  │   "house_rules": [
  │     "quiet_hours_22:00-08:00",
  │     "clean_after_using_kitchen",
  │     "no_smoking",
  │     "respect_privacy"
  │   ]
  │ }
  └─ Status: "proposed" (sent to GROUP)
```

**Step 4: Group Votes**
```
Current residents see proposal:
  "David wants to rent Room 5 - 800 CHF/month"
  ↓
Residents discuss:
  - Review David's profile
  - Check compatibility
  - Discuss house rules
  ↓
Voting (democratic - 51% majority):
  - Resident 1: "Yes" ✅
  - Resident 2: "Yes" ✅
  - Resident 3: "Yes" ✅
  - Resident 4: "Yes" ✅
  ↓
Vote passes (100% > 51% threshold)
  ↓
Contract created:
  ├─ Status: "active"
  └─ David is now resident
```

---

## 📖 Scenario 3: Individual Landlord (No Group)

### The Situation

John owns an apartment building individually (not a group). Maria wants to rent from him.

### Step-by-Step Journey

**Step 1: John Owns Building**
```
John (individual):
  - Has actor_id (individual actor)
  - Owns building asset
  - Manages it himself
```

**Step 2: Maria Requests Rental**
```
Maria finds John's listing
  ↓
Clicks "Request to Rent"
  ↓
Fills out rental application
  ↓
Clicks "Submit Request"
```

**Step 3: Contract Sent to Individual**
```
Proposal created:
  ├─ Contract Type: "rental"
  ├─ Party A: Maria (individual)
  ├─ Party B: John (individual)
  ├─ Subject: Building asset (Apartment 3B)
  ├─ Terms: { ... rental terms ... }
  └─ Status: "proposed" (sent to INDIVIDUAL)
```

**Step 4: Individual Decision (No Voting)**
```
John receives notification:
  "Maria wants to rent Apartment 3B - 1,500 CHF/month"
  ↓
John reviews:
  - Maria's application
  - Rental terms
  - References
  ↓
John decides:
  - Accept ✅
  - Decline ❌
  - Counter-offer (modify terms)
  ↓
If John accepts:
  Contract status: "active"
  Maria can move in
```

**Key Difference:**
- **Group** → Voting process (governance)
- **Individual** → Direct decision (accept/decline/counter)

---

## 📖 Scenario 4: Employment - Individual Hires Individual

### The Situation

Alex (individual, not a company) wants to hire David as a freelance developer for a personal project.

### Step-by-Step Journey

**Step 1: Alex Creates Employment Proposal**
```
Alex goes to his profile
  ↓
Clicks "Hire Someone"
  ↓
Searches for "David"
  ↓
Fills out:
  - Job: "Freelance Developer"
  - Project: "Build personal website"
  - Payment: 10,000 SATS (one-time)
  - Timeline: 2 weeks
  ↓
Clicks "Send Employment Proposal"
```

**Step 2: Contract Sent to Individual**
```
Proposal created:
  ├─ Contract Type: "employment"
  ├─ Party A: David (individual)
  ├─ Party B: Alex (individual)
  ├─ Terms: {
  │   "job_title": "Freelance Developer",
  │   "project": "Build personal website",
  │   "compensation": 10000,
  │   "currency": "SATS",
  │   "payment_type": "one_time",
  │   "timeline": "2_weeks",
  │   "deliverables": ["responsive_website", "source_code"]
  │ }
  └─ Status: "proposed" (sent to INDIVIDUAL)
```

**Step 3: David Decides**
```
David receives notification:
  "Alex wants to hire you as Freelance Developer"
  ↓
David reviews:
  - Project scope
  - Payment terms
  - Timeline
  ↓
David decides:
  - Accept ✅
  - Decline ❌
  - Counter-offer (negotiate terms)
  ↓
If David accepts:
  Contract status: "active"
  Work begins
```

---

## 📖 Scenario 5: Employment - Group Hires Individual

### The Situation

OrangeCat Inc. (company group) wants to hire David as a full-time employee.

### Step-by-Step Journey

**Step 1: Company Creates Employment Proposal**
```
Alex (founder of OrangeCat Inc.) goes to company group page
  ↓
Clicks "Create Proposal" → "Hire Employee"
  ↓
Searches for "David"
  ↓
Fills out:
  - Job Title: "Senior Developer"
  - Salary: 5,000 SATS/month
  - Start Date: 2025-01-01
  - Responsibilities: "Develop features, maintain codebase"
  ↓
Clicks "Create Proposal"
```

**Step 2: Contract Sent to Group (for Approval)**
```
Proposal created in OrangeCat Inc. group:
  ├─ Title: "Hire David as Senior Developer"
  ├─ Contract Type: "employment"
  ├─ Party A: David (individual)
  ├─ Party B: OrangeCat Inc. (group)
  ├─ Terms: {
  │   "job_title": "Senior Developer",
  │   "employment_type": "full_time",
  │   "salary": 5000,
  │   "currency": "SATS",
  │   "payment_frequency": "monthly",
  │   "start_date": "2025-01-01",
  │   "responsibilities": [...],
  │   "benefits": ["health_insurance", "flexible_hours"]
  │ }
  └─ Status: "proposed" (sent to GROUP for approval)
```

**Step 3: Company Votes**
```
OrangeCat Inc. members see proposal:
  "Hire David as Senior Developer - 5,000 SATS/month"
  ↓
Members discuss:
  - Review David's qualifications
  - Discuss salary
  - Check budget
  ↓
Voting (hierarchical governance - founder decides):
  - Alex (founder): "Yes" ✅
  ↓
Vote passes (founder has authority)
  ↓
Contract status: "proposed" (now sent to David for acceptance)
```

**Step 4: David Accepts**
```
David receives notification:
  "OrangeCat Inc. wants to hire you as Senior Developer"
  ↓
David reviews contract
  ↓
David decides:
  - Accept ✅
  - Decline ❌
  - Counter-offer (negotiate salary/terms)
  ↓
If David accepts:
  Contract status: "active"
  David is now employee
```

**Key Point:** Two-step process:
1. **Group approves** (voting)
2. **Individual accepts** (direct decision)

---

## 📖 Scenario 6: Service Contract - Group to Group

### The Situation

OrangeCat Inc. (company group) wants to hire Web Design Co. (another company group) for website redesign.

### Step-by-Step Journey

**Step 1: OrangeCat Creates Service Proposal**
```
Alex goes to OrangeCat Inc. group page
  ↓
Clicks "Create Proposal" → "Hire Contractor"
  ↓
Searches for "Web Design Co." (another group)
  ↓
Fills out:
  - Service: "Website Redesign"
  - Scope: "Complete website redesign and development"
  - Payment: 50,000 SATS (one-time project fee)
  - Delivery: 2025-03-31
  ↓
Clicks "Create Proposal"
```

**Step 2: Contract Sent to OrangeCat Group (for Approval)**
```
Proposal created in OrangeCat Inc. group:
  ├─ Title: "Hire Web Design Co. for Website Redesign"
  ├─ Contract Type: "service"
  ├─ Party A: Web Design Co. (group)
  ├─ Party B: OrangeCat Inc. (group)
  ├─ Terms: {
  │   "service_type": "web_design",
  │   "project_scope": "Complete website redesign",
  │   "compensation": 50000,
  │   "currency": "SATS",
  │   "payment_type": "one_time",
  │   "delivery_date": "2025-03-31",
  │   "milestones": [
  │     { "phase": "design", "payment": 20000 },
  │     { "phase": "development", "payment": 30000 }
  │   ]
  │ }
  └─ Status: "proposed" (sent to OrangeCat GROUP)
```

**Step 3: OrangeCat Votes**
```
OrangeCat Inc. members vote:
  - Alex: "Yes" ✅
  - Other admins: "Yes" ✅
  ↓
Vote passes
  ↓
Contract status: "proposed" (now sent to Web Design Co. GROUP)
```

**Step 4: Web Design Co. Votes**
```
Web Design Co. members see proposal:
  "OrangeCat Inc. wants to hire us for website redesign - 50,000 SATS"
  ↓
Web Design Co. members discuss:
  - Review project scope
  - Check capacity
  - Discuss timeline
  ↓
Web Design Co. members vote:
  - Designer 1: "Yes" ✅
  - Designer 2: "Yes" ✅
  - Admin: "Yes" ✅
  ↓
Vote passes
  ↓
Contract status: "active"
  Both companies can now work on project
```

**Key Point:** Both groups vote (two-step process)

---

## 📖 Scenario 7: Ownership Transfer - Individual to Group

### The Situation

Maria owns an apartment individually. She wants to transfer ownership to the building group (maybe converting to co-op).

### Step-by-Step Journey

**Step 1: Maria Owns Apartment**
```
Maria:
  - Has apartment asset
  - actor_id: Maria's actor_id (she owns it)
```

**Step 2: Maria Proposes Ownership Transfer**
```
Maria goes to apartment asset page
  ↓
Clicks "Transfer Ownership"
  ↓
Selects "Sunset Apartments" group
  ↓
Fills out proposal:
  - Title: "Transfer Apartment 3B to Building Group"
  - Terms: {
  │   "ownership_percentage": 100,
  │   "rights": ["manage", "maintain", "decide_improvements"],
  │   "responsibilities": ["maintain_property", "pay_maintenance"]
  │ }
  ↓
Clicks "Create Proposal"
```

**Step 3: Contract Sent to Building Group**
```
Proposal created in Sunset Apartments group:
  ├─ Contract Type: "ownership"
  ├─ Party A: Sunset Apartments (group)
  ├─ Party B: Apartment asset
  ├─ Subject Type: "asset"
  ├─ Subject ID: apartment_asset_id
  ├─ Terms: { ... ownership terms ... }
  └─ Status: "proposed" (sent to GROUP)
```

**Step 4: Building Group Votes**
```
All residents vote:
  - Resident 1: "Yes" ✅
  - Resident 2: "Yes" ✅
  - ... (all vote)
  ↓
Vote passes (consensus - 100%)
  ↓
Contract created:
  ├─ Status: "active"
  ├─ Apartment asset's actor_id updated to group's actor_id
  └─ Building group now owns the apartment
```

---

## 🎯 Decision-Making Matrix

| Contract Sent To | Decision Process | Example |
|-----------------|-----------------|---------|
| **Individual** | Direct decision (accept/decline/counter) | Maria rents from John (individual landlord) |
| **Group** | Voting process (governance-based) | Maria rents from Sunset Apartments (group) |
| **Group → Individual** | Group votes first, then individual accepts | OrangeCat Inc. hires David |
| **Group → Group** | Both groups vote | OrangeCat Inc. hires Web Design Co. |

---

## 💡 Contract Flexibility Examples

### Example 1: Rental Contract Variations

**Apartment Rental:**
```json
{
  "rental_unit": "Apartment 3B",
  "monthly_rent": 1500,
  "rent_period_months": 12,
  "rights": ["exclusive_use", "privacy"],
  "responsibilities": ["maintain_cleanliness", "pay_rent"]
}
```

**Room Rental:**
```json
{
  "rental_unit": "Room 5",
  "monthly_rent": 800,
  "rent_period_months": 6,
  "shared_spaces": ["kitchen", "living_room", "bathroom"],
  "house_rules": ["quiet_hours", "clean_after_use"]
}
```

**Parking Space Rental:**
```json
{
  "rental_unit": "Parking Space #12",
  "monthly_rent": 100,
  "rent_period_months": 12,
  "rights": ["exclusive_use"],
  "responsibilities": ["no_storage", "valid_vehicle_only"]
}
```

**All use the same contract type ("rental") but different terms!**

### Example 2: Employment Contract Variations

**Full-Time Employee:**
```json
{
  "job_title": "Senior Developer",
  "employment_type": "full_time",
  "salary": 5000,
  "payment_frequency": "monthly",
  "benefits": ["health_insurance", "vacation_days"]
}
```

**Freelance Contractor:**
```json
{
  "job_title": "Freelance Developer",
  "employment_type": "contractor",
  "compensation": 10000,
  "payment_type": "one_time",
  "project_scope": "Build website",
  "timeline": "2_weeks"
}
```

**Part-Time Employee:**
```json
{
  "job_title": "Part-Time Designer",
  "employment_type": "part_time",
  "salary": 2000,
  "payment_frequency": "monthly",
  "hours_per_week": 20
}
```

**All use the same contract type ("employment") but different terms!**

---

## 📖 Scenario 8: Temporary Weekend Work - Bar Needs Staff

### The Situation

"Zurich Bar Collective" is a bar owned by three friends (a group). They need someone to work this weekend (Saturday and Sunday) because one of the regular staff is sick.

### ⚠️ Current Reality Check

**Job posting system does NOT exist yet.** See `docs/development/JOB_POSTING_ANALYSIS.md` for what needs to be built.

**What exists:**
- ✅ Proposals system (partial - schema + 1 API route, no service layer)
- ✅ Groups system (complete)
- ✅ Events system (complete)

**What doesn't exist:**
- ❌ Job posting system
- ❌ Contracts system
- ❌ Marketplace/browse functionality

**For now, bar would use manual process:**
- Create group event: "Weekend Bartender Needed"
- Post announcement
- Contractors contact directly
- Manual coordination and payment

**Below is how it WOULD work after building the system:**

### Option A: Bar Creates Job Posting (Recommended - Needs to Be Built)

**Step 1: Bar Group Creates Work Opportunity**
```
Alex (one of the bar owners) goes to "Zurich Bar Collective" group page
  ↓
Clicks "Create Proposal" → "Post Work Opportunity"
  ↓
Fills out:
  - Title: "Weekend Bartender Needed - This Weekend"
  - Description: "Need bartender for Saturday and Sunday, 18:00-02:00"
  - Work Type: "temporary"
  - Dates: Saturday 2025-01-04, Sunday 2025-01-05
  - Hours: 8 hours per day (16 hours total)
  - Payment: 2,000 SATS per day (4,000 SATS total)
  - Skills Required: "Bartending experience, friendly, reliable"
  ↓
Clicks "Post Opportunity"
```

**Step 2: Opportunity Posted (Public or Group-Only)**

**⚠️ This requires building a job posting system:**

```sql
-- Would need new table:
CREATE TABLE job_postings (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES groups(id),
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  job_type text, -- 'temporary', 'full_time', etc.
  terms jsonb,  -- Flexible terms
  status text DEFAULT 'open', -- 'open', 'closed', 'filled'
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**System would create:**
```
Job Posting created:
  ├─ Posted By: Zurich Bar Collective (group)
  ├─ Job Type: "temporary"
  ├─ Status: "open" (accepting applications)
  ├─ Terms: {
  │   "work_type": "temporary",
  │   "job_title": "Weekend Bartender",
  │   "dates": ["2025-01-04", "2025-01-05"],
  │   "hours_per_day": 8,
  │   "total_hours": 16,
  │   "payment_per_day": 2000,
  │   "total_payment": 4000,
  │   "currency": "SATS",
  │   "payment_timing": "after_completion",
  │   "skills_required": ["bartending", "friendly", "reliable"],
  │   "location": "Zurich Bar, Main Street 123"
  │ }
  └─ Visibility: "public" (or "group_members_only")
```

**Step 3: Contractors See Opportunity**

**⚠️ This requires building browse/marketplace functionality:**

```
David (freelance worker) goes to /jobs (or /marketplace/work)
  ↓
Browses job postings:
  - Can filter by: location, type, payment, dates
  - Can search: "bartender", "weekend", "Zurich"
  ↓
Sees: "Weekend Bartender Needed - This Weekend"
     "4,000 SATS for 2 days"
     "Zurich Bar Collective"
  ↓
Clicks "Apply for This Opportunity"
  ↓
Fills out application form:
  - Experience: "5 years bartending"
  - Availability: "Available both days"
  - References: (optional)
  - Cover letter: (optional)
  ↓
Clicks "Submit Application"
```

**Would need:**
- `/jobs` or `/marketplace/work` page
- Job posting browse/search functionality
- Application form component

**Step 4: Application Created**

**⚠️ This requires building applications system:**

```sql
-- Would need new table:
CREATE TABLE job_applications (
  id uuid PRIMARY KEY,
  posting_id uuid REFERENCES job_postings(id),
  applicant_id uuid REFERENCES auth.users(id),
  cover_letter text,
  experience jsonb,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at timestamptz DEFAULT now(),
  UNIQUE(posting_id, applicant_id)
);
```

**System creates:**
```
Application created:
  ├─ Job Posting: "Weekend Bartender Needed"
  ├─ Applicant: David (individual)
  ├─ Status: "pending" (waiting for bar review)
  ├─ Application Data: {
  │   "experience": "5 years bartending",
  │   "availability": "Available both days",
  │   "cover_letter": "..."
  │ }
  └─ Sent to: Zurich Bar Collective group
```

**Alternative: Could use proposals system (if completed):**
```
System creates PROPOSAL in Zurich Bar Collective group:
  ├─ Title: "David wants to work as Weekend Bartender"
  ├─ Proposal Type: "membership" (or new "employment" type)
  ├─ Action Type: "create_employment_contract"
  ├─ Action Data: {
  │   "work_type": "temporary",
  │   "dates": ["2025-01-04", "2025-01-05"],
  │   "payment": 4000,
  │   "applicant_id": "david_user_id"
  │ }
  └─ Status: "proposed" (sent to GROUP for approval)
```

**Step 5: Bar Owners Vote**
```
All three bar owners see proposal:
  "David wants to work as Weekend Bartender - 4,000 SATS"
  ↓
Owners discuss:
  - Review David's experience
  - Check if he's available
  - Compare with other applicants (if any)
  ↓
Voting (consensus governance - all must agree):
  - Owner 1 (Alex): "Yes" ✅
  - Owner 2 (Sarah): "Yes" ✅
  - Owner 3 (Mike): "Yes" ✅
  ↓
Vote passes (100% consensus)
  ↓
Contract created:
  ├─ Status: "active"
  ├─ David is now scheduled to work
  └─ Opportunity status: "filled"
```

**Step 6: Work Completed, Payment Made**

**⚠️ This requires contracts system and payment integration:**

```
Weekend passes, David completes work
  ↓
Bar owners confirm work completed (via UI)
  ↓
System processes payment:
  - 4,000 SATS transferred from bar's wallet to David
  - Contract status: "completed"
  - Payment recorded in transactions table
  ↓
David receives payment notification
  ↓
Both parties can leave reviews/ratings (if review system exists)
```

**Would need:**
- Contracts system (to track work completion)
- Payment processing (wallet integration)
- Work confirmation UI
- Review/rating system (optional)

### Option B: Contractor Proposes Directly (Using Proposals - After Proposals System Completed)

**This would work after completing proposals system:**

**Step 1: Contractor Creates Proposal**

**⚠️ Requires proposals system to be completed first:**

```
David sees bar needs help (maybe through group page, event, or announcement)
  ↓
David goes to "Zurich Bar Collective" group page
  ↓
Clicks "Create Proposal" → "Offer Services"
  ↓
Fills out proposal form:
  - Title: "Available for Weekend Bartending"
  - Description: "5 years bartending experience, available this weekend"
  - Proposal Type: "general" (or new "employment" type)
  - Action Type: "create_employment_contract"
  - Action Data: {
      "service_type": "bartending",
      "work_type": "temporary",
      "dates": ["2025-01-04", "2025-01-05"],
      "hours": "18:00-02:00",
      "payment": 4000,
      "currency": "SATS",
      "experience": "5 years"
    }
  ↓
Clicks "Submit Proposal"
```

**Current Status:**
- ❌ Proposals service layer missing (no mutations/queries)
- ❌ Proposal creation UI missing
- ⚠️ API route exists but uses old "organizations" path

**Step 2: Proposal Sent to Bar Group**
```
Proposal created in Zurich Bar Collective group:
  ├─ Title: "David offers bartending services for this weekend"
  ├─ Contract Type: "service" (or "employment" temporary)
  ├─ Party A: David (individual)
  ├─ Party B: Zurich Bar Collective (group)
  ├─ Terms: {
  │   "service_type": "bartending",
  │   "work_type": "temporary",
  │   "dates": ["2025-01-04", "2025-01-05"],
  │   "hours": "18:00-02:00",
  │   "payment": 4000,
  │   "currency": "SATS",
  │   "experience": "5 years"
  │ }
  └─ Status: "proposed" (sent to GROUP)
```

**Step 3: Bar Owners Vote**
```
Same as Option A - owners vote, if passes, contract created
```

---

## 📖 Scenario 9: Recurring Temporary Work

### The Situation

Same bar needs someone every Friday night (recurring temporary work).

### Step-by-Step Journey

**Step 1: Bar Creates Recurring Opportunity**
```
Bar owners create proposal:
  ├─ Title: "Friday Night Bartender - Recurring"
  ├─ Work Type: "recurring_temporary"
  ├─ Frequency: "Every Friday"
  ├─ Hours: "18:00-02:00"
  ├─ Payment: "2,000 SATS per shift"
  ├─ Duration: "3 months" (or "ongoing")
  └─ Terms: {
      "work_type": "recurring_temporary",
      "frequency": "weekly",
      "day_of_week": "friday",
      "hours": "18:00-02:00",
      "payment_per_shift": 2000,
      "currency": "SATS",
      "duration_months": 3,
      "total_shifts": 12,
      "total_payment": 24000
    }
```

**Step 2: Contractor Applies**
```
David applies for recurring position
  ↓
Proposal created with recurring terms
  ↓
Bar owners vote
  ↓
If passes, contract created:
  ├─ Status: "active"
  ├─ Recurring: true
  └─ System tracks:
      - Each shift completed
      - Payment per shift
      - Total shifts worked
```

**Step 3: Each Shift Tracked**
```
Every Friday:
  - David works shift
  - Bar confirms completion
  - System records shift
  - Payment processed
  ↓
After 3 months (or if terminated):
  Contract status: "completed"
```

---

## 📖 Scenario 10: Multiple Applicants (Job Posting System)

### The Situation

Bar posts opportunity, multiple people apply. Bar needs to choose one.

### Step-by-Step Journey

**Step 1: Bar Posts Opportunity**
```
Bar creates work opportunity proposal
  ├─ Status: "open" (accepting applications)
  └─ Multiple people can apply
```

**Step 2: Multiple Applications**
```
David applies → Proposal 1 created
Sarah applies → Proposal 2 created
Mike applies → Proposal 3 created
  ↓
All proposals visible to bar owners:
  - "David wants to work - 5 years experience"
  - "Sarah wants to work - 3 years experience"
  - "Mike wants to work - 2 years experience"
```

**Step 3: Bar Owners Review and Vote**
```
Bar owners discuss:
  - Compare experience
  - Check availability
  - Review references
  ↓
Decide: "Let's go with David"
  ↓
Vote on David's proposal:
  - Owner 1: "Yes" ✅
  - Owner 2: "Yes" ✅
  - Owner 3: "Yes" ✅
  ↓
David's proposal passes → Contract created
  ↓
Other proposals:
  - Sarah's: Declined (or left open)
  - Mike's: Declined (or left open)
```

**Alternative: Bar Can Accept Multiple**
```
If bar needs 2 bartenders:
  - Vote on David: Passes ✅
  - Vote on Sarah: Passes ✅
  - Both contracts created
```

---

## 🎯 Contract Types for Temporary Work

### Employment (Temporary)
```json
{
  "work_type": "temporary",
  "job_title": "Weekend Bartender",
  "dates": ["2025-01-04", "2025-01-05"],
  "hours_per_day": 8,
  "payment": 4000,
  "payment_timing": "after_completion"
}
```

### Service (Temporary)
```json
{
  "service_type": "bartending",
  "work_type": "temporary",
  "dates": ["2025-01-04", "2025-01-05"],
  "compensation": 4000,
  "payment_type": "one_time"
}
```

### Recurring Temporary
```json
{
  "work_type": "recurring_temporary",
  "frequency": "weekly",
  "day_of_week": "friday",
  "payment_per_shift": 2000,
  "duration_months": 3
}
```

**All use the same contract system, just different terms!**

---

## 💡 Key Insights

1. **Temporary work is just a contract with time-bound terms**
   - Same system as permanent employment
   - Just different terms (dates, duration)

2. **Two approaches (both need to be built):**
   - **Job Posting:** Bar posts opportunity, contractors apply (needs job posting system)
   - **Direct Proposal:** Contractor proposes directly to bar (needs proposals system completed)

3. **Multiple applicants handled naturally:**
   - Each application is a separate proposal/application
   - Bar votes/reviews each
   - Can accept one or multiple

4. **Flexibility in terms:**
   - One-time (this weekend)
   - Recurring (every Friday)
   - Short-term (3 months)
   - All use same contract system (when built)

## ⚠️ Implementation Status

**What needs to be built for bar weekend work scenario:**

1. **Complete Proposals System** (4-6 hours)
   - Service layer (mutations/queries)
   - Update API routes (use groups path, not organizations)
   - UI components

2. **Build Job Posting System** (8-12 hours)
   - Database tables (job_postings, job_applications)
   - Service layer
   - API routes
   - UI components (browse, apply, review)

3. **Build Contracts System** (6-8 hours)
   - Database table (contracts)
   - Service layer
   - API routes
   - Integration with proposals/job postings

**Total: 18-26 hours following development guide patterns**

**For now:** Use manual process (events, announcements, direct contact)

---

## ✅ Summary

**Key Points:**

1. **Contracts are flexible**
   - Terms are JSONB (can define anything)
   - Same contract type can have different terms
   - Easy to extend with new contract types

2. **Decision-making depends on recipient**
   - **Individual** → Direct decision
   - **Group** → Voting process

3. **Real-world relationships are complex**
   - Rental (apartment, room, parking)
   - Employment (full-time, part-time, freelance)
   - Ownership (individual, group, shared)
   - Service (one-time, ongoing, milestone-based)

4. **Same system handles everything**
   - Propose → Vote (if group) → Accept (if individual) → Contract Active
   - Modular and extensible

---

**Last Updated:** 2025-12-30

