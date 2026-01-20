/**
 * Filter out verbose and unnecessary log lines
 */
export function filterVerboseLogs(logs: string): string {
  const lines = logs.split('\n');

  // Patterns to filter out (verbose/noise)
  const skipPatterns = [
    /^\s*$/, // Empty lines
    /^[\s\t]*$/, // Whitespace only
    /Ld /, // Linker details
    /^[\s]*cd /, // Directory changes
    /^[\s]*export /, // Export commands
    /^[\s]*\/usr\/bin\//, // System binary paths
    /^[\s]*builtin-/, // Builtin commands
    /ProcessInfoPlistFile/, // Plist processing
    /ProcessProductPackaging/, // Packaging details
    /^[\s]*write-file/, // File write operations
    /^[\s]*chmod/, // Permission changes
    /CompileAssetCatalog/, // Asset compilation (keep summary only)
  ];

  // Patterns to always keep (important)
  const keepPatterns = [
    /error:/i,
    /warning:/i,
    /failed/i,
    /succeeded/i,
    /Building/i,
    /Archive/i,
    /Export/i,
    /📦|🔍|✅|❌|🔧|📤/, // Emoji indicators
    /\*\* BUILD/,
    /\*\* ARCHIVE/,
    /\*\* EXPORT/,
  ];

  const filtered = lines.filter((line) => {
    // Always keep important lines
    if (keepPatterns.some((pattern) => pattern.test(line))) {
      return true;
    }

    // Skip verbose lines
    if (skipPatterns.some((pattern) => pattern.test(line))) {
      return false;
    }

    // Keep everything else
    return true;
  });

  return filtered.join('\n');
}

/**
 * Limit logs to last N lines
 */
export function limitLogLines(
  logs: string,
  maxLines: number = 100,
): {
  displayLogs: string;
  hiddenCount: number;
  totalLines: number;
} {
  const lines = logs.split('\n');
  const totalLines = lines.length;

  if (totalLines <= maxLines) {
    return {
      displayLogs: logs,
      hiddenCount: 0,
      totalLines,
    };
  }

  const displayLines = lines.slice(-maxLines);
  const hiddenCount = totalLines - maxLines;

  return {
    displayLogs: displayLines.join('\n'),
    hiddenCount,
    totalLines,
  };
}

/**
 * Process logs for display (filter + limit)
 */
export function processLogsForDisplay(
  logs: string,
  maxLines: number = 100,
): {
  displayLogs: string;
  hiddenCount: number;
  totalLines: number;
} {
  const filtered = filterVerboseLogs(logs);
  return limitLogLines(filtered, maxLines);
}

/**
 * Download logs as text file
 */
export function downloadLogs(logs: string, filename: string) {
  const blob = new Blob([logs], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
