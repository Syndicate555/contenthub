import {
  StructuredData,
  organizationSchema,
  websiteSchema,
} from "@/components/structured-data";

export default function Head() {
  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
    </>
  );
}
