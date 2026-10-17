import React, { useState } from 'react';
import { OutlineItem, DocumentMetadata } from '../types';
import { ListTree, Info, Clock, Hash, FileCode, Calendar } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  outline: OutlineItem[];
  activeHeadingId: string;
  onSelectHeading: (id: string) => void;
  metadata: DocumentMetadata | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  outline,
  activeHeadingId,
  onSelectHeading,
  metadata,
}) => {
  const [activeTab, setActiveTab] = useState<'outline' | 'info'>('outline');

  if (!isOpen) return null;

  return (
    <aside className="no-print w-72 flex-shrink-0 h-[calc(100vh-3rem)] bg-white/80 dark:bg-dark-sheet/80 backdrop-blur border-r border-paper-border dark:border-dark-border flex flex-col z-30 select-none text-xs transition-colors">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-paper-border dark:border-dark-border p-1 gap-1">
        <button
          onClick={() => setActiveTab('outline')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'outline'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ListTree size={14} />
          <span>Outline ({outline.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'info'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Info size={14} />
          <span>Doc Info</span>
        </button>
      </div>

      {/* Tab 1: Outline Tree */}
      {activeTab === 'outline' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {outline.length === 0 ? (
            <div className="p-4 text-center text-gray-400 dark:text-gray-500 italic">
              No headings found in document
            </div>
          ) : (
            outline.map((item) => {
              const isActive = activeHeadingId === item.id;
              const indentPadding = `${(item.level - 1) * 12 + 8}px`;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectHeading(item.id)}
                  style={{ paddingLeft: indentPadding }}
                  className={`w-full text-left py-1.5 pr-2 rounded text-[12px] truncate transition-colors block ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title={item.text}
                >
                  <span className="opacity-40 font-mono text-[10px] mr-1.5">H{item.level}</span>
                  {item.text}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Document Info & Statistics */}
      {activeTab === 'info' && metadata && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Metrics
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                  <Clock size={12} />
                  <span>Read Time</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  ~{metadata.readingTimeMinutes} min
                </div>
              </div>

              <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                  <Hash size={12} />
                  <span>Words</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {metadata.wordCount.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                  <ListTree size={12} />
                  <span>Sections</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {metadata.headingCount}
                </div>
              </div>

              <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                  <FileCode size={12} />
                  <span>Size</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {metadata.sizeBytes > 1024
                    ? `${(metadata.sizeBytes / 1024).toFixed(1)} KB`
                    : `${metadata.sizeBytes} B`}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              File Details
            </div>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <div>
                <span className="block text-[11px] font-medium text-gray-700 dark:text-gray-300">File Name</span>
                <span className="text-[11px] font-mono break-all">{metadata.fileName}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-gray-700 dark:text-gray-300">Directory</span>
                <span className="text-[11px] font-mono break-all opacity-80">{metadata.dirPath || '.'}</span>
              </div>
              {metadata.lastModified && (
                <div className="flex items-center gap-1.5 text-[11px] pt-1">
                  <Calendar size={12} />
                  <span>Modified: {metadata.lastModified}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
