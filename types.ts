
export interface Summary {
  summary_5_lines: string;
  key_points: string[];
  important_dates: { date: string; event: string }[];
  important_people: { name: string; significance: string }[];
  cause_effect: { cause: string; effect: string }[];
}

export interface TimelineEvent {
  year: string;
  event: string;
  impact: string;
}

export type Flashcard = {
  type: 'qa' | 'mcq' | 'true_false' | 'fill_up';
  question: string;
  answer: string;
  options?: string[];
};

export interface MindmapNode {
  name: string;
  children?: MindmapNode[];
}

export type MCQ = {
  question: string;
  options: string[];
  answer: string;
};

export type ShortAnswer = {
  question: string;
  answer_hint: string;
};

export type OneWordAnswer = {
  question: string;
  answer: string;
};

export interface Quiz {
  mcqs: MCQ[];
  short_answers: ShortAnswer[];
  one_word_questions: OneWordAnswer[];
  long_answer_question: {
    question: string;
    answer_guideline: string;
  };
}

export type HistoricalFigure = {
    name: string;
    prompt: string;
    imageUrl: string;
};

export type ChatMessage = {
    sender: 'user' | 'ai';
    text: string;
}
