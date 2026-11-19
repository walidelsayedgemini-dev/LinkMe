import type { Lesson } from "../drizzle/schema";
import { getLessonDetailedExplanation } from "./content/curriculum-data";

/** Titles and duration may be public; lesson text and recording links may not. */
export function publicCurriculumLesson(lesson: Lesson, courseSlug?: string) {
  const { content, videoUrl, ...metadata } = lesson;
  const hasDynamic = courseSlug
    ? Boolean(getLessonDetailedExplanation(courseSlug, lesson.title, lesson.position))
    : Boolean(getLessonDetailedExplanation("general", lesson.title, lesson.position));
  return {
    ...metadata,
    isPreview: false,
    hasContent: Boolean(content?.trim() || videoUrl?.trim() || hasDynamic),
  };
}
