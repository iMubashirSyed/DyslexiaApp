import Voice from '@react-native-voice/voice';

/**
 * @react-native-voice/voice is a process-wide singleton.
 * SpeechCoach / Bright Buddy / Bingo must fully release it when leaving,
 * and re-bind handlers before starting, or the next screen gets no results.
 */
export async function releaseVoiceModule(): Promise<void> {
  try {
    Voice.onSpeechStart = () => {};
    Voice.onSpeechEnd = () => {};
    Voice.onSpeechResults = () => {};
    Voice.onSpeechPartialResults = () => {};
    Voice.onSpeechError = () => {};
  } catch {
    /* ignore */
  }

  try {
    if (typeof Voice.stop === 'function') {
      await Voice.stop();
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof (Voice as {cancel?: () => Promise<void>}).cancel === 'function') {
      await (Voice as {cancel: () => Promise<void>}).cancel();
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof Voice.destroy === 'function') {
      await Voice.destroy();
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof (Voice as {removeAllListeners?: () => void}).removeAllListeners === 'function') {
      (Voice as {removeAllListeners: () => void}).removeAllListeners();
    }
  } catch {
    /* ignore */
  }

  // Let Android SpeechRecognizer fully tear down before another screen starts it.
  await new Promise<void>(resolve => setTimeout(resolve, 400));
}

export async function prepareVoiceStart(): Promise<void> {
  try {
    if (typeof Voice.stop === 'function') {
      await Voice.stop();
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof (Voice as {cancel?: () => Promise<void>}).cancel === 'function') {
      await (Voice as {cancel: () => Promise<void>}).cancel();
    }
  } catch {
    /* ignore */
  }
  await new Promise<void>(resolve => setTimeout(resolve, 350));
}
