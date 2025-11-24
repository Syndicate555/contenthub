import { Suspense } from "react";
import ItemsPageClient from "./ItemsPageClient";

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading items...</div>}>
      <ItemsPageClient />
    </Suspense>
  );
}
