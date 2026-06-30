/** Max stored image string length (base64 data URLs in Postgres text). */
export const MAX_STORED_IMAGE_CHARS = 480_000;

/** Max raw file before client compression. */
export const MAX_IMAGE_FILE_BYTES = 3_000_000;

/** Certification cover — matches app card (16:9). */
export const COURSE_COVER_WIDTH = 800;
export const COURSE_COVER_HEIGHT = 450;
export const COURSE_COVER_ASPECT = COURSE_COVER_WIDTH / COURSE_COVER_HEIGHT;
