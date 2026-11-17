import type { Lesson } from "../drizzle/schema";

/** Titles and duration may be public; lesson text and recording links may not. */
export function publicCurriculumLesson(lesson: Lesson) {
  const { content, videoUrl, ...metadata } = lesson;
  return { ...metadata, isPreview: false, hasContent: Boolean(content?.trim() || videoUrl?.trim()) };
}
