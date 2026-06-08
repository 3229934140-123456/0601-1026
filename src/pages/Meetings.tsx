import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileText,
  CheckSquare,
  Plus,
  Clock,
  ChevronRight,
  Check,
  Trash2,
  PlusCircle,
  Target,
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { cn, formatDate, formatDateTime, formatShortDate } from '../utils/helpers';
import { Modal, Button, Input, Textarea, Select } from '../components/Modal';
import type { Meeting, ActionItem } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

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

interface NewActionItemForm {
  id: string;
  content: string;
  assigneeId: string;
  dueDate: string;
  syncToTask: boolean;
  krId: string;
}

export const Meetings = () => {
  const {
    meetings,
    users,
    keyResults,
    getUserById,
    getGoalById,
    addMeeting,
    updateMeeting,
    addActionItemWithTask,
    toggleActionItemComplete,
  } = useStore();
  const navigate = useNavigate();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddActionItemOpen, setIsAddActionItemOpen] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formActionItems, setFormActionItems] = useState<NewActionItemForm[]>([]);
  const [formErrors, setFormErrors] = useState<{ title?: string }>({});

  const [newActionItemContent, setNewActionItemContent] = useState('');
  const [newActionItemAssignee, setNewActionItemAssignee] = useState('');
  const [newActionItemDueDate, setNewActionItemDueDate] = useState('');
  const [newActionItemSyncToTask, setNewActionItemSyncToTask] = useState(false);
  const [newActionItemKrId, setNewActionItemKrId] = useState('');

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [meetings]);

  const keyResultOptions = useMemo(() => {
    return keyResults.map((kr) => {
      const goal = getGoalById(kr.goalId);
      return {
        value: kr.id,
        label: goal ? `${goal.title} - ${kr.title}` : kr.title,
      };
    });
  }, [keyResults, getGoalById]);

  const selectedMeeting = useMemo(() => {
    if (!selectedMeetingId) return null;
    return meetings.find((m) => m.id === selectedMeetingId) || null;
  }, [selectedMeetingId, meetings]);

  const handleMeetingClick = (meetingId: string) => {
    setSelectedMeetingId(meetingId === selectedMeetingId ? null : meetingId);
  };

  const toggleActionItem = (meetingId: string, actionItemId: string) => {
    toggleActionItemComplete(meetingId, actionItemId);
  };

  const handleDeleteActionItem = (meetingId: string, actionItemId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (meeting) {
      const newActionItems = meeting.actionItems.filter((item) => item.id !== actionItemId);
      updateMeeting(meetingId, { actionItems: newActionItems });
    }
  };

  const openCreateModal = () => {
    setFormTitle('');
    setFormDate('');
    setFormTime('');
    setFormAttendees([]);
    setFormNotes('');
    setFormActionItems([]);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const toggleAttendee = (userId: string) => {
    setFormAttendees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const addFormActionItem = () => {
    setFormActionItems((prev) => [
      ...prev,
      { id: generateId(), content: '', assigneeId: '', dueDate: '', syncToTask: false, krId: '' },
    ]);
  };

  const removeFormActionItem = (id: string) => {
    setFormActionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateFormActionItem = (id: string, field: keyof NewActionItemForm, value: string | boolean) => {
    setFormActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCreateMeeting = () => {
    const errors: { title?: string } = {};
    if (!formTitle.trim()) {
      errors.title = '请输入会议标题';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const dateTime = formDate && formTime ? `${formDate}T${formTime}:00` : formDate || new Date().toISOString();

    const newMeeting = {
      title: formTitle,
      date: dateTime,
      attendees: formAttendees,
      notes: formNotes,
      actionItems: [],
    };

    const createdMeeting = addMeeting(newMeeting);

    formActionItems
      .filter((item) => item.content.trim())
      .forEach((item) => {
        addActionItemWithTask(
          createdMeeting.id,
          {
            meetingId: createdMeeting.id,
            content: item.content,
            assigneeId: item.assigneeId || users[0]?.id || '',
            dueDate: item.dueDate || new Date().toISOString().split('T')[0],
            completed: false,
          },
          item.syncToTask,
          item.krId
        );
      });

    setIsCreateModalOpen(false);
    setSelectedMeetingId(createdMeeting.id);
  };

  const openAddActionItem = () => {
    setNewActionItemContent('');
    setNewActionItemAssignee('');
    setNewActionItemDueDate('');
    setNewActionItemSyncToTask(false);
    setNewActionItemKrId('');
    setIsAddActionItemOpen(true);
  };

  const handleAddActionItem = () => {
    if (!newActionItemContent.trim() || !selectedMeetingId) return;

    addActionItemWithTask(
      selectedMeetingId,
      {
        meetingId: selectedMeetingId,
        content: newActionItemContent,
        assigneeId: newActionItemAssignee || users[0]?.id || '',
        dueDate: newActionItemDueDate || new Date().toISOString().split('T')[0],
        completed: false,
      },
      newActionItemSyncToTask,
      newActionItemKrId
    );

    setIsAddActionItemOpen(false);
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const isSelected = selectedMeetingId === meeting.id;
    const attendeeCount = meeting.attendees.length;
    const actionItemCount = meeting.actionItems.length;
    const completedCount = meeting.actionItems.filter((item) => item.completed).length;

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

  const ActionItemRow = ({ item, meetingId }: { item: ActionItem; meetingId: string }) => {
    const assignee = getUserById(item.assigneeId);
    const isOverdue = new Date(item.dueDate) < new Date() && !item.completed;

    const handleTaskClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate('/tasks');
    };

    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 group',
          'hover:bg-gray-50'
        )}
      >
        <button
          onClick={() => toggleActionItem(meetingId, item.id)}
          className={cn(
            'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200',
            item.completed
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : 'border-gray-300 hover:border-indigo-400'
          )}
        >
          {item.completed && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                'text-sm leading-relaxed flex-1',
                item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
              )}
            >
              {item.content}
            </p>
            {item.taskId && (
              <button
                onClick={handleTaskClick}
                className="shrink-0 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="已同步为任务，点击跳转到任务页面"
              >
                <Target className="w-4 h-4" />
              </button>
            )}
          </div>
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

        <button
          onClick={() => handleDeleteActionItem(meetingId, item.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const MeetingDetail = ({ meeting }: { meeting: Meeting }) => {
    const attendees = meeting.attendees
      .map((id) => getUserById(id))
      .filter(Boolean);
    const completedCount = meeting.actionItems.filter((item) => item.completed).length;
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
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <button
                  onClick={openAddActionItem}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {meeting.actionItems.map((item) => (
                <ActionItemRow key={item.id} item={item} meetingId={meeting.id} />
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
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors duration-200 shadow-sm"
        >
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建会议"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateMeeting}>创建会议</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="会议标题"
            value={formTitle}
            onChange={setFormTitle}
            placeholder="请输入会议标题"
            error={formErrors.title}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="会议日期"
              type="date"
              value={formDate}
              onChange={setFormDate}
            />
            <Input
              label="会议时间"
              type="time"
              value={formTime}
              onChange={setFormTime}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参会人员
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formAttendees.includes(user.id)}
                    onChange={() => toggleAttendee(user.id)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.department}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label="会议纪要"
            value={formNotes}
            onChange={setFormNotes}
            placeholder="支持 Markdown 格式，例如：# 标题、**加粗**、- 列表项"
            rows={4}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                行动项
              </label>
              <button
                onClick={addFormActionItem}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                添加行动项
              </button>
            </div>
            <div className="space-y-3">
              {formActionItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="行动项内容"
                      value={item.content}
                      onChange={(value) => updateFormActionItem(item.id, 'content', value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={item.assigneeId}
                        onChange={(value) => updateFormActionItem(item.id, 'assigneeId', value)}
                        options={users.map((u) => ({ value: u.id, label: u.name }))}
                        placeholder="选择负责人"
                      />
                      <Input
                        type="date"
                        value={item.dueDate}
                        onChange={(value) => updateFormActionItem(item.id, 'dueDate', value)}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.syncToTask}
                          onChange={(e) => updateFormActionItem(item.id, 'syncToTask', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-600">同步为任务</span>
                      </label>
                      {item.syncToTask && (
                        <Select
                          value={item.krId}
                          onChange={(value) => updateFormActionItem(item.id, 'krId', value)}
                          options={keyResultOptions}
                          placeholder="选择关键结果"
                          className="flex-1"
                        />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFormActionItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formActionItems.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                  点击上方按钮添加行动项
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddActionItemOpen}
        onClose={() => setIsAddActionItemOpen(false)}
        title="添加行动项"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsAddActionItemOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleAddActionItem}>添加</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="行动项内容"
            value={newActionItemContent}
            onChange={setNewActionItemContent}
            placeholder="请输入行动项内容"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="负责人"
              value={newActionItemAssignee}
              onChange={setNewActionItemAssignee}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="选择负责人"
            />
            <Input
              label="截止日期"
              type="date"
              value={newActionItemDueDate}
              onChange={setNewActionItemDueDate}
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newActionItemSyncToTask}
                onChange={(e) => setNewActionItemSyncToTask(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">同步为任务</span>
            </label>
            {newActionItemSyncToTask && (
              <Select
                label="关联关键结果"
                value={newActionItemKrId}
                onChange={setNewActionItemKrId}
                options={keyResultOptions}
                placeholder="请选择关联的关键结果"
              />
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Meetings;
