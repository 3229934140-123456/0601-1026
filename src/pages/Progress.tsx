import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  File,
  ArrowUpRight,
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { ProgressBar } from '../components/ProgressBar';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn, formatDateTime, formatRelativeTime, formatFileSize } from '../utils/helpers';
import type { Progress as ProgressItem, KeyResult, User as UserType, Attachment } from '../types';

export const Progress = () => {
  const navigate = useNavigate();
  const {
    progresses,
    keyResults,
    goals,
    getUserById,
    getCommentsByProgressId,
    addComment,
    addProgress,
    updateKeyResult,
    currentUser,
    users,
    setSelectedGoalId,
    setSelectedKRId,
  } = useStore();

  const [expandedProgressId, setExpandedProgressId] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showMentionList, setShowMentionList] = useState<Record<string, boolean>>({});
  const [mentionSearch, setMentionSearch] = useState<Record<string, string>>({});
  const [mentionPosition, setMentionPosition] = useState<Record<string, number>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const sortedProgresses = [...progresses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getKeyResultById = (id: string): KeyResult | undefined => {
    return keyResults.find((kr) => kr.id === id);
  };

  const getGoalById = (id: string) => {
    return goals.find((g) => g.id === id);
  };

  const toggleExpand = (progressId: string) => {
    setExpandedProgressId((prev) => (prev === progressId ? null : progressId));
  };

  const handleCommentChange = (progressId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [progressId]: value }));

    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === value.length - 1) {
      setShowMentionList((prev) => ({ ...prev, [progressId]: true }));
      setMentionSearch((prev) => ({ ...prev, [progressId]: '' }));
      setMentionPosition((prev) => ({ ...prev, [progressId]: atIndex }));
    } else if (atIndex !== -1) {
      const searchText = value.slice(atIndex + 1);
      if (!searchText.includes(' ')) {
        setShowMentionList((prev) => ({ ...prev, [progressId]: true }));
        setMentionSearch((prev) => ({ ...prev, [progressId]: searchText }));
        setMentionPosition((prev) => ({ ...prev, [progressId]: atIndex }));
      } else {
        setShowMentionList((prev) => ({ ...prev, [progressId]: false }));
      }
    } else {
      setShowMentionList((prev) => ({ ...prev, [progressId]: false }));
    }
  };

  const filteredUsers = (progressId: string) => {
    const search = mentionSearch[progressId] || '';
    if (!search) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleMentionSelect = (progressId: string, user: UserType) => {
    const currentValue = commentInputs[progressId] || '';
    const atPos = mentionPosition[progressId] ?? currentValue.lastIndexOf('@');
    const newValue = currentValue.slice(0, atPos) + `@${user.name} `;

    setCommentInputs((prev) => ({ ...prev, [progressId]: newValue }));
    setShowMentionList((prev) => ({ ...prev, [progressId]: false }));

    setTimeout(() => {
      const textarea = textareaRefs.current[progressId];
      if (textarea) {
        textarea.focus();
        const newCursorPos = newValue.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSubmitComment = (progressId: string) => {
    const content = commentInputs[progressId]?.trim();
    if (!content) return;

    const mentionRegex = /@(\S+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedName = match[1];
      const mentionedUser = users.find((u) => u.name === mentionedName);
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }

    addComment({
      progressId,
      authorId: currentUser.id,
      content,
      mentions,
    });

    setCommentInputs((prev) => ({ ...prev, [progressId]: '' }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, progressId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(progressId);
    }
    if (e.key === 'Escape') {
      setShowMentionList((prev) => ({ ...prev, [progressId]: false }));
    }
  };

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-indigo-600 font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const ProgressCard = ({ progress }: { progress: ProgressItem }) => {
    const author = getUserById(progress.authorId);
    const keyResult = getKeyResultById(progress.keyResultId);
    const comments = getCommentsByProgressId(progress.id);
    const isExpanded = expandedProgressId === progress.id;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <Avatar name={author?.name || '未知'} size="lg" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{author?.name}</span>
                  <span className="text-sm text-gray-400">·</span>
                  <span className="text-sm text-gray-500">更新了</span>
                  {keyResult && (() => {
                    const goal = getGoalById(keyResult.goalId);
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (goal) {
                            setSelectedGoalId(goal.id);
                          }
                          setSelectedKRId(keyResult.id);
                          navigate('/goals');
                        }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <span>「{keyResult.title}」</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })()}
                  <span className="text-sm text-gray-500">的进度</span>
                </div>
                <span
                  className="text-xs text-gray-400"
                  title={formatDateTime(progress.createdAt)}
                >
                  {formatRelativeTime(progress.createdAt)}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">进度</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {progress.progressPercent}%
                  </span>
                </div>
                <ProgressBar percent={progress.progressPercent} size="md" />
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {progress.content}
              </p>

              {progress.attachments.length > 0 && (
                <div className="mb-4 space-y-2">
                  {progress.attachments.map((att) => (
                    <div
                      key={att.id}
                      onClick={() => alert(`开始下载：${att.name}`)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {att.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => toggleExpand(progress.id)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{comments.length} 条评论</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="p-5 space-y-4">
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const commentAuthor = getUserById(comment.authorId);
                    return (
                      <div
                        key={comment.id}
                        className="flex gap-3 pl-4 border-l-2 border-indigo-200"
                      >
                        <Avatar name={commentAuthor?.name || '未知'} size="sm" />
                        <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {commentAuthor?.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {renderCommentContent(comment.content)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <div className="flex gap-3">
                  <Avatar name={currentUser.name} size="sm" />
                  <div className="flex-1 relative">
                    <textarea
                      ref={(el) => {
                        textareaRefs.current[progress.id] = el;
                      }}
                      value={commentInputs[progress.id] || ''}
                      onChange={(e) =>
                        handleCommentChange(progress.id, e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, progress.id)}
                      placeholder="写下你的评论... 输入 @ 可以提及同事"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                      rows={2}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        按 Enter 发送，Shift + Enter 换行
                      </span>
                      <button
                        onClick={() => handleSubmitComment(progress.id)}
                        disabled={!commentInputs[progress.id]?.trim()}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          commentInputs[progress.id]?.trim()
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <Send className="w-4 h-4" />
                        发送
                      </button>
                    </div>

                    {showMentionList[progress.id] &&
                      filteredUsers(progress.id).length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                          <div className="p-2 border-b border-gray-100">
                            <p className="text-xs text-gray-500">选择要提及的同事</p>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredUsers(progress.id).map((user) => (
                              <button
                                key={user.id}
                                onClick={() => handleMentionSelect(progress.id, user)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 transition-colors text-left"
                              >
                                <Avatar name={user.name} size="sm" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.department}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SubmitProgressModal = () => {
    const [selectedKR, setSelectedKR] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: Attachment[] = Array.from(files).map((file) => ({
        id: generateId(),
        name: file.name,
        url: '#',
        size: file.size,
        type: file.type,
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const removeAttachment = (id: string) => {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const handleSubmit = () => {
      if (!selectedKR || !content.trim()) return;

      const kr = getKeyResultById(selectedKR);
      if (!kr) return;

      const currentValue = (progressPercent / 100) * kr.targetValue;

      addProgress({
        keyResultId: selectedKR,
        authorId: currentUser.id,
        progressPercent,
        content: content.trim(),
        attachments,
      });

      updateKeyResult(selectedKR, { currentValue });

      setShowSubmitModal(false);
      setSelectedKR('');
      setProgressPercent(0);
      setContent('');
      setAttachments([]);
    };

    const krOptions = keyResults.map((kr) => {
      const goal = getGoalById(kr.goalId);
      return {
        value: kr.id,
        label: goal ? `${goal.title} - ${kr.title}` : kr.title,
      };
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">提交进展</h3>
            <button
              onClick={() => setShowSubmitModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关联关键结果
              </label>
              <select
                value={selectedKR}
                onChange={(e) => setSelectedKR(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">请选择关键结果</option>
                {krOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                进度百分比
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">0%</span>
                  <span className="text-sm font-semibold text-indigo-600">
                    {progressPercent}%
                  </span>
                  <span className="text-xs text-gray-500">100%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                进展说明 <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="描述本周的进展、遇到的问题和下周计划..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                佐证文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-gray-400 mt-1">支持图片、文档等格式</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {att.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedKR || !content.trim()}
              className={cn(
                'px-5 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                selectedKR && content.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              提交进展
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="进展" subtitle="进度更新与讨论">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              共 {progresses.length} 条进展更新
            </p>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            提交进展
          </button>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-6">
            {sortedProgresses.map((progress) => (
              <div key={progress.id} className="relative pl-14">
                <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm" />
                <ProgressCard progress={progress} />
              </div>
            ))}
          </div>
        </div>

        {sortedProgresses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">暂无进展更新</p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              提交第一条进展
            </button>
          </div>
        )}
      </div>

      {showSubmitModal && <SubmitProgressModal />}
    </Layout>
  );
};
