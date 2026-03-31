export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  theoryLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  practiceTime: number;
  createdAt: any;
}

export interface ChordVoicing {
  name: string;
  frets: (number | null)[]; // e.g., [null, 3, 2, 0, 1, 0] for C Major
  fingers: (number | null)[];
  baseFret: number;
  description?: string;
}

export interface JamSession {
  id: string;
  uid: string;
  title: string;
  audioUrl?: string;
  key?: string;
  bpm?: number;
  chords?: string[];
  createdAt: any;
}
