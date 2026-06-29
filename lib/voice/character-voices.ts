  // lib/voice/character-voices.ts

  export interface CharacterVoice {
    id: string;
    name: string;
    voiceId: string;
    gender: "male" | "female" | "neutral";
    age: "young" | "adult" | "elder";
    style: "hero" | "villain" | "narrator" | "sidekick" | "mentor";
    pitch: number;
    speed: number;
    emotion: string;
  }

  export const CHARACTER_VOICES: CharacterVoice[] = [
    {
      id: "hero-young",
      name: "Young Hero",
      voiceId: "en-us-male-1",
      gender: "male",
      age: "young",
      style: "hero",
      pitch: 0,
      speed: 1.0,
      emotion: "determined",
    },
    {
      id: "villain-deep",
      name: "Deep Villain",
      voiceId: "en-us-male-2",
      gender: "male",
      age: "adult",
      style: "villain",
      pitch: -2,
      speed: 0.9,
      emotion: "menacing",
    },
    {
      id: "narrator-epic",
      name: "Epic Narrator",
      voiceId: "en-us-male-3",
      gender: "male",
      age: "adult",
      style: "narrator",
      pitch: 1,
      speed: 0.95,
      emotion: "dramatic",
    },
    {
      id: "heroine-brave",
      name: "Brave Heroine",
      voiceId: "en-us-female-1",
      gender: "female",
      age: "young",
      style: "hero",
      pitch: 1,
      speed: 1.05,
      emotion: "confident",
    },
  ];

  // Parse dialogue to detect characters
  export function detectCharacters(text: string): string[] {
    const characterPatterns = [
      /(\w+):\s*["']/g, // Name: "dialogue"
      /(\w+)\s*said/g, // Name said
      /(\w+)\s*asked/g, // Name asked
      /(\w+)\s*shouted/g, // Name shouted
    ];

    const characters = new Set<string>();

    characterPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        characters.add(match[1]);
      }
    });

    return Array.from(characters);
  }

  // Assign voices to characters
  export function assignCharacterVoices(
    characters: string[],
  ): Map<string, CharacterVoice> {
    const assignments = new Map<string, CharacterVoice>();

    characters.forEach((character, index) => {
      // Cycle through available voices
      const voiceIndex = index % CHARACTER_VOICES.length;
      assignments.set(character, CHARACTER_VOICES[voiceIndex]);
    });

    return assignments;
  }
