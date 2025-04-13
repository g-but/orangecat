from datetime import datetime
import json
import hashlib
from typing import Dict
from bitcoin_tracker import BitcoinTracker
from transparency_score import TransparencyScore

class TransparencyReport:
    def __init__(self, bitcoin_address: str):
        self.bitcoin_tracker = BitcoinTracker(bitcoin_address)
        self.transparency_score = TransparencyScore()
        
    def generate_complete_report(self) -> Dict:
        """Generate a complete transparency report"""
        # Get Bitcoin data
        bitcoin_data = self.bitcoin_tracker.generate_transparency_report()
        
        # Calculate metrics for score
        metrics = {
            "screen_recording": {
                "enabled": True,
                "duration_hours": 24  # Example value
            },
            "bitcoin_transactions": {
                "visible": True,
                "count": len(bitcoin_data["transactions"])
            },
            "balance_visible": True,
            "code_visible": True,
            "activity_logging": {
                "enabled": True,
                "count": 100  # Example value
            }
        }
        
        # Calculate transparency score
        score_report = self.transparency_score.generate_score_report(metrics)
        
        # Combine all data
        report = {
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "address": self.bitcoin_tracker.address
            },
            "bitcoin_data": bitcoin_data,
            "transparency_score": score_report,
            "verification": {
                "bitcoin_hash": bitcoin_data["verification_hash"],
                "score_hash": score_report["transparency_score"]["verification_hash"],
                "complete_hash": self._generate_complete_hash(bitcoin_data, score_report)
            }
        }
        
        return report
        
    def _generate_complete_hash(self, bitcoin_data: Dict, score_report: Dict) -> str:
        """Generate verification hash for the complete report"""
        data = {
            "bitcoin_data": bitcoin_data,
            "transparency_score": score_report,
            "timestamp": datetime.now().isoformat()
        }
        return hashlib.sha256(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()
        
    def save_report(self, report: Dict, filename: str):
        """Save transparency report to a file"""
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
            
    def load_report(self, filename: str) -> Dict:
        """Load transparency report from a file"""
        with open(filename, 'r') as f:
            return json.load(f)
            
    def verify_report(self, report: Dict) -> bool:
        """Verify the integrity of a transparency report"""
        try:
            # Verify Bitcoin data hash
            bitcoin_hash = report["verification"]["bitcoin_hash"]
            if bitcoin_hash != self.bitcoin_tracker.generate_transparency_report()["verification_hash"]:
                return False
                
            # Verify score hash
            score_hash = report["verification"]["score_hash"]
            metrics = {
                "screen_recording": {"enabled": True, "duration_hours": 24},
                "bitcoin_transactions": {
                    "visible": True,
                    "count": len(report["bitcoin_data"]["transactions"])
                },
                "balance_visible": True,
                "code_visible": True,
                "activity_logging": {"enabled": True, "count": 100}
            }
            if score_hash != self.transparency_score.generate_score_report(metrics)["transparency_score"]["verification_hash"]:
                return False
                
            # Verify complete hash
            complete_hash = report["verification"]["complete_hash"]
            expected_hash = self._generate_complete_hash(
                report["bitcoin_data"],
                report["transparency_score"]
            )
            return complete_hash == expected_hash
            
        except Exception:
            return False 