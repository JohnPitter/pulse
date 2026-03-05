import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#DCDCDA] flex items-center justify-center p-4">
      <div className="flex w-full max-w-[1400px] h-[calc(100vh-32px)] rounded-3xl bg-[#EEECEA] overflow-hidden shadow-2xl">
        {/* Sidebar */}
        <AppSidebar />

        {/* Content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppTopbar />
          <main className="flex-1 min-h-0 overflow-auto px-4 pb-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
