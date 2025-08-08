/**
 * Copyright 2025 Loïc Muhirwa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useRef, useState } from 'react';

export interface UseAudioManagerProps {
  onAudioData?: (audioData: string, mimeType: string) => void;
  chunkInterval?: number; // milliseconds
}

export interface AudioState {
  isRecording: boolean;
  isMuted: boolean;
  hasPermission: boolean;
  error: string | null;
}

export function useAudioManager({ 
  onAudioData, 
  chunkInterval = 1000 
}: UseAudioManagerProps = {}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Audio streaming state for real-time playback
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const [state, setState] = useState<AudioState>({
    isRecording: false,
    isMuted: false,
    hasPermission: false,
    error: null,
  });

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      const errorMessage = "Microphone access denied or not available.";
      setState(prev => ({ ...prev, hasPermission: false, error: errorMessage }));
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!state.hasPermission) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000
        });
      }

      // Create audio processing pipeline for PCM conversion
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);
        
        // Convert float32 audio data to 16-bit PCM
        const pcmData = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputBuffer[i]));
          pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        
        // Convert to base64
        const arrayBuffer = pcmData.buffer;
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        onAudioData?.(base64Audio, "audio/pcm;rate=16000");
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      setState(prev => ({ ...prev, isRecording: true, error: null }));
      return true;

    } catch (error) {
      console.error("Failed to start recording:", error);
      setState(prev => ({ 
        ...prev, 
        error: "Failed to start recording. Please check microphone permissions.",
        isRecording: false 
      }));
      return false;
    }
  }, [state.hasPermission, onAudioData, requestPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setState(prev => ({ ...prev, isRecording: false }));
  }, [state.isRecording]);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Helper function to convert PCM to WAV
  const pcmToWav = useCallback((pcmData: Uint8Array, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16) => {
    const length = pcmData.length;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Copy PCM data
    new Uint8Array(buffer, 44).set(pcmData);
    
    return buffer;
  }, []);

  const playAudio = useCallback(async (base64Audio: string, mimeType: string = 'audio/pcm') => {
    if (state.isMuted) return;

    try {
      console.log(`Playing audio with MIME type: ${mimeType}, length: ${base64Audio.length}`);
      
      // Decode base64 to raw bytes
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      console.log(`Raw audio data: ${audioArray.length} bytes`);

      // Handle PCM audio - streaming approach for real-time playback
      if (mimeType === 'audio/pcm' || mimeType.startsWith('audio/pcm')) {
        try {
          // Initialize audio context if needed
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          // Resume audio context if suspended
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          // Gemini Live uses 24kHz, 16-bit, mono PCM
          const sampleRate = 24000;
          const bytesPerSample = 2;
          const numSamples = Math.floor(audioArray.length / bytesPerSample);
          
          console.log(`PCM: ${numSamples} samples at ${sampleRate}Hz (${(numSamples/sampleRate*1000).toFixed(1)}ms)`);
          
          // Create audio buffer
          const audioBuffer = audioContextRef.current.createBuffer(1, numSamples, sampleRate);
          const channelData = audioBuffer.getChannelData(0);
          
          // Convert raw PCM to float32
          for (let i = 0; i < numSamples; i++) {
            const byteIndex = i * 2;
            if (byteIndex + 1 < audioArray.length) {
              // Read 16-bit little-endian signed PCM sample
              const low = audioArray[byteIndex];
              const high = audioArray[byteIndex + 1];
              let sample = low | (high << 8);
              
              // Convert to signed
              if (sample >= 32768) {
                sample -= 65536;
              }
              
              // Normalize to [-1, 1]
              channelData[i] = sample / 32768.0;
            } else {
              channelData[i] = 0;
            }
          }
          
          // Create and schedule audio source for streaming playback
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          
          // Calculate timing for seamless playback
          const currentTime = audioContextRef.current.currentTime;
          const chunkDuration = audioBuffer.duration;
          
          // If this is the first chunk or there's a gap, start immediately
          if (nextPlayTimeRef.current <= currentTime || !isPlayingRef.current) {
            nextPlayTimeRef.current = currentTime;
            isPlayingRef.current = true;
          }
          
          // Schedule playback
          source.start(nextPlayTimeRef.current);
          
          // Update next play time for seamless continuation
          nextPlayTimeRef.current += chunkDuration;
          
          // Clean up when done
          source.onended = () => {
            const index = audioQueueRef.current.indexOf(source);
            if (index > -1) {
              audioQueueRef.current.splice(index, 1);
            }
            
            // If no more sources are playing, reset timing
            if (audioQueueRef.current.length === 0) {
              isPlayingRef.current = false;
              nextPlayTimeRef.current = 0;
            }
          };
          
          // Keep track of active sources
          audioQueueRef.current.push(source);
          
          // Clean up old sources that should be finished
          const now = audioContextRef.current.currentTime;
          audioQueueRef.current = audioQueueRef.current.filter(src => {
            // Remove sources that should have finished playing
            return true; // Let onended handle cleanup
          });
          
          console.log(`Audio chunk scheduled at ${nextPlayTimeRef.current - chunkDuration}, duration: ${chunkDuration}s`);
          return Promise.resolve();
          
        } catch (webAudioError) {
          console.warn('Web Audio API failed, trying WAV fallback:', webAudioError);
          
          // Simple WAV fallback
          const wavBuffer = pcmToWav(audioArray, 24000);
          const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => URL.revokeObjectURL(audioUrl);
          audio.onerror = (error) => {
            console.error("WAV playback failed:", error);
            URL.revokeObjectURL(audioUrl);
          };
          
          console.log('Playing with WAV fallback');
          return audio.play();
        }
      }

      // Handle other formats
      const audioBlob = new Blob([audioArray], { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = (error) => {
        console.error("Audio playback failed:", error);
        URL.revokeObjectURL(audioUrl);
      };

      return audio.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
      return Promise.reject(error);
    }
  }, [state.isMuted, pcmToWav]);

  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const stopAudioPlayback = useCallback(() => {
    // Stop all queued audio sources
    audioQueueRef.current.forEach(source => {
      try {
        source.stop();
      } catch (error) {
        // Source might already be stopped
      }
    });
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    console.log('Audio playback stopped');
  }, []);

  const cleanup = useCallback(() => {
    stopRecording();
    stopAudioPlayback();
  }, [stopRecording, stopAudioPlayback]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
    playAudio,
    toggleMute,
    requestPermission,
    stopAudioPlayback,
    cleanup,
  };
}
