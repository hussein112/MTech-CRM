import { cookies } from "next/headers";
import ClientLayout from "./ClientLayout";
import "./partner/partner.css"

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const sidebarCollapsed = cookieStore.get("mtech-partner-sidebar-collapsed")?.value === "true";

    return (
        <ClientLayout initialCollapsed={sidebarCollapsed}>
            {children}
        </ClientLayout>
    );
}