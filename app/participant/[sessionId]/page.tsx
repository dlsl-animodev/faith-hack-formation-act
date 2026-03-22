import { ParticipantShell } from "@/components/participant/ParticipantShell";

interface PageProps {
  params: { sessionId: string };
}

export default function ParticipantPage({ params }: PageProps) {
  return <ParticipantShell sessionId={params.sessionId} />;
}
