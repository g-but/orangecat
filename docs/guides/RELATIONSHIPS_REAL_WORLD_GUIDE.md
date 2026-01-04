# Relationships in OrangeCat: Real-World Guide

**Created:** 2025-12-30  
**Purpose:** Practical guide with real-world scenarios, user personas, and step-by-step journeys

---

## 🎯 The Big Idea (Simple Version)

**Think of OrangeCat like a digital world where:**
- You can create groups (companies, communities, families, etc.)
- You can create things (projects, assets, services, etc.)
- **Everything is connected through contracts**
- **Contracts define what relationships mean**
- **Contracts are created through proposals that groups vote on**

**Example:** 
- You want to join a group? → Create a membership contract proposal
- You want to transfer your apartment to a building group? → Create an ownership contract proposal
- A company wants to hire you? → Create an employment contract proposal
- A company wants to hire another company? → Create a service contract proposal

**All the same pattern:** Propose → Vote → Contract Created

---

## 👥 User Personas

### Persona 1: Maria - Apartment Building Resident

**Who:** Maria, 35, lives in an apartment building in Zurich

**Goals:**
- Manage building expenses with neighbors
- Vote on building improvements
- Transfer her apartment ownership to the building group

**Tech Level:** Medium (uses apps, comfortable with digital tools)

### Persona 2: Alex - Startup Founder

**Who:** Alex, 28, founder of "OrangeCat Inc." (a software company)

**Goals:**
- Hire developers for the company
- Hire a design agency for website work
- Own the company (be the owner)
- Create projects owned by the company

**Tech Level:** High (tech-savvy, understands systems)

### Persona 3: Sarah - Community Organizer

**Who:** Sarah, 42, organizes "Ossetia Network State" (a digital community)

**Goals:**
- Invite people to join the community
- Vote on community decisions
- Manage community treasury
- Organize events

**Tech Level:** Medium-High (comfortable with digital tools)

### Persona 4: David - Freelance Developer

**Who:** David, 31, freelance web developer

**Goals:**
- Get hired by companies
- Work on projects
- Get paid in Bitcoin

**Tech Level:** High (tech-savvy)

---

## 📖 Scenario 1: Maria Joins Building Group

### The Situation

Maria lives in "Sunset Apartments" building. The building has a group on OrangeCat where residents coordinate expenses, vote on improvements, and manage shared resources.

### Step-by-Step Journey

**Step 1: Maria Discovers the Group**
```
Maria opens OrangeCat
  ↓
Navigates to /groups
  ↓
Searches for "Sunset Apartments"
  ↓
Finds the group, clicks to view
  ↓
Sees: "Sunset Apartments - Building Community"
     "12 members"
     "Private group"
     "Join this group" button
```

**Step 2: Maria Requests to Join**
```
Maria clicks "Join this group"
  ↓
System shows: "Request to join Sunset Apartments"
  ↓
Maria fills out:
  - Why she wants to join: "I'm a resident in apartment 3B"
  - Optional: Add her apartment number
  ↓
Clicks "Submit Request"
  ↓
System creates a PROPOSAL:
  ├─ Type: "Create Membership Contract"
  ├─ Party A: Maria (her actor_id)
  ├─ Party B: Sunset Apartments group (group's actor_id)
  ├─ Contract Type: "membership"
  ├─ Terms: { "role": "member", "apartment": "3B" }
  └─ Status: "proposed" (waiting for vote)
```

**Step 3: Group Votes**
```
Building admin (or all members, depending on governance) sees proposal:
  "Maria wants to join as resident of apartment 3B"
  ↓
Members vote:
  - Admin votes: "Yes" ✅
  - Other members can vote (if governance allows)
  ↓
Vote passes (meets threshold)
  ↓
System creates CONTRACT:
  ├─ Status: "active"
  ├─ Maria is now a member
  └─ Maria can now:
      - See building expenses
      - Vote on proposals
      - Attend building events
```

**Step 4: Maria is Now a Member**
```
Maria's dashboard shows:
  "You are a member of Sunset Apartments"
  ↓
Maria can now:
  - View building treasury
  - See upcoming votes
  - Propose improvements
  - RSVP to building events
```

---

## 📖 Scenario 2: Maria Rents Apartment from Building Group

### The Situation

"Sunset Apartments" is a building group that already exists and owns the building asset. Maria wants to rent Apartment 3B from the building group.

### Step-by-Step Journey

