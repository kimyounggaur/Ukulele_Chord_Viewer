export interface LessonSet {
  id: string;
  title: string;
  chordIds: string[];
  note?: string;
  createdAt: number;
}

export interface LessonSetDraft {
  title: string;
  chordIds?: readonly string[];
  note?: string;
}

export interface LessonSetIdentity {
  id?: string;
  createdAt?: number;
}

export interface LessonSetMutationResult {
  lessonSets: LessonSet[];
  lessonSet: LessonSet;
}
