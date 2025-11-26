import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <div className="flex bg-dark min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Topbar />
        <main className="p-3 sm:p-4 lg:p-6 flex-1 overflow-x-auto overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

