import { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  FileText,
  CheckSquare,
  Plus,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn, formatDate, formatDateTime, formatShortDate } from '../utils/helpers';
import type { Meeting, ActionItem } from '../types';

const renderMarkdown = (text: string): string => {
  let html = text;
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-gray-900 mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700 leading-relaxed list-disc">$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-gray-700 leading-relaxed list-decimal">$1</li>');
  html = html.replace(/(<li.*<\/li>)/gs, '<ul class="space-y-1 my-2">$1</ul>');
  html = html.replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-3">');
  html = html.replace(/\n/g, '<br />');
  return `<p class="text-gray-700 leading-relaxed mb-3">${html}</p>`;
};

export const Meetings = () => {
  const { meetings, getUserById } = useStore();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [localActionItems, setLocalActionItems] = useState<Record<string, boolean>>({});

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [meetings]);

  const selectedMeeting = useMemo(() => {
    if (!selectedMeetingId) return null;
    return meetings.find((m) => m.id === selectedMeetingId) || null;
  }, [selectedMeetingId, meetings]);

  const handleMeetingClick = (meetingId: string) => {
    setSelectedMeetingId(meetingId === selectedMeetingId ? null : meetingId);
  };

  const toggleActionItem = (actionItemId: string, currentCompleted: boolean) => {
    setLocalActionItems((prev) => ({
      ...prev,
      [actionItemId]: prev[actionItemId] !== undefined ? !prev[actionItemId] : !currentCompleted,
    }));
  };

  const isActionItemCompleted = (item: ActionItem) => {
    if (localActionItems[item.id] !== undefined) {
      return localActionItems[item.id];
    }
    return item.completed;
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const isSelected = selectedMeetingId === meeting.id;
    const attendeeCount = meeting.attendees.length;
    const actionItemCount = meeting.actionItems.length;
    const completedCount = meeting.actionItems.filter((item) =>
      isActionItemCompleted(item)
    ).length;

    return (
      <div
        onClick={() => handleMeetingClick(meeting.id)}
        className={cn(
          'p-4 rounded-xl border cursor-pointer transition-all duration-200',
          isSelected
            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
            : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30'
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-medium text-gray-900 flex-1 line-clamp-2">
            {meeting.title}
          </h3>
          <ChevronRight
            className={cn(
              'w-4 h-4 shrink-0 transition-transform duration-200',
              isSelected ? 'text-indigo-500 rotate-90' : 'text-gray-300'
            )}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatShortDate(meeting.date)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>{attendeeCount}人</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {completedCount}/{actionItemCount}
              </span>
            </div>
          </div>

          <div className="flex -space-x-2">
            {meeting.attendees.slice(0, 3).map((attendeeId) => {
              const user = getUserById(attendeeId);
              return user ? (
                <Avatar
                  key={attendeeId}
                  name={user.name}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ) : null;
            })}
            {attendeeCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-xs text-gray-500 font-medium">
                +{attendeeCount - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ActionItemRow = ({ item }: { item: ActionItem }) => {
    const assignee = getUserById(item.assigneeId);
    const completed = isActionItemCompleted(item);
    const isOverdue = new Date(item.dueDate) < new Date() && !completed;

    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg transition-colors duration-200',
          'hover:bg-gray-50'
        )}
      >
        <button
          onClick={() => toggleActionItem(item.id, item.completed)}
          className={cn(
            'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200',
            completed
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : 'border-gray-300 hover:border-indigo-400'
          )}
        >
          {completed && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm leading-relaxed',
              completed ? 'text-gray-400 line-through' : 'text-gray-700'
            )}
          >
            {item.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar name={assignee.name} size="sm" />
                <span className="text-xs text-gray-500">{assignee.name}</span>
              </div>
            )}
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-rose-500' : 'text-gray-400'
              )}
            >
              <Clock className="w-3 h-3" />
              <span>{formatShortDate(item.dueDate)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MeetingDetail = ({ meeting }: { meeting: Meeting }) => {
    const attendees = meeting.attendees
      .map((id) => getUserById(id))
      .filter(Boolean);
    const completedCount = meeting.actionItems.filter((item) =>
      isActionItemCompleted(item)
    ).length;
    const totalCount = meeting.actionItems.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{meeting.title}</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(meeting.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDateTime(meeting.date).split(' ')[1]}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-indigo-500" />
              参会人员 ({attendees.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {attendees.map((user) =>
                user ? (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.department}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-indigo-500" />
              会议纪要
            </h3>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(meeting.notes) }}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                行动项 ({completedCount}/{totalCount})
              </h3>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              {meeting.actionItems.map((item) => (
                <ActionItemRow key={item.id} item={item} />
              ))}
              {meeting.actionItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无行动项
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EmptyDetail = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="w-10 h-10" />
      </div>
      <p className="text-base font-medium text-gray-600">选择会议查看详情</p>
      <p className="text-sm text-gray-400 mt-1">从左侧列表选择一个会议</p>
    </div>
  );

  return (
    <Layout title="会议" subtitle="会议纪要与行动项">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-900">{meetings.length}</span>{' '}
          场会议
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors duration-200 shadow-sm">
          <Plus className="w-4 h-4" />
          创建会议
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        <div className="w-[35%] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {sortedMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {sortedMeetings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-base font-medium text-gray-600">暂无会议</p>
                <p className="text-sm text-gray-400 mt-1">点击上方按钮创建会议</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-[65%] bg-white rounded-xl border border-gray-100 p-6 overflow-hidden">
          {selectedMeeting ? (
            <MeetingDetail meeting={selectedMeeting} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Meetings;
