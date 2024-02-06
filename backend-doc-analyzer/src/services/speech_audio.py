import azure.cognitiveservices.speech as speechsdk
from src.config import SPEECH_KEY, SERVICE_REGION
from src.exceptions.speech2text.speech2textError import SpeechToTextCanceledError,SpeechToTextNoMatchError
from src.exceptions.text2speech.text2SpeechError import TextToSpeechCanceled

class SpeechAudio:
   
    async def recognize_text_and_syntetize(self, text,language,voice_name):
        speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SERVICE_REGION)
        speech_config.speech_synthesis_language = language
        speech_config.speech_synthesis_voice_name = voice_name
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
        speech_synthesis_result = synthesizer.speak_text_async(text).get()
        if speech_synthesis_result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return  (text , speech_synthesis_result.audio_data)
        elif speech_synthesis_result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = speech_synthesis_result.cancellation_details
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                if cancellation_details.error_details:
                    raise TextToSpeechCanceled(cancellation_details.error_details)
            raise TextToSpeechCanceled(cancellation_details.reason)

    async def speech_recognize(self,language):
        speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SERVICE_REGION)
        audio_config = speechsdk.audio.AudioConfig(filename="audio.wav")
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000")
        speech_config.set_property(speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "2000");
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000")

        speech_recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config, language=language, audio_config=audio_config)

        result = speech_recognizer.recognize_once_async().get()

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            raise SpeechToTextNoMatchError("No speech could be recognized: {}".format(result.no_match_details))
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                raise SpeechToTextCanceledError("Error cancelation reason: {}".format(cancellation_details.error_details))
            raise SpeechToTextCanceledError("Speech Recognition canceled: {}".format(cancellation_details.reason))