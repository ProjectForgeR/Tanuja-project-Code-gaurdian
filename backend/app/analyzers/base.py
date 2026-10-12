from abc import ABC, abstractmethod
from typing import List
from app.schemas.analysis import FindingSchema


class BaseAnalyzer(ABC):
    @abstractmethod
    async def analyze(self, code: str, language: str, filename: str = "main") -> List[FindingSchema]:
        """Analyze source code and return a list of findings."""
        pass
