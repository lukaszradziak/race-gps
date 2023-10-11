import { Outlet } from "react-router-dom";
import { Header } from "../components/Header.tsx";

export function Root() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="p-4 max-w-screen-sm mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
