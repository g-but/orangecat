import type { Organization, OrganizationFormData } from './types'

export class OrganizationMapper {
  static toFormData(organization: Organization): OrganizationFormData {
    return {
      name: organization.name,
      description: organization.description,
      website: organization.website,
      logo_url: organization.logo_url
    }
  }

  static fromFormData(formData: OrganizationFormData): Partial<Organization> {
    return {
      name: formData.name,
      description: formData.description,
      website: formData.website,
      logo_url: formData.logo_url
    }
  }

  static toPublic(organization: Organization): Partial<Organization> {
    return {
      id: organization.id,
      name: organization.name,
      description: organization.description,
      website: organization.website,
      logo_url: organization.logo_url,
      verified: organization.verified
    }
  }
}




