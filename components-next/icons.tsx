// Phosphor's light family, selected from 21st.dev. MIT licensed by Phosphor Icons.
// SSR variants keep the same small SVGs usable in server and client components.
import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  BroadcastIcon,
  CheckIcon,
  CopyIcon,
  DiscIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FileImageIcon,
  FilmSlateIcon,
  FloppyDiskIcon,
  FolderOpenIcon,
  ImageIcon as PictureIcon,
  LinkSimpleIcon,
  LockSimpleIcon,
  MoonIcon,
  PencilSimpleIcon,
  PenNibIcon,
  PlusIcon,
  ScanIcon,
  SignOutIcon,
  SparkleIcon,
  SpinnerGapIcon,
  SunIcon,
  SwapIcon,
  TrashIcon,
  UploadSimpleIcon,
  XIcon,
  ListIcon,
} from "@phosphor-icons/react/ssr";

function lightIcon(Component: Icon) {
  return function SiteIcon(props: IconProps) {
    return <Component weight="light" aria-hidden="true" {...props} />;
  };
}
export const Archive = lightIcon(ArchiveIcon);
export const ArrowLeft = lightIcon(ArrowLeftIcon);
export const ArrowRight = lightIcon(ArrowRightIcon);
export const ExternalLink = lightIcon(ArrowSquareOutIcon);
export const RefreshCw = lightIcon(ArrowsClockwiseIcon);
export const Megaphone = lightIcon(BroadcastIcon);
export const Check = lightIcon(CheckIcon);
export const Copy = lightIcon(CopyIcon);
export const Disc3 = lightIcon(DiscIcon);
export const Download = lightIcon(DownloadSimpleIcon);
export const Eye = lightIcon(EyeIcon);
export const FileImage = lightIcon(FileImageIcon);
export const Clapperboard = lightIcon(FilmSlateIcon);
export const Save = lightIcon(FloppyDiskIcon);
export const FolderOpen = lightIcon(FolderOpenIcon);
export const ImageIcon = lightIcon(PictureIcon);
export const Link2 = lightIcon(LinkSimpleIcon);
export const Lock = lightIcon(LockSimpleIcon);
export const Moon = lightIcon(MoonIcon);
export const Pencil = lightIcon(PencilSimpleIcon);
export const PenTool = lightIcon(PenNibIcon);
export const Plus = lightIcon(PlusIcon);
export const ScanLine = lightIcon(ScanIcon);
export const LogOut = lightIcon(SignOutIcon);
export const Sparkles = lightIcon(SparkleIcon);
export const Loader2 = lightIcon(SpinnerGapIcon);
export const Sun = lightIcon(SunIcon);
export const FlipHorizontal = lightIcon(SwapIcon);
export const Trash2 = lightIcon(TrashIcon);
export const Upload = lightIcon(UploadSimpleIcon);
export const X = lightIcon(XIcon);
export const Menu = lightIcon(ListIcon);
