import { Suspense, lazy } from "react";
import type { ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootRedirect } from "./components/RootRedirect";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const DashboardLayout = lazy(() =>
  import("./features/fixdesk/layout/DashboardLayout").then((m) => ({
    default: m.DashboardLayout,
  })),
);
const DashboardHome = lazy(() =>
  import("./features/fixdesk/pages/DashboardHome").then((m) => ({
    default: m.DashboardHome,
  })),
);
const CustomerPage = lazy(() =>
  import("./features/fixdesk/pages/CustomerPage").then((m) => ({
    default: m.CustomerPage,
  })),
);
const RepairPage = lazy(() =>
  import("./features/fixdesk/pages/RepairPage").then((m) => ({
    default: m.RepairPage,
  })),
);
const AccessoriesPage = lazy(() =>
  import("./features/fixdesk/pages/AccessoriesPage").then((m) => ({
    default: m.AccessoriesPage,
  })),
);
const InventoryPage = lazy(() =>
  import("./features/fixdesk/pages/InventoryPage").then((m) => ({
    default: m.InventoryPage,
  })),
);
const InventoryCreatePage = lazy(() =>
  import("./features/fixdesk/pages/InventoryCreatePage").then((m) => ({
    default: m.InventoryCreatePage,
  })),
);
const InventoryListPage = lazy(() =>
  import("./features/fixdesk/pages/InventoryListPage").then((m) => ({
    default: m.InventoryListPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./features/fixdesk/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

function withSuspense(node: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      {node}
    </Suspense>
  );
}
import { SearchPage } from "./features/fixdesk/pages/SearchPage";
import { AccountsPage } from "./features/fixdesk/pages/AccountsPage";

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/login", element: withSuspense(<Login />) },
  { path: "/register", element: withSuspense(<Register />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: withSuspense(<DashboardLayout />),
        children: [
          { index: true, element: withSuspense(<DashboardHome />) },
          { path: "customer", element: withSuspense(<CustomerPage />) },
          { path: "repair", element: withSuspense(<RepairPage />) },
          { path: "accessories", element: withSuspense(<AccessoriesPage />) },
          {
            path: "inventory",
            children: [
              { index: true, element: withSuspense(<InventoryPage />) },
              {
                path: ":slug/create",
                element: withSuspense(<InventoryCreatePage />),
              },
              {
                path: ":slug/list",
                element: withSuspense(<InventoryListPage />),
              },
            ],
          },
          { path: "settings", element: withSuspense(<SettingsPage />) },
          { path: "search", element: <SearchPage /> },
          { path: "accounts", element: <AccountsPage /> },
        ],
      },
    ],
  },
]);
