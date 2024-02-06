class SpeechToTextCanceledError(Exception):
  
    def __init__(self,message):
        self.message = message
        super().__init__(self.message)

class SpeechToTextNoMatchError(Exception):
  
    def __init__(self,message):
        self.message = message
        super().__init__(self.message)
