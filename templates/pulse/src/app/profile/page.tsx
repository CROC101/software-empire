import ProfileView from '@/components/profile/ProfileView';
import { ME } from '@/data/seed-tiktok';

export default function MyProfile() {
  return <ProfileView handle={ME} />;
}
