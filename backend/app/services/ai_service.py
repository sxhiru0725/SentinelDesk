import logging
from typing import Optional, Dict, Any
from google import genai
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseAIProvider:
    def analyze_vulnerability(self, title: str, description: str, severity: str, cve_id: Optional[str] = None, cwe_id: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError

    def chat_query(self, prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError


class GeminiAIProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}")

    @property
    def is_available(self) -> bool:
        return bool(self.client and self.api_key)

    def analyze_vulnerability(self, title: str, description: str, severity: str, cve_id: Optional[str] = None, cwe_id: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_available:
            return self._fallback_analysis(title, severity, cve_id, cwe_id)

        prompt = f"""
You are SentinelDesk AI, a senior cybersecurity engineer.
Analyze the following security vulnerability and provide concise, technical, actionable insights.

Vulnerability Title: {title}
Severity: {severity}
CVE ID: {cve_id or 'N/A'}
CWE ID: {cwe_id or 'N/A'}
Description: {description}

Respond in the following sections:
1. Summary
2. Impact Explanation
3. Remediation Guidance
4. Verification Steps
"""

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            text = response.text or ""
            return {
                "summary": f"AI Assessment: {title} ({severity})",
                "impact_explanation": text,
                "remediation_guidance": "Follow the detailed steps provided in the AI response above.",
                "verification_steps": "Perform regression scans or manual proof-of-concept testing to verify patch.",
                "is_ai_available": True,
                "provider": "gemini"
            }
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            return self._fallback_analysis(title, severity, cve_id, cwe_id)

    def chat_query(self, prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_available:
            return {
                "reply": "AI Security Assistant integration is not configured. Set GEMINI_API_KEY in backend environment to enable interactive AI analysis.",
                "is_ai_available": False,
                "provider": "fallback"
            }

        full_prompt = f"System Context: You are SentinelDesk AI assistant for a security management dashboard.\n\nSecurity Context Data:\n{context or 'No specific item context provided.'}\n\nUser Question:\n{prompt}"
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt,
            )
            return {
                "reply": response.text or "No response generated.",
                "is_ai_available": True,
                "provider": "gemini"
            }
        except Exception as e:
            logger.error(f"Gemini chat query failed: {e}")
            return {
                "reply": f"AI Assistant query failed due to an upstream API error: {str(e)}",
                "is_ai_available": False,
                "provider": "fallback"
            }

    def _fallback_analysis(self, title: str, severity: str, cve_id: Optional[str], cwe_id: Optional[str]) -> Dict[str, Any]:
        return {
            "summary": f"[Rule-Based Standard Remediation] {title}",
            "impact_explanation": f"This vulnerability is rated as {severity} severity. CVE: {cve_id or 'None'}, CWE: {cwe_id or 'None'}. High/Critical severity issues risk unauthorized data access or system compromise if left unpatched.",
            "remediation_guidance": "1. Isolate affected component.\n2. Apply latest security patches/updates.\n3. Implement input validation and output encoding.\n4. Conduct peer review before deploying.",
            "verification_steps": "Re-run automated scanner (Trivy/NPM audit/ZAP) to verify vulnerability status transitions to resolved.",
            "is_ai_available": False,
            "provider": "fallback"
        }


ai_service = GeminiAIProvider()
