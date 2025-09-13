// Global audio manager to ensure only one track plays at a time
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentSetIsPlaying: ((playing: boolean) => void) | null = null;

  play(audio: HTMLAudioElement, setIsPlaying: (playing: boolean) => void) {
    // Stop any currently playing audio
    this.stopCurrent();
    
    // Set new current audio
    this.currentAudio = audio;
    this.currentSetIsPlaying = setIsPlaying;
    
    return audio.play();
  }

  stopCurrent() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      if (this.currentSetIsPlaying) {
        this.currentSetIsPlaying(false);
      }
    }
    this.currentAudio = null;
    this.currentSetIsPlaying = null;
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      if (this.currentSetIsPlaying) {
        this.currentSetIsPlaying(false);
      }
    }
  }
}

export const audioManager = new AudioManager();