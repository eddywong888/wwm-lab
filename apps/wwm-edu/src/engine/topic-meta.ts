import type { Bilingual } from './types';
import { MATH_GENERATORS } from './math';
import { CHINESE_TOPICS, ENGLISH_TOPICS } from './english';
import { DAILY_TOPIC_ID, MIXED_TOPIC_ID, REVIEW_TOPIC_ID } from './session';
import { UI_STRINGS } from './i18n';

export function topicDetails(topicId: string): { icon: string; name: Bilingual } {
  if (topicId === DAILY_TOPIC_ID) return { icon: '🗓️', name: UI_STRINGS.dailyChallenge };
  if (topicId === MIXED_TOPIC_ID) return { icon: '🎲', name: UI_STRINGS.mixedPractice };
  if (topicId === REVIEW_TOPIC_ID) return { icon: '🧠', name: UI_STRINGS.weakAreaPractice };
  const math = MATH_GENERATORS.find((generator) => generator.meta.id === topicId)?.meta;
  if (math) return { icon: math.icon, name: math.name };
  const language = [...ENGLISH_TOPICS, ...CHINESE_TOPICS].find((topic) => topic.id === topicId);
  if (language) return { icon: language.icon, name: language.name };
  return { icon: '✏️', name: UI_STRINGS.practiceByTopic };
}