**Step 1: Building Group Already Exists**
```
Sunset Apartments group:
  - Already created
  - Already owns building asset
  - Has existing members (other residents)
  - Manages the building collectively
```

**Step 2: Maria Wants to Rent Apartment 3B**
```
Maria discovers Sunset Apartments group
  ↓
Sees available apartments listed
  ↓
Clicks "Rent Apartment 3B"
  ↓
System shows rental contract form
  ↓
Maria fills out:
  - Rental period: 12 months
  - Monthly rent: 1,500 CHF (or 50,000 SATS)
  - Start date: 2025-02-01
  - Apartment: 3B (2 bedrooms, 1 bathroom)
  ↓
Clicks "Request Rental Contract"
```

**Step 3: Contract Sent to Building Group**
```
System creates PROPOSAL in Sunset Apartments group:
  ├─ Type: "Create Rental Contract"
  ├─ Party A: Maria (her actor_id) - RENTER
  ├─ Party B: Sunset Apartments group (group's actor_id) - LANDLORD
  ├─ Contract Type: "rental" (or "service" with rental terms)
  ├─ Subject Type: "asset"
  ├─ Subject ID: building_asset_id
  ├─ Terms: {
  │   "rental_unit": "Apartment 3B",
  │   "monthly_rent": 1500,
  │   "currency": "CHF",
  │   "rent_period_months": 12,
  │   "start_date": "2025-02-01",
  │   "deposit": 3000,
  │   "rights": ["exclusive_use", "privacy"],
  │   "responsibilities": ["maintain_cleanliness", "pay_rent_on_time"]
  │ }
  └─ Status: "proposed" (sent to GROUP - needs group decision)
```

**Step 4: Building Group Votes**
```
Building group members see proposal:
  "Maria wants to rent Apartment 3B - 1,500 CHF/month for 12 months"
  ↓
Members discuss:
  - Check if apartment is available
  - Review Maria's application
  - Discuss terms
  ↓
Members vote (based on group governance):
  - If consensus: All members must agree
  - If democratic: 51% majority needed
  - If hierarchical: Admin/Founder decides
  ↓
Vote passes
  ↓
System creates CONTRACT:
  ├─ Status: "active"
  └─ Maria now has rental agreement with building group
```

**Step 5: Rental Contract Active**
```
Maria's dashboard shows:
  "Active Contracts: Sunset Apartments (Rental - Apartment 3B)"
  "Monthly Rent: 1,500 CHF"
  "Next Payment: 2025-02-01"
  ↓
Building group dashboard shows:
  "Active Rentals: Maria (Apartment 3B)"
  "Monthly Income: 1,500 CHF"
  ↓
System tracks:
  - Rental payments
  - Contract duration
  - Renewal options
```

### Alternative: Individual Landlord

**If the building is owned by an individual (not a group):**
```
Maria wants to rent from individual landlord "John"
  ↓
Maria creates rental contract proposal
  ↓
Contract sent to John (INDIVIDUAL, not group)
  ↓
John receives notification:
  "Maria wants to rent Apartment 3B"
  ↓
John reviews and decides:
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
- **Individual** → Direct decision (accept/decline)

---

## 📖 Scenario 3: Alex Hires David (Employment)

### The Situation

Alex runs "OrangeCat Inc." (a company group). He wants to hire David as a developer.

### Step-by-Step Journey

**Step 1: Alex Creates Employment Proposal**
```
Alex (founder of OrangeCat Inc.) goes to group page
  ↓
Clicks "Create Proposal"
  ↓
Selects "Hire Employee" template
  ↓
Fills out:
  - Title: "Hire David as Senior Developer"
  - Employee: Selects David (searches for user)
  - Job Title: "Senior Developer"
  - Salary: 5,000 SATS per month
  - Start Date: 2025-01-01
  - Responsibilities: "Develop features, maintain codebase"
  ↓
Clicks "Create Proposal"
  ↓
