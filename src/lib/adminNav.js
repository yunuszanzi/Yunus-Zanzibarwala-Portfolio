import {
  BarChart3,
  Bot,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Layers,
  MessagesSquare,
  Rocket,
  Settings,
  Sparkles,
  Wrench,
} from 'lucide-react'

/** Admin sidebar entries. `path` is relative to /admin. */
export const ADMIN_NAV = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: 'settings', label: 'Site settings', icon: Settings },
  { path: 'projects', label: 'Projects', icon: FolderKanban },
  { path: 'categories', label: 'Project categories', icon: Layers },
  { path: 'stats', label: 'Stats', icon: BarChart3 },
  { path: 'services', label: 'What I do', icon: Sparkles },
  { path: 'skills', label: 'Skill groups', icon: Wrench },
  { path: 'experience', label: 'Experience', icon: Briefcase },
  { path: 'education', label: 'Education', icon: GraduationCap },
  { path: 'also-shipped', label: 'Also shipped', icon: Rocket },
  { path: 'chat-replies', label: 'Chat replies', icon: Bot },
  { path: 'chats', label: 'Chats', icon: MessagesSquare },
  { path: 'messages', label: 'Messages', icon: Inbox },
]
