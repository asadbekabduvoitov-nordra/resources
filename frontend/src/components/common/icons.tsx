import {
  LayoutDashboard,
  FileText,
  Users,
  Send,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image,
  Video,
  File,
  FileQuestion,
  Eye,
  EyeOff,
  Loader2,
  Menu,
  Moon,
  Sun,
  Settings,
  LogOut,
  Music,
  Play,
  Square,
  Clock,
  CheckCircle,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  // Navigation
  dashboard: LayoutDashboard,
  resources: FileText,
  users: Users,
  broadcasts: Send,
  settings: Settings,
  logout: LogOut,
  menu: Menu,

  // Actions
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  more: MoreHorizontal,
  search: Search,
  close: X,
  check: Check,
  upload: Upload,
  view: Eye,
  hide: EyeOff,

  // Navigation
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,

  // Media types
  image: Image,
  video: Video,
  audio: Music,
  file: File,
  none: FileQuestion,

  // State
  spinner: Loader2,

  // Status
  pending: Clock,
  completed: CheckCircle,
  failed: AlertCircle,
  play: Play,
  stop: Square,

  // Theme
  moon: Moon,
  sun: Sun,
} as const;
