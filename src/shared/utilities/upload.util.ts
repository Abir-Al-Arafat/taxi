export const normalizeStringArray = (
  values: string[] | string | undefined,
): string[] => {
  if (Array.isArray(values)) {
    return values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  if (typeof values === "string") {
    const trimmedValue = values.trim();

    if (trimmedValue.length === 0) {
      return [];
    }

    return [trimmedValue];
  }

  return [];
};
