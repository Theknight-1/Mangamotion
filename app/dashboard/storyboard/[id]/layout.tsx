import { StoryboardStepsSidebar } from "@/components/storyboard/steps-sidebar";

interface StoryboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function StoryboardProjectLayout({
  children,
  params,
}: StoryboardLayoutProps) {
  const { id } = await params;

  return (
    <div className="flex h-screen overflow-hidden bg-[#060e06]">
      <StoryboardStepsSidebar projectId={id} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
