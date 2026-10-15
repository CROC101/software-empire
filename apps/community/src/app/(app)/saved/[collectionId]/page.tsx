import { useParams } from "@/lib/router";
import { CollectionView } from "../saved-views";

export default function CollectionPage() {
  const { collectionId = "" } = useParams<{ collectionId: string }>();

  return <CollectionView collectionId={decodeURIComponent(collectionId)} />;
}
