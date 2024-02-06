
class GPT3Error(Exception):
  
    def __init__(self,message):
        self.message = message
        super().__init__(self.message)
