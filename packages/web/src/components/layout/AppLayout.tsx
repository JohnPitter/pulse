import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

export function AppLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#2E2E31]">
      <div className="flex h-full w-full overflow-hidden bg-[#E7E5E2] shadow-[0_26px_70px_rgba(0,0,0,0.45)]">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="min-h-0 flex-1 overflow-auto p-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
