import { DocumentMetadata } from '../types';
import { extractOutline } from '../lib/outline';
import { computeDocumentStats } from '../lib/stats';

export interface DocumentResponse {
  markdown: string;
  metadata: DocumentMetadata;
}

/**
 * Service for fetching document content and subscribing to backend live-reload events.
 * Adheres to Single Responsibility Principle for remote I/O and SSE.
 */
export class DocumentService {
  /**
   * Fetches the current document from the local Axum backend.
   */
  static async fetchCurrentDocument(): Promise<DocumentResponse | null> {
    try {
      const res = await fetch('/api/document');
      if (!res.ok) {
        throw new Error(`Failed to fetch document: HTTP ${res.status}`);
      }
      const data = await res.json();
      const content = data.content || '';
      const stats = computeDocumentStats(content);
      const outlineItems = extractOutline(content);

      const metadata: DocumentMetadata = {
        fileName: data.fileName || 'Document.md',
        filePath: data.filePath || '',
        dirPath: data.dirPath || '',
        sizeBytes: data.size || (content ? content.length : 0),
        lastModified: data.lastModified || new Date().toLocaleTimeString(),
        wordCount: stats.words,
        readingTimeMinutes: stats.readingTimeMinutes,
        headingCount: outlineItems.length,
      };

      return { markdown: content, metadata };
    } catch (err) {
      console.warn('[DocumentService] fetch error:', err);
      return null;
    }
  }

  /**
   * Subscribes to Server-Sent Events emitted by the Rust file-watcher.
   * Returns a cleanup function to unsubscribe and close the connection.
   */
  static subscribeToFileChanges(
    onChanged: () => void,
    onStatusChange?: (connected: boolean) => void
  ): () => void {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      onStatusChange?.(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'file_changed') {
          onChanged();
        }
      } catch (e) {
        // Ignore unparseable frames
      }
    };

    eventSource.onerror = () => {
      onStatusChange?.(false);
    };

    return () => {
      eventSource.close();
    };
  }
}
