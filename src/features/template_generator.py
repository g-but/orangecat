import json
from datetime import datetime
from typing import Dict, List, Optional

class TemplateGenerator:
    def __init__(self):
        self.templates = {
            "domain": self._generate_domain_template,
            "investment": self._generate_investment_template,
            "loan": self._generate_loan_template,
            "custom": self._generate_custom_template
        }
        
    def generate_template(self, 
                         template_type: str,
                         bitcoin_address: str,
                         title: str,
                         description: str,
                         goal_amount: Optional[float] = None,
                         custom_fields: Optional[Dict] = None) -> Dict:
        """Generate a template for a transparent fundraising page"""
        if template_type not in self.templates:
            raise ValueError(f"Unknown template type: {template_type}")
            
        base_template = {
            "metadata": {
                "template_type": template_type,
                "generated_at": datetime.now().isoformat(),
                "version": "1.0"
            },
            "fundraising": {
                "title": title,
                "description": description,
                "bitcoin_address": bitcoin_address,
                "goal_amount": goal_amount,
                "start_date": datetime.now().isoformat()
            },
            "transparency": {
                "transactions_visible": True,
                "balance_visible": True,
                "verification_enabled": True
            }
        }
        
        # Add template-specific fields
        template = self.templates[template_type](base_template, custom_fields)
        
        return template
        
    def _generate_domain_template(self, base: Dict, custom: Optional[Dict]) -> Dict:
        """Generate template for domain registration/transfer"""
        template = base.copy()
        template["domain"] = {
            "domain_name": custom.get("domain_name", ""),
            "registrar": custom.get("registrar", ""),
            "registration_period": custom.get("registration_period", "1 year"),
            "transfer_fee": custom.get("transfer_fee", 0)
        }
        return template
        
    def _generate_investment_template(self, base: Dict, custom: Optional[Dict]) -> Dict:
        """Generate template for investment projects"""
        template = base.copy()
        template["investment"] = {
            "project_type": custom.get("project_type", ""),
            "expected_roi": custom.get("expected_roi", 0),
            "investment_period": custom.get("investment_period", ""),
            "risk_level": custom.get("risk_level", "medium")
        }
        return template
        
    def _generate_loan_template(self, base: Dict, custom: Optional[Dict]) -> Dict:
        """Generate template for loans"""
        template = base.copy()
        template["loan"] = {
            "purpose": custom.get("purpose", ""),
            "term": custom.get("term", ""),
            "interest_rate": custom.get("interest_rate", 0),
            "repayment_schedule": custom.get("repayment_schedule", [])
        }
        return template
        
    def _generate_custom_template(self, base: Dict, custom: Optional[Dict]) -> Dict:
        """Generate custom template with user-defined fields"""
        template = base.copy()
        if custom:
            template["custom_fields"] = custom
        return template
        
    def save_template(self, template: Dict, filename: str):
        """Save template to a file"""
        with open(filename, 'w') as f:
            json.dump(template, f, indent=2)
            
    def load_template(self, filename: str) -> Dict:
        """Load template from a file"""
        with open(filename, 'r') as f:
            return json.load(f) 