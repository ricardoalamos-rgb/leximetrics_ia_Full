from typing import Literal

QuestionArea = Literal["procesal", "civil", "constitucional", "penal", "laboral", "otros"]

def classify_area(question: str) -> QuestionArea:
    q = question.lower()
    if any(w in q for w in ["demanda", "reconvención", "recurso", "trámite", "plazo", "tribunal", "apelación", "casación"]):
        return "procesal"
    if any(w in q for w in ["contrato", "obligación", "posesión", "propiedad", "daño", "responsabilidad civil"]):
        return "civil"
    if any(w in q for w in ["constitución", "recurso de protección", "derechos fundamentales", "tribunal constitucional"]):
        return "constitucional"
    if any(w in q for w in ["delito", "pena", "condena", "imputado", "acusado"]):
        return "penal"
    if any(w in q for w in ["despido", "finiquito", "contrato de trabajo", "fuero laboral"]):
        return "laboral"
    return "otros"
