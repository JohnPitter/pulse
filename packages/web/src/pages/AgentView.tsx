import { useParams } from "react-router-dom";

export function AgentView() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-stone-950 p-6 text-white">
      <h1 className="text-2xl font-bold tracking-tight">Agent {id}</h1>
      <p className="text-stone-400 mt-2 text-sm">Coming soon...</p>
    </div>
  );
}
