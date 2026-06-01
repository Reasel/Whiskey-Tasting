import React from 'react';

/**
 * Format text with links
 * Converts URLs in text to clickable links while preserving newlines
 */
export function formatTextWithLinks(text: string): React.ReactElement[] {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split the text by URLs - with capture groups, URLs are included in the array
  // Result: [text, url, text, url, text, ...]
  const parts = text.split(urlRegex);

  // Build the result
  const result: React.ReactElement[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    // Check if this part is a URL (odd indices when using capture group split)
    const isUrl = urlRegex.test(part);
    // Reset lastIndex since we're reusing the regex
    urlRegex.lastIndex = 0;

    if (isUrl) {
      result.push(
        <a
          key={`link-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {part}
        </a>
      );
    } else {
      // Add text part (preserving newlines by splitting and joining with br)
      const lines = part.split('\n');
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          result.push(<br key={`br-${index}-${lineIndex}`} />);
        }
        if (line) {
          result.push(<span key={`text-${index}-${lineIndex}`}>{line}</span>);
        }
      });
    }
  });

  return result;
}
