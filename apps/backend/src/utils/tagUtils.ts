// Helper function to convert tags array to PostgreSQL format
export function formatTags(tags?: string[] | string): string | null {
  if (!tags) return null;

  // If tags is a string, convert it to array
  if (typeof tags === "string") {
    tags = tags.split(",").map((tag) => tag.trim());
  }

  if (!Array.isArray(tags) || tags.length === 0) return null;
  return `{${tags.map((tag) => `"${tag}"`).join(",")}}`;
}

// Helper function to parse tags from PostgreSQL format
export function parseTags(tagsData: string[] | string | null): string[] {
  if (!tagsData) return [];

  // If it's already an array (from PostgreSQL), return it
  if (Array.isArray(tagsData)) {
    return tagsData;
  }

  // If it's a string in PostgreSQL format, parse it
  if (typeof tagsData === "string") {
    // Remove curly braces and split by comma
    return tagsData
      .slice(1, -1)
      .split(",")
      .map((tag) => tag.replace(/"/g, "").trim());
  }

  return [];
}
