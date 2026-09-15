import { useState, useEffect } from 'react';
import {
  Users, Plus, Briefcase, UserPlus, Trash2, MessageSquare,
  Send, FileText, CornerDownRight
} from 'lucide-react';
import { workspaceApi, commentApi } from '../services/api';
import type { WorkspaceItem, WorkspaceMemberItem, CommentItem } from '../types';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceItem | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
  const [workspaceSummaries, setWorkspaceSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Workspace form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite member form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [inviting, setInviting] = useState(false);

  // Active Summary Comments
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceDetails(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await workspaceApi.getAll();
      setWorkspaces(res.data);
      if (res.data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceDetails = async (wsId: number) => {
    try {
      const [wsRes, sumRes] = await Promise.allSettled([
        workspaceApi.getById(wsId),
        workspaceApi.getSummaries(wsId),
      ]);
      if (wsRes.status === 'fulfilled') {
        const fullWs: any = wsRes.value.data;
        if (fullWs.members) {
          setMembers(fullWs.members);
        }
      }
      if (sumRes.status === 'fulfilled') {
        setWorkspaceSummaries(sumRes.value.data);
        if (sumRes.value.data.length > 0) {
          loadComments(sumRes.value.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load workspace details:', err);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      setCreating(true);
      const res = await workspaceApi.create({
        name: newWsName.trim(),
        description: newWsDesc.trim(),
      });
      setShowCreateModal(false);
      setNewWsName('');
      setNewWsDesc('');
      await loadWorkspaces();
      setSelectedWorkspace(res.data);
    } catch (err) {
      console.error('Failed to create workspace:', err);
      alert('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !inviteEmail.trim()) return;
    try {
      setInviting(true);
      await workspaceApi.addMember(selectedWorkspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
      loadWorkspaceDetails(selectedWorkspace.id);
    } catch (err) {
      console.error('Failed to invite member:', err);
      alert('Failed to invite member. Ensure the user is registered.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedWorkspace) return;
    if (!confirm('Remove this teammate from the workspace?')) return;
    try {
      await workspaceApi.removeMember(selectedWorkspace.id, memberId);
      loadWorkspaceDetails(selectedWorkspace.id);
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove member');
    }
  };

  const loadComments = async (summaryId: number) => {
    setSelectedSummaryId(summaryId);
    try {
      const res = await commentApi.getComments(summaryId);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSummaryId || !newCommentText.trim()) return;
    try {
      await commentApi.addComment(selectedSummaryId, {
        text: newCommentText.trim(),
      });
      setNewCommentText('');
      loadComments(selectedSummaryId);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleAddReply = async (commentId: number) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim() || !selectedSummaryId) return;
    try {
      await commentApi.addReply(commentId, { text: text.trim() });
      setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyId(null);
      loadComments(selectedSummaryId);
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const handleToggleResolve = async (commentId: number) => {
    if (!selectedSummaryId) return;
    try {
      await commentApi.toggleResolve(commentId);
      loadComments(selectedSummaryId);
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Team Workspaces & Collaboration
            </h1>
          </div>
          <p className="text-surface-500 text-sm">
            Share syntheses, review source references, and discuss key insights in team-oriented workspaces.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary !py-2.5 !px-4 text-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 border border-surface-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-surface-900">New Team Workspace</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-surface-400 hover:text-surface-700 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div>
                <label htmlFor="ws-name" className="block text-xs font-semibold text-surface-700 mb-1">
                  Workspace Name
                </label>
                <input
                  id="ws-name"
                  type="text"
                  placeholder="e.g. Q3 Research Sprint, Legal Ops"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="input-field text-xs"
                  required
                />
              </div>
              <div>
                <label htmlFor="ws-desc" className="block text-xs font-semibold text-surface-700 mb-1">
                  Description
                </label>
                <textarea
                  id="ws-desc"
                  rows={3}
                  placeholder="Shared synthesis environment for cross-functional deliverables..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="input-field text-xs resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                {creating ? 'Creating Workspace...' : 'Create Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Workspace Selector Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400 px-1">
            Workspaces ({workspaces.length})
          </h3>
          {loading ? (
            <div className="text-xs text-surface-400 p-4 text-center">Loading workspaces...</div>
          ) : workspaces.length === 0 ? (
            <div className="p-5 text-center text-xs text-surface-400 border border-dashed border-surface-200 rounded-xl">
              No workspaces found. Click "Create Workspace" above.
            </div>
          ) : (
            <div className="space-y-1.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => setSelectedWorkspace(ws)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    selectedWorkspace?.id === ws.id
                      ? 'bg-primary-50/80 border-primary-300 text-primary-900 shadow-2xs'
                      : 'bg-white border-surface-200/80 text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-xs truncate">{ws.name}</div>
                    <div className="text-[11px] text-surface-400 truncate">
                      {ws.description || 'No description'}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 shrink-0">
                    {ws.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Workspace Content Column */}
        {selectedWorkspace ? (
          <div className="lg:col-span-3 space-y-6">
            {/* Workspace Banner */}
            <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-surface-900">{selectedWorkspace.name}</h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800">
                    Role: {selectedWorkspace.role}
                  </span>
                </div>
                <p className="text-xs text-surface-500 mt-1">
                  {selectedWorkspace.description || 'Shared collaborative synthesis workspace'}
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs font-semibold text-surface-600">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span>{members.length || selectedWorkspace.memberCount} Members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span>{workspaceSummaries.length} Summaries</span>
                </div>
              </div>
            </div>

            {/* Teammates & Invites */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-surface-900">
                  <Users className="w-4 h-4 text-primary-600" />
                  <h3>Workspace Members</h3>
                </div>

                {/* Invite Form */}
                <form onSubmit={handleInviteMember} className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="teammate@organization.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field text-xs !py-1.5 w-52"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input-field text-xs !py-1.5 w-24"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn-primary !py-1.5 !px-3 text-xs shrink-0 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </form>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-surface-400 font-semibold uppercase text-[10px] border-b border-surface-100">
                      <th className="py-2 px-3">Name / User</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Joined</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2.5 px-3 font-semibold text-surface-800">{m.name || 'Member'}</td>
                        <td className="py-2.5 px-3 text-surface-500 font-mono text-[11px]">{m.email}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.role === 'OWNER'
                              ? 'bg-purple-100 text-purple-800'
                              : m.role === 'EDITOR'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-surface-100 text-surface-700'
                          }`}>
                            {m.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-surface-400 text-[11px]">
                          {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {m.role !== 'OWNER' && (
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Remove Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workspace Summaries & Collaborative Comments */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Summaries in Workspace */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-surface-900">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <h3>Workspace Documents & Summaries</h3>
                  </div>
                  <span className="text-[11px] text-surface-400 font-semibold">{workspaceSummaries.length} items</span>
                </div>

                {workspaceSummaries.length === 0 ? (
                  <p className="text-xs text-surface-400 py-6 text-center">
                    No summaries generated in this workspace yet. Ingest documents or generate text summaries to share here.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {workspaceSummaries.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => loadComments(s.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedSummaryId === s.id
                            ? 'bg-primary-50/70 border-primary-300 shadow-2xs'
                            : 'bg-surface-50/50 border-surface-200/80 hover:bg-surface-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-surface-900 line-clamp-1">{s.title || 'Untitled Summary'}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-200 text-surface-700 uppercase">
                            {s.mode}
                          </span>
                        </div>
                        <p className="text-[11px] text-surface-500 mt-1 line-clamp-2">
                          {s.summaryText}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-200/40 text-[10px] text-surface-400">
                          <span>Persona: {s.persona || 'General'}</span>
                          <span className="text-primary-700 font-semibold">Click to open discussion</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Comments & Threads */}
              <div className="card space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-surface-900">
                      <MessageSquare className="w-4 h-4 text-primary-600" />
                      <h3>Team Discussions</h3>
                    </div>
                    {selectedSummaryId && (
                      <span className="text-[11px] font-mono text-surface-400">
                        Summary #{selectedSummaryId}
                      </span>
                    )}
                  </div>

                  {!selectedSummaryId ? (
                    <p className="text-xs text-surface-400 py-8 text-center italic">
                      Select a summary to view or add discussion notes.
                    </p>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-surface-400 py-8 text-center">
                      No comments on this summary yet. Start the conversation below!
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 ${
                            c.resolved
                              ? 'bg-surface-50/70 border-surface-200 opacity-60'
                              : 'bg-white border-surface-200/90 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-surface-800">{c.userName || 'Teammate'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-surface-400">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => handleToggleResolve(c.id)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  c.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-100 text-surface-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                {c.resolved ? 'Resolved' : 'Resolve'}
                              </button>
                            </div>
                          </div>
                          <p className="text-surface-700 leading-relaxed">{c.text}</p>

                          {/* Replies */}
                          {c.replies && c.replies.length > 0 && (
                            <div className="pl-3 border-l-2 border-primary-200 space-y-1.5 pt-1">
                              {c.replies.map((r) => (
                                <div key={r.id} className="text-[11px]">
                                  <span className="font-bold text-surface-800 mr-1.5">{r.userName || 'User'}:</span>
                                  <span className="text-surface-600">{r.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Reply input */}
                          <div className="pt-1">
                            {activeReplyId === c.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={replyTextMap[c.id] || ''}
                                  onChange={(e) => setReplyTextMap({ ...replyTextMap, [c.id]: e.target.value })}
                                  className="input-field !py-1 text-xs"
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddReply(c.id)}
                                />
                                <button
                                  onClick={() => handleAddReply(c.id)}
                                  className="btn-primary !py-1 !px-2.5 text-xs"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => setActiveReplyId(null)}
                                  className="text-surface-400 text-xs px-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveReplyId(c.id)}
                                className="text-[10px] text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1"
                              >
                                <CornerDownRight className="w-3 h-3" /> Reply
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Comment Input */}
                {selectedSummaryId && (
                  <form onSubmit={handleAddComment} className="pt-3 border-t border-surface-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a team note or feedback on this synthesis..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="input-field text-xs !py-2 flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="btn-primary !py-2 !px-3.5 text-xs flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