System creates PROPOSAL:
  ├─ Type: "Create Employment Contract"
  ├─ Party A: David (his actor_id)
  ├─ Party B: OrangeCat Inc. (group's actor_id)
  ├─ Contract Type: "employment"
  ├─ Terms: {
  │   "job_title": "Senior Developer",
  │   "salary": 5000,
  │   "currency": "SATS",
  │   "start_date": "2025-01-01",
  │   "responsibilities": [...]
  │ }
  └─ Status: "proposed"
```

**Step 2: Company Votes**
```
OrangeCat Inc. members see proposal:
  "Hire David as Senior Developer - 5,000 SATS/month"
  ↓
Members vote (if governance requires it):
  - Alex (founder): "Yes" ✅
  - Other admins: "Yes" ✅
  ↓
Vote passes (hierarchical governance - founder can decide)
  ↓
System creates CONTRACT:
  ├─ Status: "active"
  └─ David is now an employee
```

**Step 3: David Accepts**
```
David receives notification:
  "OrangeCat Inc. wants to hire you as Senior Developer"
  ↓
David reviews contract terms
  ↓
Clicks "Accept Contract"
  ↓
Contract status: "active"
  ↓
David is now:
  - Employee of OrangeCat Inc.
  - Can access company resources
  - Will receive salary payments
```

**Step 4: Employment Active**
```
David's dashboard shows:
  "You are employed by OrangeCat Inc."
  "Role: Senior Developer"
  "Salary: 5,000 SATS/month"
  ↓
OrangeCat Inc. group page shows:
  "Employees: David (Senior Developer)"
  ↓
System can:
  - Track salary payments
  - Manage employee permissions
  - Track work assignments
```

---

## 📖 Scenario 4: OrangeCat Inc. Hires Web Design Co. (Service Contract)

### The Situation

Alex's company "OrangeCat Inc." needs a website redesign. "Web Design Co." is another company group on OrangeCat.

### Step-by-Step Journey

**Step 1: Alex Creates Service Contract Proposal**
```
Alex goes to OrangeCat Inc. group page
  ↓
Clicks "Create Proposal"
  ↓
Selects "Hire Contractor" template
  ↓
Fills out:
  - Title: "Hire Web Design Co. for Website Redesign"
  - Contractor: Searches for "Web Design Co." (another group)
  - Service Type: "Web Design"
  - Project Scope: "Complete website redesign and development"
  - Compensation: 50,000 SATS (one-time project fee)
  - Delivery Date: 2025-03-31
  ↓
Clicks "Create Proposal"
  ↓
System creates PROPOSAL:
  ├─ Type: "Create Service Contract"
  ├─ Party A: Web Design Co. (their group's actor_id)
  ├─ Party B: OrangeCat Inc. (Alex's group's actor_id)
  ├─ Contract Type: "service"
  ├─ Terms: {
  │   "service_type": "web_design",
  │   "project_scope": "Complete website redesign",
  │   "compensation": 50000,
  │   "currency": "SATS",
  │   "delivery_date": "2025-03-31"
  │ }
  └─ Status: "proposed"
```

**Step 2: OrangeCat Inc. Votes**
```
OrangeCat Inc. members see proposal:
  "Hire Web Design Co. for website redesign - 50,000 SATS"
  ↓
Members vote:
  - Alex: "Yes" ✅
  - Other admins: "Yes" ✅
  ↓
Vote passes
  ↓
System creates CONTRACT:
  ├─ Status: "proposed" (waiting for Web Design Co. to accept)
  └─ Sent to Web Design Co. for approval
```

**Step 3: Web Design Co. Accepts**
```
Web Design Co. admin receives notification:
  "OrangeCat Inc. wants to hire you for website redesign"
  ↓
Web Design Co. admin reviews contract
  ↓
Clicks "Accept Contract"
  ↓
Contract status: "active"
  ↓
Both companies can now:
  - Track project progress
  - Manage payments
  - Communicate about the project
```

**Step 4: Service Contract Active**
```
OrangeCat Inc. dashboard shows:
  "Active Contracts: Web Design Co. (Website Redesign)"
  ↓
Web Design Co. dashboard shows:
  "Active Contracts: OrangeCat Inc. (Website Redesign)"
  ↓
System tracks:
  - Project milestones
  - Payment schedule
  - Delivery status
```

---

## 📖 Scenario 5: Parent Corp Owns Subsidiary Inc.

### The Situation

"Parent Corp" (a company group) wants to acquire "Subsidiary Inc." (another company group).

### Step-by-Step Journey

**Step 1: Parent Corp Creates Ownership Proposal**
```
Parent Corp admin goes to group page
  ↓
Clicks "Create Proposal"
  ↓
Selects "Acquire Company" template
  ↓
Fills out:
  - Title: "Acquire Subsidiary Inc."
  - Target Company: Selects "Subsidiary Inc."
  - Ownership Percentage: 100%
  - Terms:
    * Rights: Manage operations, make decisions, receive profits
    * Responsibilities: Maintain company, report to parent
  ↓
Clicks "Create Proposal"
  ↓
System creates PROPOSAL in Parent Corp:
  ├─ Type: "Create Ownership Contract"
  ├─ Party A: Parent Corp (their actor_id)
  ├─ Party B: Subsidiary Inc. (their actor_id)
  ├─ Contract Type: "ownership"
  ├─ Subject Type: "group"
  ├─ Subject ID: subsidiary_group_id
  ├─ Terms: {
  │   "ownership_percentage": 100,
  │   "rights": ["manage", "decide", "receive_profits"],
  │   "responsibilities": ["maintain", "report"]
  │ }
  └─ Status: "proposed"
```

**Step 2: Subsidiary Inc. Also Creates Proposal**
```
Subsidiary Inc. members see notification:
  "Parent Corp wants to acquire your company"
  ↓
Subsidiary Inc. creates their own proposal:
  "Accept acquisition by Parent Corp"
  ↓
Subsidiary Inc. members vote:
  - Member 1: "Yes" ✅
  - Member 2: "Yes" ✅
  - Member 3: "Yes" ✅
  - ... (all members vote)
  ↓
Vote passes (meets threshold)
  ↓
System creates CONTRACT:
  ├─ Status: "active"
  └─ Parent Corp now owns Subsidiary Inc.
```

**Step 3: Ownership Established**
```
Subsidiary Inc. group page shows:
  "Owned by: Parent Corp"
  ↓
Parent Corp group page shows:
  "Owns: Subsidiary Inc."
  ↓
Parent Corp can now:
  - Make decisions for Subsidiary Inc.
  - Receive profits from Subsidiary Inc.
  - Manage Subsidiary Inc. operations
```

---

## 🎯 The Pattern (Summary)

**Every relationship follows the same pattern:**

1. **Someone wants to create a relationship**
   - Join a group
   - Transfer ownership
   - Hire someone
   - Contract with another group

2. **They create a proposal**
   - Define the contract terms
   - Specify what the relationship means

3. **Group votes on the proposal**
   - Members vote
   - Must meet threshold (consensus, majority, etc.)

4. **If passes, contract is created**
   - Relationship is established
   - Terms are recorded
   - Status is "active"

5. **Relationship is active**
   - Both parties can see the contract
   - System enforces the terms
   - Can be terminated later if needed

---

## 💡 Key Concepts Made Simple

### What is a Contract?

**Think of it like a real-world contract:**
- Two parties agree to something
- Terms define what they agree to
- It's recorded and enforceable

**In OrangeCat:**
- Contracts are digital agreements
- Terms are stored as JSON (flexible)
- Created through proposals and voting

### What is a Proposal?

**Think of it like a motion in a meeting:**
- Someone suggests something
- Group discusses it
- Group votes on it
- If it passes, it happens

**In OrangeCat:**
- Proposals are requests to create contracts
- Group members vote
- If passes, contract is created

### What is an Actor?

**Think of it like a person or organization:**
- Individual person = actor
- Group (company, community) = actor
- Both can enter into contracts

**In OrangeCat:**
- Users have actor_id
- Groups have actor_id
- Contracts connect two actors

---

## 🎨 Visual Flow

```
┌─────────────────────────────────────────────────┐
│  USER WANTS RELATIONSHIP                         │
│  (Join group, hire, transfer ownership, etc.)    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CREATE PROPOSAL                                 │
│  - Define contract type                          │
│  - Specify parties (actors)                      │
│  - Set terms (what it means)                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  GROUP VOTES                                     │
│  - Members see proposal                          │
│  - Members vote                                  │
│  - Must meet threshold                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CONTRACT CREATED (if vote passes)               │
│  - Status: "active"                              │
│  - Relationship established                      │
│  - Terms recorded                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  RELATIONSHIP ACTIVE                             │
│  - Both parties can see contract                 │
│  - System enforces terms                         │
│  - Can be managed/terminated                     │
└─────────────────────────────────────────────────┘
```

---

## ✅ Summary

**The system is simple:**
1. **Everything is a relationship** between actors (people or groups)
2. **Relationships are contracts** that define what they mean
3. **Contracts are created through proposals** that groups vote on
4. **Same pattern for everything** - join group, hire, transfer ownership, etc.

**Real-world examples:**
- Maria joins building group → Membership contract
- Maria transfers apartment → Ownership contract
- Alex hires David → Employment contract
- OrangeCat hires Web Design Co. → Service contract
- Parent Corp acquires Subsidiary → Ownership contract

**All follow the same flow:** Propose → Vote → Contract → Active

---

**Last Updated:** 2025-12-30

