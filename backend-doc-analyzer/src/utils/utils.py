from datetime import datetime,timezone,timedelta
from enum import Enum
import tiktoken

_ahora = datetime.now(timezone(timedelta(hours=-3)))

hour = _ahora.strftime("%I:%M %p")

class TaskStatus(Enum):
    PROCESSING = 1
    COMPLETED = 2
    FAILED = 3
    PRELOADED = 4

#Diccionarios de días y meses
meses = {
    1: "Enero",
    2: "Febrero",
    3: "Marzo",
    4: "Abril",
    5: "Mayo",
    6: "Junio",
    7: "Julio",
    8: "Agosto",
    9: "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre",
}

dias = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
}

_numero_mes = _ahora.month
# A entero para quitar los ceros a la izquierda en caso de que existan
_numero_dia = int(_ahora.strftime("%w"))
# Leer diccionario
_dia = dias.get(_numero_dia)
_mes = meses.get(_numero_mes)
# Formatear
fechacompleta = "{}, {} de {} del {}".format(_dia, _ahora.day, _mes, _ahora.year)


def num_tokens(text: str, model: str="gpt-3.5-turbo") -> int:
    """Return the number of tokens in a string."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))