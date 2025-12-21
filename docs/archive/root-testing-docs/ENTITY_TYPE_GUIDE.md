# 🏛️ Entity Type Guide: Mapping Real-World Entities to OrangeCat

## Quick Reference

| Real-World Entity | OrangeCat Type | Organization Type | Notes |
|------------------|----------------|------------------|-------|
| **Business/Company** | Organization | `company` | For-profit businesses, startups, corporations |
| **Non-Profit** | Organization | `nonprofit` | Charities, foundations, NGOs |
| **Town/City Government** | Organization | `community` or `foundation` | Municipal governments, public institutions |
| **Country Government** | Organization | `foundation` or `community` | National governments, federal entities |
| **DAO** | Organization | `dao` | Decentralized autonomous organizations |
| **Cooperative** | Organization | `cooperative` | Worker-owned businesses, member cooperatives |
| **Professional Association** | Organization | `guild` | Industry associations, trade groups |
| **Investment Group** | Organization | `syndicate` | Investment clubs, venture syndicates |
| **Family Group** | Circle | N/A | Family savings, coordination |
| **Hobby Club** | Circle | N/A | Interest groups, casual meetups |
| **Neighborhood Group** | Circle | N/A | Local communities, mutual aid |

---

## Detailed Breakdown

### 🏢 Business/Company

**Type:** Organization  
**Organization Type:** `company`  
**Governance Model:** `hierarchical` (typical) or `democratic` (worker-owned)

**Use Cases:**
- For-profit businesses
- Startups
- Corporations
- LLCs
- Partnerships

**Features:**
- Structured governance
- Treasury management
- Member roles (owner, admin, employee)
- Public/private visibility
- Legal compliance support

**Example:**
```
Name: "Orange Cat Technologies"
Type: company
Governance: hierarchical
Visibility: public
Treasury: Multi-sig Bitcoin wallet
```

---

### ❤️ Non-Profit

**Type:** Organization  
**Organization Type:** `nonprofit`  
**Governance Model:** `democratic` or `hierarchical`

**Use Cases:**
- Charitable organizations
- Foundations
- NGOs
- Educational institutions
- Research institutes

**Features:**
- Transparent operations
- Public accountability
- Donation tracking
- Grant management
- Tax compliance support

**Example:**
```
Name: "Bitcoin Education Foundation"
Type: nonprofit
Governance: democratic
Visibility: public
Treasury: Transparent donation wallet
```

---

### 🏛️ Town/City Government

**Type:** Organization  
**Organization Type:** `community` or `foundation`  
**Governance Model:** `democratic` or `hierarchical`

**Important Distinction:**
- The **geographic location** (town/city) is just **location metadata** (stored in `location_city`, `location_country`)
- The **government entity** (municipal organization) is an **Organization**

**Use Cases:**
- Municipal governments
- City councils
- Town administrations
- Public service organizations
- Local government entities

**Features:**
- Public transparency
- Democratic governance
- Public treasury
- Citizen participation
- Budget tracking

**Example:**
```
Name: "Zurich Municipal Government"
Type: community
Governance: democratic
Visibility: public
Location: Zurich, Switzerland (metadata)
Treasury: Public Bitcoin treasury
```

**Location Metadata:**
- Stored separately in `location_city`, `location_country` fields
- Used for geographic search and filtering
- Not the entity itself, just where it operates

---

### 🌍 Country Government

**Type:** Organization  
**Organization Type:** `foundation` or `community`  
**Governance Model:** `hierarchical` or `democratic`

**Important Distinction:**
- The **country** itself is just **location metadata** (`location_country`)
- The **government entity** is an **Organization**

**Use Cases:**
- National governments
- Federal entities
- State governments
- National institutions
- Public sector organizations

**Features:**
- Formal governance structure
- Public accountability
- National treasury
- Citizen services
- Transparent operations

**Example:**
```
Name: "Swiss Federal Government"
Type: foundation
Governance: hierarchical
Visibility: public
Location: Switzerland (metadata)
Treasury: National Bitcoin treasury
```

---

### 🌀 Geographic Entities vs Organizations

**Key Concept:** Geographic locations (countries, cities, towns) are **metadata**, not entities themselves.

**How It Works:**

1. **Location as Metadata:**
   ```typescript
   {
     location_country: 'CH',        // ISO country code
     location_city: 'Zurich',        // City name
     location_zip: '8001',          // Postal code
     latitude: 47.3769,             // Coordinates
     longitude: 8.5417
   }
   ```

2. **Government as Organization:**
   ```typescript
   {
     name: 'Zurich Municipal Government',
     type: 'community',
     governance_model: 'democratic',
     location_country: 'CH',        // ← Location metadata
     location_city: 'Zurich'         // ← Location metadata
   }
   ```

**Why This Design?**
- ✅ Geographic locations are searchable/filterable metadata
- ✅ Multiple organizations can operate in the same location
- ✅ Organizations can have multiple locations
- ✅ Clear separation: entity vs. location

---

## Decision Tree

```
Is it a formal, structured entity?
├─ YES → Organization
│   ├─ For-profit business? → type: 'company'
│   ├─ Non-profit/charity? → type: 'nonprofit'
│   ├─ Government/municipal? → type: 'community' or 'foundation'
│   ├─ DAO? → type: 'dao'
│   ├─ Cooperative? → type: 'cooperative'
│   ├─ Professional association? → type: 'guild'
│   └─ Investment group? → type: 'syndicate'
│
└─ NO → Circle
    ├─ Family group? → Family Circle
    ├─ Hobby/interest? → Interest Circle
    ├─ Local community? → Community Circle
    └─ Casual group? → Social Circle
```

---

## Examples

### Example 1: Local Business
```
Entity: "Zurich Bitcoin Cafe"
Type: Organization
Organization Type: company
Location: Zurich, Switzerland (metadata)
Governance: hierarchical
```

### Example 2: Charity
```
Entity: "Swiss Bitcoin Education Fund"
Type: Organization
Organization Type: nonprofit
Location: Switzerland (metadata)
Governance: democratic
```

### Example 3: City Government
```
Entity: "City of Zurich Administration"
Type: Organization
Organization Type: community
Location: Zurich, Switzerland (metadata)
Governance: democratic
```

### Example 4: Country Government
```
Entity: "Swiss Federal Treasury"
Type: Organization
Organization Type: foundation
Location: Switzerland (metadata)
Governance: hierarchical
```

### Example 5: Family Group
```
Entity: "Schmidt Family Savings"
Type: Circle
Category: Family
Location: Zurich, Switzerland (metadata)
Visibility: private
```

---

## Summary

- **Business** = Organization (`type: 'company'`)
- **Non-Profit** = Organization (`type: 'nonprofit'`)
- **Town/City Government** = Organization (`type: 'community'` or `'foundation'`) + location metadata
- **Country Government** = Organization (`type: 'foundation'` or `'community'`) + location metadata
- **Geographic Location** = Metadata only (not an entity)

The key insight: **Geographic locations are metadata, not entities. Government organizations are entities that happen to be located in those places.**











