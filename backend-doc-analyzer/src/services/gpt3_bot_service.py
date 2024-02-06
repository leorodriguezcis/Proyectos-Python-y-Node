import openai
from src.services.gpt_base import GPTBase
from src.utils.utils import fechacompleta,hour

class GPT3BotService(GPTBase):
   
    def __init__(self):
        super().__init__()
        

    async def gpt_response(self, text: str)->str:
        prompt=f"Hoy es {fechacompleta} y la hora es {hour}.La siguiente conversacion es con una asistente IA. La asistente es amistosa y creativa.Si te preguntan hechos ocurridos despues de tu ultimo conocimiento solo di que no posees esa informacion ya que solo tuviste conexion a internet hasta 2021. El nombre de la asistente es Ana."
        response = openai.ChatCompletion.create(engine=self._chat_engine,
                                             messages=[
                                            {"role": "assistant", "content": prompt},
                                            {"role": "user", "content": text}],
                                            temperature=0.6,
                                            top_p=1,
                                            frequency_penalty=0.4, presence_penalty=0.5,stop=[" Human:", " AI:"])
        result = response['choices'][0]['message']['content']
        return result 



   