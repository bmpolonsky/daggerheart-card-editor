const INLINE_MARKER_REGEX = /#\{([^}]*)\}#/g;

export function stripInlineMarkers(value: string) {
  if (!value) return "";
  return value.replace(INLINE_MARKER_REGEX, "$1");
}
